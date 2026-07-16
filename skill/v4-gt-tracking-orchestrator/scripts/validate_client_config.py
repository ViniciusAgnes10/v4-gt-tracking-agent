#!/usr/bin/env python3
"""Validate a client-profile JSON and flag unsafe credential-like values."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

REQUIRED = ["client_name", "timezone", "currency", "crm", "media_platforms", "data_platforms", "entry_channels", "owners"]
SECRET_KEY = re.compile(r"(token|secret|password|api[_-]?key|access[_-]?key|private[_-]?key|authorization|cookie)", re.I)
PLACEHOLDER = re.compile(r"^\[[A-Z0-9_ -]+\]$")


def walk(value: Any, path: str = "$") -> list[tuple[str, Any]]:
    items: list[tuple[str, Any]] = []
    if isinstance(value, dict):
        for key, child in value.items():
            child_path = f"{path}.{key}"
            items.append((child_path, child))
            items.extend(walk(child, child_path))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            items.extend(walk(child, f"{path}[{index}]"))
    return items


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("config")
    args = parser.parse_args()

    path = Path(args.config)
    data = json.loads(path.read_text(encoding="utf-8"))
    errors: list[str] = []
    warnings: list[str] = []

    for key in REQUIRED:
        if key not in data:
            errors.append(f"Missing required field: {key}")

    if not isinstance(data.get("owners", {}), dict):
        errors.append("owners must be an object")
    if data.get("read_only_mode") is not True and not data.get("go_live_at"):
        warnings.append("read_only_mode is disabled but go_live_at is empty")

    for item_path, value in walk(data):
        leaf = item_path.rsplit(".", 1)[-1]
        if SECRET_KEY.search(leaf) and isinstance(value, str) and value and not PLACEHOLDER.match(value):
            if "location" not in leaf.lower() and "secret_locations" not in item_path:
                errors.append(f"Possible plaintext secret at {item_path}")
        if isinstance(value, str) and (value.startswith("sk-") or value.startswith("Bearer ")):
            errors.append(f"Credential-like value at {item_path}")

    report = {"valid": not errors, "errors": errors, "warnings": warnings, "file": str(path)}
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if not errors else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, json.JSONDecodeError) as exc:
        print(json.dumps({"valid": False, "errors": [str(exc)]}, ensure_ascii=False))
        raise SystemExit(2)
