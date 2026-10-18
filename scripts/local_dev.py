"""Root setup/runner for the existing local stack; Python standard library only."""

import argparse
import json
import os
from pathlib import Path
import shutil
import signal
import socket
import subprocess
import sys
import time
from urllib.error import URLError
from urllib.parse import urlsplit
from urllib.request import ProxyHandler, build_opener

ROOT = Path(__file__).resolve().parents[1]
BACKENDS = ("phonolex-backend", "emobooks-backend", "trendstock-backend")
LOCAL_URLS = {
    "NEXT_PUBLIC_VITE_PHONOLEX_API": "http://localhost:8000",
    "NEXT_PUBLIC_EMOBOOKS_API_URL": "http://localhost:8010",
    "NEXT_PUBLIC_TRENDSTOCK_API_URL": "http://localhost:5000",
}
HTTP = build_opener(ProxyHandler({}))


class SetupError(RuntimeError):
    pass


def announce(message):
    print(f"\n[local] {message}", flush=True)


def execute(command, cwd=ROOT, **kwargs):
    result = subprocess.run([str(item) for item in command], cwd=cwd, **kwargs)
    if result.returncode:
        raise SetupError(f"Command failed (exit {result.returncode}). See output above.")


def npm():
    executable = shutil.which("npm.cmd" if os.name == "nt" else "npm")
    node_executable = shutil.which("node")
    if not executable or not node_executable:
        raise SetupError("Node.js/npm is missing. Install Node.js 22 LTS, then retry.")
    version = subprocess.check_output([node_executable, "--version"], text=True).strip()
    major, minor = (int(part) for part in version.lstrip("v").split(".")[:2])
    if (major, minor) < (20, 9):
        raise SetupError("The frontend needs Node.js >=20.9. Install Node.js 22 LTS.")
    return executable


def venv_python(backend):
    return ROOT / backend / ".venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")


def dotenv(path):
    """Use python-dotenv itself once installed, including quotes/interpolation."""
    python = venv_python("emobooks-backend")
    if not python.is_file():
        raise SetupError("Virtual environments are missing. Run .\\setup.cmd first.")
    result = subprocess.run(
        [str(python), "-c", "import json,sys; from dotenv import dotenv_values; "
         "print(json.dumps(dotenv_values(sys.argv[1])))", str(path)],
        capture_output=True, text=True, encoding="utf-8", cwd=ROOT,
    )
    if result.returncode:
        raise SetupError("Cannot read configuration. Run .\\setup.cmd to install dependencies.")
    return json.loads(result.stdout)


def create_if_missing(path, content):
    # Exclusive creation prevents overwriting credentials or user configuration.
    try:
        with path.open("x", encoding="utf-8") as target:
            target.write(content)
        announce(f"Created {path.relative_to(ROOT)}; configure its required values.")
    except FileExistsError:
        pass


def setup():
    if sys.version_info[:2] != (3, 11):
        raise SetupError("Use Python 3.11: py -3.11 scripts/local_dev.py setup")
    ensure_setup_idle()
    npm_executable = npm()
    create_if_missing(ROOT / "phonolex-backend/.env", "MY_MONGO_URI=\nLAKINI_MONGO_URI=\n")
    create_if_missing(ROOT / "emobooks-backend/.env",
                      (ROOT / "emobooks-backend/.env.example").read_text(encoding="utf-8"))
    create_if_missing(ROOT / "frontend-web/.env.local",
                      "".join(f"{key}={value}\n" for key, value in LOCAL_URLS.items()))
    for backend in BACKENDS:
        python = venv_python(backend)
        announce(f"Installing {backend} in its own .venv (first setup can take several minutes).")
        if not python.is_file():
            execute([sys.executable, "-m", "venv", ROOT / backend / ".venv"])
        install = [python, "-m", "pip", "install", "--timeout", "60", "--retries", "5"]
        execute([*install, "--upgrade", "pip"])
        if backend == "emobooks-backend":
            # CPU wheels avoid downloading unused CUDA dependencies.
            execute([*install, "torch>=2.6,<3",
                     "--index-url", "https://download.pytorch.org/whl/cpu"])
        requirements = (ROOT / "emobooks-backend/requirements.txt" if backend == "emobooks-backend"
                        else ROOT / "scripts" / f"requirements-{backend.removesuffix('-backend')}-local.txt")
        execute([*install, "-r", requirements])
        execute([python, "-m", "pip", "check"])
    if not (ROOT / "trendstock-backend/.env").exists():
        source = effective_config("phonolex-backend").get("LAKINI_MONGO_URI") or ""
        # PhonoLex selects the trendstock database on this same configured cluster.
        uri = urlsplit(source)._replace(path="/trendstock").geturl() if source else ""
        quoted = uri.replace("\\", "\\\\").replace("'", "\\'")
        create_if_missing(ROOT / "trendstock-backend/.env", f"MONGO_URI='{quoted}'\nPORT=5000\n")
    for folder in ("frontend-web", "trendstock-backend"):
        ensure_setup_idle()
        announce(f"Installing {folder} dependencies from package-lock.json.")
        execute([npm_executable, "ci", "--no-audit", "--no-fund"], cwd=ROOT / folder)
    announce("Installation complete. Existing .env files were preserved. Run .\\start.cmd")


