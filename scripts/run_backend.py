"""Start an unchanged backend with the active Windows DNS configuration."""

import argparse
import ipaddress
import os
from pathlib import Path
import runpy
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("module", choices=("api:app", "emobooks.main:app"))
    parser.add_argument("port", type=int)
    args = parser.parse_args()
    servers = os.environ.get("LOCAL_DNS_SERVERS", "")
    if servers:
        import dns.resolver
        addresses = [str(ipaddress.ip_address(value.strip())) for value in servers.split(",") if value.strip()]
        dns.resolver.get_default_resolver().nameservers = addresses
    # Keep the backend directory first, just like `python -m uvicorn` from there.
    sys.path.insert(0, str(Path.cwd()))
    sys.argv = ["uvicorn", args.module, "--host", "127.0.0.1", "--port", str(args.port)]
    runpy.run_module("uvicorn", run_name="__main__")


if __name__ == "__main__":
    main()
