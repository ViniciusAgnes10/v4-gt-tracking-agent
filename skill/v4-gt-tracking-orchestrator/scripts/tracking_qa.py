#!/usr/bin/env python3
"""Audit event exports for deduplication, timestamps, identifiers and go-live safety."""
from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Any


def parse_dt(value: str) -> datetime:
    clean = value.strip().replace("Z", "+00:00")
    return datetime.fromisoformat(clean)


def load_rows(path: Path) -> list[dict[str, Any]]:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            return list(csv.DictReader(handle))
    if suffix == ".jsonl":
        return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    if suffix == ".json":
        payload = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(payload, list):
            return payload
        if isinstance(payload, dict) and isinstance(payload.get("events"), list):
            return payload["events"]
    raise ValueError("Supported formats: .csv, .json, .jsonl")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--events", required=True)
    parser.add_argument("--go-live", required=True)
    parser.add_argument("--report")
    args = parser.parse_args()

    rows = load_rows(Path(args.events))
    go_live = parse_dt(args.go_live)
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    seen: set[str] = set()
    eligible = 0

    for index, row in enumerate(rows, start=2):
        event_id = str(row.get("event_id") or "").strip()
        lead_id = str(row.get("lead_id") or "").strip()
        internal_event = str(row.get("internal_event") or "").strip()
        key = event_id or (f"{lead_id}_{internal_event}" if lead_id and internal_event else "")
        if not key:
            errors.append({"row": index, "issue": "missing event_id and composite key"})
        elif key in seen:
            errors.append({"row": index, "issue": "duplicate event key", "key": key})
        else:
            seen.add(key)

        raw_time = str(row.get("event_time") or row.get("timestamp") or "").strip()
        if not raw_time:
            errors.append({"row": index, "issue": "missing event_time"})
            continue
        try:
            event_time = parse_dt(raw_time)
            if event_time.tzinfo is None or go_live.tzinfo is None:
                warnings.append({"row": index, "issue": "timezone missing from timestamp"})
            else:
                if event_time >= go_live:
                    eligible += 1
                elif str(row.get("send_status", "")).lower() in {"sent", "success", "accepted"}:
                    errors.append({"row": index, "issue": "pre-go-live event marked as sent"})
        except ValueError:
            errors.append({"row": index, "issue": "invalid event_time", "value": raw_time})

        identifiers = [row.get("gclid"), row.get("gbraid"), row.get("wbraid"), row.get("msclkid"), row.get("fbclid"), row.get("fbc"), row.get("email"), row.get("phone")]
        if not any(str(item or "").strip() for item in identifiers):
            warnings.append({"row": index, "issue": "no match identifier"})

        if internal_event == "purchase_won" and not str(row.get("currency") or "").strip():
            warnings.append({"row": index, "issue": "purchase_won without currency"})

    report = {
        "file": args.events,
        "rows": len(rows),
        "unique_keys": len(seen),
        "go_live": args.go_live,
        "eligible_on_or_after_go_live": eligible,
        "errors": errors,
        "warnings": warnings,
        "pass": not errors
    }
    rendered = json.dumps(report, indent=2, ensure_ascii=False)
    print(rendered)
    if args.report:
        Path(args.report).write_text(rendered + "\n", encoding="utf-8")
    return 0 if not errors else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(json.dumps({"pass": False, "errors": [{"issue": str(exc)}]}, ensure_ascii=False))
        raise SystemExit(2)