def effective_config(backend):
    values = dotenv(ROOT / backend / ".env")
    if backend == "trendstock-backend":
        # Its existing db.js uses dotenv.config({override: true}).
        return {**os.environ, **values}
    # Match load_dotenv(override=False) used by both existing applications.
    return {**values, **os.environ}


def validate():
    npm()
    for backend in BACKENDS:
        python = venv_python(backend)
        if not python.is_file():
            raise SetupError(f"{backend}/.venv is missing. Run .\\setup.cmd first.")
        imports = "import pandas, sklearn, joblib" if backend == "trendstock-backend" else "import uvicorn, dotenv"
        probe = subprocess.run([str(python), "-c", imports],
                               cwd=ROOT / backend, capture_output=True)
        if probe.returncode:
            raise SetupError(f"{backend} dependencies are incomplete. Run .\\setup.cmd first.")
    if not (ROOT / "frontend-web/node_modules/next/dist/bin/next").is_file():
        raise SetupError("Frontend dependencies are missing. Run .\\setup.cmd first.")
    if not (ROOT / "trendstock-backend/node_modules/express/package.json").is_file():
        raise SetupError("TrendStock dependencies are missing. Run .\\setup.cmd first.")
    for backend, required in (
        ("phonolex-backend", ("MY_MONGO_URI", "LAKINI_MONGO_URI")),
        ("emobooks-backend", ("MONGO_URI", "NEO4J_URI", "NEO4J_PASSWORD")),
        ("trendstock-backend", ("MONGO_URI",)),
    ):
        values = effective_config(backend)
        missing = [key for key in required if not (values.get(key) or "").strip()]
        if missing:
            raise SetupError(f"Set {', '.join(missing)} in {backend}/.env. Values are never printed.")
    values = effective_config("emobooks-backend")
    if (effective_config("trendstock-backend").get("PORT") or "5000") != "5000":
        raise SetupError("Set PORT=5000 in trendstock-backend/.env to match the local dashboard.")
    files = {
        "MODEL_DIR": ("models/final_hierarchical_emotion_model", (
            "config.json", "model_a_best.pt", "model_b_best.pt", "feature_scaler.pkl",
            "encoder/config.json", "tokenizer/tokenizer_config.json", "tokenizer/spm.model")),
        "RECOMMENDER_DIR": ("models/goodreads_hybrid_recommender_v2", ("model_best.pt",)),
        "RECOMMENDER_ENCODER_DIR": ("models/recommender_encoder", (
            "config.json", "modules.json", "model.safetensors", "tokenizer.json", "1_Pooling/config.json")),
    }
    for key, (default, names) in files.items():
        directory = ROOT / "emobooks-backend" / (values.get(key) or default)
        missing = [name for name in names if not (directory / name).is_file()]
        if missing:
            raise SetupError(f"EmoBooks {key} is missing {', '.join(missing)}. See emobooks-backend/README.md.")
    for name in ("transformer_phonolex.h5", "phonolex_dataset.csv", "mega_phonolex_dataset.csv"):
        if not (ROOT / "phonolex-backend" / name).is_file():
            raise SetupError(f"Missing phonolex-backend/{name}; restore the supplied model/dataset.")
    if not (ROOT / "trendstock-backend/ml-service/trend_model.pkl").is_file():
        raise SetupError("Missing trendstock-backend/ml-service/trend_model.pkl; restore the supplied model.")
    announce("Dependencies, configuration and local model files checked.")


def port_open(port, host="127.0.0.1"):
    try:
        with socket.create_connection((host, port), timeout=0.5):
            return True
    except OSError:
        return False


def ensure_ports_free(ports):
    busy = [str(port) for port in ports if port_open(port) or port_open(port, "::1")]
    if busy:
        raise SetupError(f"Ports already in use: {', '.join(busy)}. Stop those servers before starting this stack.")


