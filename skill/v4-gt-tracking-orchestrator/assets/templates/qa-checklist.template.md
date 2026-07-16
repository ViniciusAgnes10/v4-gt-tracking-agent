# QA Checklist - [CLIENT]

## CRM
- [ ] Authentication works with minimum scope.
- [ ] Counts reconcile by pipeline and stage.
- [ ] Contacts and owners are associated correctly.
- [ ] Custom field IDs are verified.
- [ ] Values, currencies, loss reasons and timestamps are coherent.

## Identity and source
- [ ] UTMs persist from entry to CRM.
- [ ] GCLID/GBRAID/WBRAID/FBCLID/MSCLKID are captured when available.
- [ ] First touch is immutable and last touch is controlled.
- [ ] No attribution detail is inferred without evidence.

## Events
- [ ] Event IDs are stable and unique.
- [ ] Timestamps include timezone.
- [ ] Historical backfill is not marked for external delivery.
- [ ] Previous/current stage and maximum stage reached are correct.

## Media
- [ ] Test environment or test event was validated.
- [ ] Conversion names and action IDs match exactly.
- [ ] GO_LIVE_AT is recorded.
- [ ] Retries preserve event/order ID.
- [ ] Partial failures are logged.

## Governance
- [ ] Secrets are stored outside code and logs.
- [ ] Approval and rollback are documented.
- [ ] API_STATUS and error log are operational.
- [ ] Dashboard shows stale, partial and error states.
