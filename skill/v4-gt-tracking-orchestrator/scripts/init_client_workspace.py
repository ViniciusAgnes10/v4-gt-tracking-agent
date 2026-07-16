#!/usr/bin/env python3
"""Create a sanitized client tracking workspace from reusable templates."""
from __future__ import annotations

import argparse
import csv
import json
import re
import unicodedata
from pathlib import Path
from typing import Any


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", normalized).strip("-").lower()
    if not slug:
        raise ValueError("Client name does not produce a valid slug")
    return slug


def write_json(path: Path, payload: dict[str, Any], force: bool) -> None:
    if path.exists() and not force:
        raise FileExistsError(f"Refusing to overwrite existing file: {path}")
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_csv(path: Path, headers: list[str], force: bool) -> None:
    if path.exists() and not force:
        raise FileExistsError(f"Refusing to overwrite existing file: {path}")
    with path.open("w", encoding="utf-8", newline="") as handle:
        csv.writer(handle).writerow(headers)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--client", required=True, help="Client display name")
    parser.add_argument("--output", default="./clientes", help="Parent output directory")
    parser.add_argument("--timezone", default="America/Sao_Paulo")
    parser.add_argument("--currency", default="BRL")
    parser.add_argument("--force", action="store_true", help="Overwrite generated files")
    args = parser.parse_args()

    slug = slugify(args.client)
    root = Path(args.output).expanduser().resolve() / slug
    for directory in (root, root / "evidence", root / "raw", root / "exports", root / "logs"):
        directory.mkdir(parents=True, exist_ok=True)

    profile = {
        "schema_version": "1.0",
        "client_name": args.client,
        "client_slug": slug,
        "segment": "[SEGMENT]",
        "business_model": "[B2B_B2C_RECURRING_ECOMMERCE_SERVICE]",
        "average_ticket": None,
        "average_sales_cycle_days": None,
        "timezone": args.timezone,
        "currency": args.currency,
        "monthly_lead_volume": None,
        "crm": [],
        "marketing_automation": [],
        "media_platforms": [],
        "analytics_platforms": [],
        "data_platforms": [],
        "entry_channels": [],
        "owners": {"crm": "[OWNER]", "media": "[OWNER]", "commercial": "[OWNER]", "technical": "[OWNER]"},
        "go_live_at": None,
        "read_only_mode": True,
        "approval_required_for_external_writes": True,
        "secret_locations": {},
        "notes": []
    }
    funnel = {
        "schema_version": "1.0",
        "pipelines": [],
        "stages": [
            {"name": "Lead", "semantic_stage": "LEAD", "internal_event": "lead_created", "current_active": True},
            {"name": "MQL", "semantic_stage": "MQL", "internal_event": "mql_created", "current_active": True},
            {"name": "SQL", "semantic_stage": "SQL", "internal_event": "sql_created", "current_active": True},
            {"name": "Oportunidade", "semantic_stage": "OPPORTUNITY", "internal_event": "opportunity_created", "current_active": True},
            {"name": "Venda Ganha", "semantic_stage": "WON", "internal_event": "purchase_won", "current_active": False},
            {"name": "Venda Perdida", "semantic_stage": "LOST", "internal_event": "deal_lost", "current_active": False}
        ],
        "mql_definition": "[APPROVAL_REQUIRED]",
        "sql_definition": "[APPROVAL_REQUIRED]",
        "opportunity_definition": "[APPROVAL_REQUIRED]",
        "won_definition": "[APPROVAL_REQUIRED]"
    }
    field_map = {"schema_version": "1.0", "fields": []}

    write_json(root / "client-profile.json", profile, args.force)
    write_json(root / "funnel-map.json", funnel, args.force)
    write_json(root / "crm-field-map.json", field_map, args.force)
    write_csv(root / "source-inventory.csv", ["source_id", "system", "object", "owner", "truth_for", "access", "freshness", "status", "notes"], args.force)
    write_csv(root / "approval-queue.csv", ["approval_id", "action", "target", "risk", "rollback", "requested_at", "approved_at", "approved_by", "status"], args.force)
    write_csv(root / "documentation-evidence.csv", ["platform", "title", "official_url", "consulted_at", "version", "relevant_rule", "implementation_impact"], args.force)
    write_csv(root / "api-status.csv", ["item", "status", "updated_at", "quantity", "duration_ms", "last_cursor", "owner", "notes"], args.force)
    write_csv(root / "error-log.csv", ["error_id", "timestamp", "lead_id", "event", "platform", "action", "code", "message_sanitized", "attempts", "retry_at", "corrected", "owner"], args.force)

    readme = f"""# {args.client} - GT Tracking Workspace\n\nGenerated workspace for gated tracking implementation.\n\n## Rules\n\n- Keep external writes disabled until approval.\n- Store no credentials in this directory.\n- Record official documentation evidence.\n- Preserve raw evidence and use sanitized exports.\n- Define GO_LIVE_AT before production event delivery.\n"""
    readme_path = root / "README.md"
    if readme_path.exists() and not args.force:
        raise FileExistsError(f"Refusing to overwrite existing file: {readme_path}")
    readme_path.write_text(readme, encoding="utf-8")

    print(json.dumps({"status": "created", "client": args.client, "path": str(root)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "error", "message": str(exc)}, ensure_ascii=False))
        raise SystemExit(2)