def windows_workspace_node_processes():
    if os.name != "nt":
        return []
    command = ("$taskRoots = @($env:LOCAL_NODE_PROJECT_DIRS | ConvertFrom-Json); "
               "@(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { "
               "$taskProcess = $_; foreach ($taskRoot in $taskRoots) { "
               "if ($taskProcess.CommandLine -and $taskProcess.CommandLine.IndexOf([string]$taskRoot, "
               "[System.StringComparison]::OrdinalIgnoreCase) -ge 0) { $taskProcess.ProcessId; break } "
               "} }) | ConvertTo-Json -Compress")
    result = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", command],
                            capture_output=True, text=True, timeout=20,
                            creationflags=subprocess.CREATE_NO_WINDOW,
                            env={**os.environ, "LOCAL_NODE_PROJECT_DIRS": json.dumps(
                                [str(ROOT / folder) for folder in ("frontend-web", "trendstock-backend")])})
    if result.returncode:
        raise SetupError("Cannot check workspace build workers. Stop project servers and retry setup.")
    values = json.loads(result.stdout) if result.stdout.strip() else []
    return values if isinstance(values, list) else [values]


def ensure_setup_idle():
    try:
        ensure_ports_free((3000, 5000, 8000, 8010))
    except SetupError as error:
        raise SetupError(f"Setup needs stopped servers. Press Ctrl+C in the start.cmd terminal, then retry. {error}") from error
    workers = windows_workspace_node_processes()
    if workers:
        raise SetupError("Workspace Node/build processes are still running (PIDs: "
                         + ", ".join(str(pid) for pid in workers[:8])
                         + "). Stop the project's dev servers/build workers before running setup.cmd. "
                         "No packages have been changed by this check.")


def prepare_neo4j(skip_docker=False):
    values = effective_config("emobooks-backend")
    uri = urlsplit(values["NEO4J_URI"])
    local_compose = uri.hostname in ("localhost", "127.0.0.1", "::1") and (uri.port or 7687) == 7687
    if local_compose and not (port_open(7687) or port_open(7687, "::1")) and not skip_docker:
        if not shutil.which("docker"):
            raise SetupError("Local Neo4j is stopped. Install/start Docker Desktop, then retry.")
        announce("Starting the existing EmoBooks Neo4j Docker service (data volume preserved).")
        execute(["docker", "compose", "-f", "docker-compose.neo4j.yml", "up", "-d"],
                cwd=ROOT / "emobooks-backend")
    announce("Waiting for the configured Neo4j database and preparing its catalog schema.")
    deadline = time.monotonic() + 90
    while time.monotonic() < deadline:
        try:
            result = subprocess.run(
                [str(venv_python("emobooks-backend")), "scripts/check_neo4j.py"],
                cwd=ROOT / "emobooks-backend", capture_output=True, text=True, timeout=15,
            )
            if result.returncode == 0:
                print(result.stdout.strip(), flush=True)
                return
        except subprocess.TimeoutExpired:
            pass
        time.sleep(2)
    raise SetupError("Neo4j is unavailable. Check Docker Desktop and the NEO4J_* values in emobooks-backend/.env.")


def start_process(command, cwd, env=None, job=None):
    child_env = {**(os.environ if env is None else env), "PYTHONUNBUFFERED": "1",
                 "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"}
    process = subprocess.Popen([str(item) for item in command], cwd=cwd, env=child_env,
                            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
                            start_new_session=os.name != "nt")
    if job is not None:
        try:
            job.assign(process)
        except OSError:
            process.terminate()
            process.wait(timeout=5)
            raise
    return process


def windows_dns_servers():
    explicit = os.environ.get("LOCAL_DNS_SERVERS", "")
    if explicit or os.name != "nt":
        return explicit
    # dnspython may read stale adapter entries from the registry on Windows.
    # Match the live adapters used by Windows, without changing system settings.
    command = ("$taskActiveIndexes = @(Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | "
               "ForEach-Object { $_.ifIndex }); "
               "@(Get-DnsClientServerAddress -AddressFamily IPv4 | "
               "Where-Object { $_.InterfaceIndex -in $taskActiveIndexes } | "
               "ForEach-Object { $_.ServerAddresses } | Sort-Object -Unique) | ConvertTo-Json -Compress")
    try:
        result = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", command],
                                capture_output=True, text=True, timeout=20,
                                creationflags=subprocess.CREATE_NO_WINDOW)
        if result.returncode == 0 and result.stdout.strip():
            addresses = json.loads(result.stdout)
            return ",".join(addresses if isinstance(addresses, list) else [addresses])
    except (OSError, ValueError, subprocess.SubprocessError):
        pass
    return ""


def check_children(children):
    for name, process in children:
        code = process.poll()
        if code is not None:
            raise SetupError(f"{name} exited (code {code}). See its output above; the other started services will stop.")


