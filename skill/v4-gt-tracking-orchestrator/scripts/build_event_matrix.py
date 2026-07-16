#!/usr/bin/env python3
"""Build a normalized event matrix CSV from a funnel-map JSON."""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

DEFAULTS = {
    "LEAD": ("Lead", "", "created_at", "NONE"),
    "MQL": ("QualifiedLead", "CRM - MQL", "stage_entered_at", "QUALIFIED"),
    "SQL": ("QualifiedLead", "CRM - SQL", "stage_entered_at", "SQL"),
    "OPPORTUNITY": ("Opportunity", "CRM - Oportunidade", "stage_entered_at", "HIGH_INTENT"),
    "WON": ("Purchase", "CRM - Venda Ganha", "closed_won_at", "CUSTOMERS"),
    "LOST": ("", "", "closed_lost_at", "LOST_ROUTING")
}

HEADERS = ["stage_name", "semantic_stage", "internal_event", "meta_event", "google_conversion", "timestamp_source", "audience", "active_stage", "requires_approval", "notes"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    payload = json.loads(Path(args.config).read_text(encoding="utf-8"))
    stages = payload.get("stages")
    if not isinstance(stages, list) or not stages:
        raise ValueError("funnel-map must contain a non-empty stages list")

    rows = []
    seen_events: set[str] = set()
    for stage in stages:
        semantic = str(stage.get("semantic_stage", "")).upper()
        internal = str(stage.get("internal_event", "")).strip()
        if not internal:
            raise ValueError(f"Missing internal_event for stage {stage.get('name')}")
        if internal in seen_events:
            raise ValueError(f"Duplicate internal_event: {internal}")
        seen_events.add(internal)
        meta, google, timestamp, audience = DEFAULTS.get(semantic, ("", "", "stage_entered_at", ""))
        rows.append({
            "stage_name": stage.get("name", ""),
            "semantic_stage": semantic,
            "internal_event": internal,
            "meta_event": stage.get("meta_event", meta),
            "google_conversion": stage.get("google_conversion", google),
            "timestamp_source": stage.get("timestamp_source", timestamp),
            "audience": stage.get("audience", audience),
            "active_stage": bool(stage.get("current_active", False)),
            "requires_approval": True,
            "notes": stage.get("notes", "Review platform eligibility before activation")
        })

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=HEADERS)
        writer.writeheader()
        writer.writerows(rows)
    print(json.dumps({"status": "created", "rows": len(rows), "output": str(output)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "error", "message": str(exc)}, ensure_ascii=False))
        raise SystemExit(2)
