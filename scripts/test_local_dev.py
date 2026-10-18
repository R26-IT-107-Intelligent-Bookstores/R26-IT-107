"""Launcher regression checks; no real databases, weights or package installs."""

import argparse
import contextlib
import io
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch

import local_dev as runner


class LauncherTests(unittest.TestCase):
    def test_existing_environment_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / ".env"
            original = b"MONGO_URI=existing-private-value\r\n# keep this comment\r\n"
            path.write_bytes(original)
            runner.create_if_missing(path, "MONGO_URI=replacement\n")
            self.assertEqual(path.read_bytes(), original)

    def test_occupied_port_is_rejected_without_stopping_owner(self):
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            listener.listen()
            port = listener.getsockname()[1]
            with self.assertRaisesRegex(runner.SetupError, str(port)):
                runner.ensure_ports_free([port])
            self.assertTrue(runner.port_open(port))

    def test_http_probe_does_not_treat_non_http_listener_as_ready(self):
        # Readiness must use a successful HTTP response, not just an occupied port.
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            listener.listen()
            with self.assertRaisesRegex(runner.SetupError, "did not become ready"):
                runner.wait_ready("fake", f"http://127.0.0.1:{listener.getsockname()[1]}", [], 0.1)

    def test_check_mode_starts_no_services_or_docker(self):
        args = argparse.Namespace(check=True, skip_docker=False, timeout=1)
        with patch.object(runner, "validate"), patch.object(runner, "ensure_ports_free"), \
                patch.object(runner, "prepare_neo4j") as docker, \
                patch.object(runner, "start_process") as start:
            runner.run(args)
        docker.assert_not_called()
        start.assert_not_called()

    def test_setup_does_not_change_packages_or_env_when_servers_are_running(self):
        with patch.object(runner, "ensure_setup_idle", side_effect=runner.SetupError("servers running")), \
                patch.object(runner, "execute") as execute, \
                patch.object(runner, "create_if_missing") as create:
            with self.assertRaisesRegex(runner.SetupError, "servers running"):
                runner.setup()
        execute.assert_not_called()
        create.assert_not_called()

    def test_setup_rejects_build_workers_even_when_no_port_is_listening(self):
        with patch.object(runner, "ensure_ports_free"), \
                patch.object(runner, "windows_workspace_node_processes", return_value=[42]):
            with self.assertRaisesRegex(runner.SetupError, "42"):
                runner.ensure_setup_idle()

    def test_local_frontend_urls_preserve_fedbook_and_stop_all_owned_services(self):
        args = argparse.Namespace(check=False, skip_docker=True, timeout=1)
        processes = []
        environments = []

        def start(command, cwd, env=None, job=None):
            environments.append(env)
            process = original(
                [sys.executable, "-c", "import time; time.sleep(60)"], Path.cwd(), env, job=job)
            processes.append(process)
            return process

        original = runner.start_process
        with patch.dict(os.environ, {"NEXT_PUBLIC_FEDBOOK_API_URL": "https://keep.example", 
                                     "NEXT_PUBLIC_VITE_PHONOLEX_API": "https://old.example"}), \
                patch.object(runner, "validate"), patch.object(runner, "ensure_ports_free"), \
                patch.object(runner, "prepare_neo4j"), \
                patch.object(runner, "windows_dns_servers", return_value="1.1.1.1"), \
                patch.object(runner, "start_process", side_effect=start), \
                patch.object(runner, "wait_ready", side_effect=[None, None, None, runner.SetupError("startup failed")]), \
                contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaisesRegex(runner.SetupError, "startup failed"):
                runner.run(args)
        self.assertEqual(len(processes), 4)
        self.assertTrue(all(process.poll() is not None for process in processes))
        self.assertEqual(environments[-1]["NEXT_PUBLIC_FEDBOOK_API_URL"], "https://keep.example")
        self.assertEqual(environments[-1]["NEXT_PUBLIC_VITE_PHONOLEX_API"], "http://localhost:8000")
        self.assertEqual(environments[-1]["NEXT_PUBLIC_EMOBOOKS_API_URL"], "http://localhost:8010")
        self.assertEqual(environments[-1]["NEXT_PUBLIC_TRENDSTOCK_API_URL"], "http://localhost:5000")
        self.assertTrue(environments[-2]["VIRTUAL_ENV"].endswith("trendstock-backend" + os.sep + ".venv"))
        self.assertEqual(environments[0]["LOCAL_DNS_SERVERS"], "1.1.1.1")

    def test_child_failure_is_detected_even_if_exit_code_is_zero(self):
        process = subprocess.Popen([sys.executable, "-c", "pass"])
        process.wait(timeout=10)
        with self.assertRaisesRegex(runner.SetupError, "exited"):
            runner.check_children([("backend", process)])

    def test_shutdown_leaves_unrelated_process_alive(self):
        unrelated = runner.start_process([sys.executable, "-c", "import time; time.sleep(60)"], Path.cwd())
        owned = runner.start_process([sys.executable, "-c", "import time; time.sleep(60)"], Path.cwd())
        try:
            runner.stop_children([("owned", owned)])
            self.assertIsNotNone(owned.poll())
            self.assertIsNone(unrelated.poll())
        finally:
            runner.stop_children([("test process", unrelated)])

    def test_shutdown_stops_descendant_after_parent_has_already_exited(self):
        with socket.socket() as available:
            available.bind(("127.0.0.1", 0))
            port = available.getsockname()[1]
        with tempfile.TemporaryDirectory() as directory:
            pid_file = Path(directory) / "child.pid"
            child_code = ("import socket,time; s=socket.socket(); "
                          f"s.bind(('127.0.0.1',{port})); s.listen(); time.sleep(60)")
            detached = ",creationflags=subprocess.CREATE_NEW_PROCESS_GROUP" if os.name == "nt" else ""
            parent_code = ("import subprocess,sys; from pathlib import Path; "
                           f"p=subprocess.Popen([sys.executable,'-c',{child_code!r}]{detached}); "
                           f"Path({str(pid_file)!r}).write_text(str(p.pid))")
            job = None
            if os.name == "nt":
                from windows_job import WindowsJob
                job = WindowsJob()
            parent = runner.start_process([sys.executable, "-c", parent_code], Path.cwd(), job=job)
            try:
                parent.wait(timeout=10)
                deadline = time.monotonic() + 5
                while not runner.port_open(port) and time.monotonic() < deadline:
                    time.sleep(0.1)
                self.assertTrue(runner.port_open(port), "Fixture child did not start")
                runner.stop_children([("exited parent", parent)])
                if job is not None:
                    job.close()
                deadline = time.monotonic() + 5
                while runner.port_open(port) and time.monotonic() < deadline:
                    time.sleep(0.1)
                self.assertFalse(runner.port_open(port), "Descendant survived its parent's shutdown")
            finally:
                if job is not None:
                    job.close()
                if runner.port_open(port) and pid_file.exists():
                    child_pid = int(pid_file.read_text())
                    if os.name == "nt":
                        subprocess.run(["taskkill", "/PID", str(child_pid), "/T", "/F"],
                                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    else:
                        os.kill(child_pid, 9)


if __name__ == "__main__":
    unittest.main()