def wait_ready(name, url, children, timeout):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        check_children(children)
        try:
            with HTTP.open(url, timeout=2) as response:
                if response.status == 200:
                    announce(f"{name} ready: {url}")
                    return
        except (OSError, URLError):
            pass
        time.sleep(1)
    raise SetupError(f"{name} did not become ready in {timeout}s. See its output above.")


def stop_children(children):
    # Only signal process groups created by this invocation. Never kill by port/name.
    for _, process in reversed(children):
        try:
            # The group may still contain a child after its original parent exits.
            # Popen.send_signal skips exited parents, so signal the group directly.
            if os.name == "nt":
                os.kill(process.pid, signal.CTRL_BREAK_EVENT)
            else:
                os.killpg(process.pid, signal.SIGTERM)
        except OSError:
            pass
    deadline = time.monotonic() + 8
    for _, process in reversed(children):
        try:
            process.wait(timeout=max(0.1, deadline - time.monotonic()))
        except subprocess.TimeoutExpired:
            if os.name == "nt":
                subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                os.killpg(process.pid, signal.SIGKILL)
            process.wait(timeout=5)


def run(args):
    validate()
    ensure_ports_free((3000, 5000, 8000, 8010))
    if args.check:
        return
    prepare_neo4j(args.skip_docker)
    backend_env = dict(os.environ)
    dns_servers = windows_dns_servers()
    if dns_servers:
        backend_env["LOCAL_DNS_SERVERS"] = dns_servers
        announce("Using active Windows DNS for Python MongoDB lookups (system settings unchanged).")
    children = []
    job = None
    if os.name == "nt":
        from windows_job import WindowsJob
        job = WindowsJob()
    try:
        for name, module, port in (("phonolex-backend", "api:app", 8000),
                                   ("emobooks-backend", "emobooks.main:app", 8010)):
            announce(f"Starting {name} on {port}.")
            process = start_process([venv_python(name), ROOT / "scripts/run_backend.py", module,
                                     str(port)], ROOT / name, backend_env, job=job)
            children.append((name, process))
            path = "/" if name == "phonolex-backend" else "/health"
            wait_ready(name, f"http://127.0.0.1:{port}{path}", children, args.timeout)
        # The unchanged Node route spawns `py predict.py`. The Windows launcher
        # honors VIRTUAL_ENV when no Python version is specified.
        trend_venv = ROOT / "trendstock-backend/.venv"
        trend_env = {**os.environ, "VIRTUAL_ENV": str(trend_venv),
                     "PATH": str(trend_venv / "Scripts") + os.pathsep + os.environ.get("PATH", ""),
                     "PORT": "5000"}
        announce("Starting TrendStock on 5000 with its own Python prediction environment.")
        children.append(("trendstock-backend", start_process(
            [shutil.which("node"), "src/app.js"], ROOT / "trendstock-backend", trend_env, job=job)))
        wait_ready("TrendStock", "http://127.0.0.1:5000/", children, args.timeout)
        frontend_env = {**os.environ, **LOCAL_URLS}
        frontend_env.pop("NODE_ENV", None)
        announce("Starting the main frontend on 3000 with the selected local API URLs.")
        frontend = start_process([shutil.which("node"), "node_modules/next/dist/bin/next", "dev", "--webpack",
                                  "--hostname", "localhost", "--port", "3000"],
                                 ROOT / "frontend-web", frontend_env, job=job)
        children.append(("frontend-web", frontend))
        wait_ready("Frontend", "http://localhost:3000/login", children, args.timeout)
        announce("Open http://localhost:3000 | Ctrl+C stops these four servers. Neo4j data/service is retained.")
        while True:
            check_children(children)
            time.sleep(1)
    finally:
        announce("Stopping the servers started by this command.")
        try:
            stop_children(children)
        finally:
            if job is not None:
                job.close()


def main():
    if hasattr(signal, "SIGBREAK"):
        # Handle Ctrl+Break as well as Ctrl+C so Windows supervisors can cleanly stop us.
        def interrupt(signum, frame):
            raise KeyboardInterrupt
        signal.signal(signal.SIGBREAK, interrupt)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("setup", "run"))
    parser.add_argument("--check", action="store_true", help="Validate setup and ports without starting servers")
    parser.add_argument("--skip-docker", action="store_true", help="Use an already running configured Neo4j database")
    parser.add_argument("--timeout", type=int, default=180, help="Startup timeout per server in seconds")
    args = parser.parse_args()
    if args.timeout <= 0:
        parser.error("--timeout must be greater than zero")
    try:
        setup() if args.command == "setup" else run(args)
    except KeyboardInterrupt:
        announce("Stopped.")
        return 130
    except (SetupError, OSError, subprocess.SubprocessError) as error:
        print(f"\n[local] ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
