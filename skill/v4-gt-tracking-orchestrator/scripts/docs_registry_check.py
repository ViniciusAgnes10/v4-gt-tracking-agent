#!/usr/bin/env python3
"""Validate the local official-documentation registry without network access."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.parse import urlparse


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("registry")
    args = parser.parse_args()

    path = Path(args.registry)
    payload = json.loads(path.read_text(encoding="utf-8"))
    platforms = payload.get("platforms")
    errors: list[str] = []
    warnings: list[str] = []
    seen_ids: set[str] = set()

    if not isinstance(platforms, list) or not platforms:
        errors.append("platforms must be a non-empty list")
        platforms = []

    for index, item in enumerate(platforms):
        prefix = f"platforms[{index}]"
        for key in ("id", "name", "domain", "entry_url", "search_terms"):
            if key not in item or item[key] in (None, "", []):
                errors.append(f"{prefix} missing {key}")
        platform_id = str(item.get("id", ""))
        if platform_id in seen_ids:
            errors.append(f"duplicate id: {platform_id}")
        seen_ids.add(platform_id)
        parsed = urlparse(str(item.get("entry_url", "")))
        domain = str(item.get("domain", "")).lower()
        if parsed.scheme != "https":
            errors.append(f"{platform_id}: entry_url must use https")
        if domain and parsed.hostname and not (parsed.hostname == domain or parsed.hostname.endswith("." + domain)):
            errors.append(f"{platform_id}: URL hostname does not match declared domain")
        if "last_verified_at" not in item:
            warnings.append(f"{platform_id}: verify at runtime and record last_verified_at in client evidence")

    report = {"valid": not errors, "platform_count": len(platforms), "errors": errors, "warnings": warnings}
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if not errors else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, json.JSONDecodeError) as exc:
        print(json.dumps({"valid": False, "errors": [str(exc)]}, ensure_ascii=False))
        raise SystemExit(2)
