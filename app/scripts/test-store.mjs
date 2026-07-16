import assert from "node:assert/strict";
import { createClientRecord, slugify, summarizeClient, runWithAgentKey } from "../server/src/store.mjs";

assert.equal(slugify("ST1 Internet São Luís"), "st1-internet-sao-luis");
const client = createClientRecord("Cliente Teste", { crm: "Kommo", businessModel: "Recorrente" });
assert.match(client.id, /^[0-9a-f-]{36}$/);
assert.equal(client.slug, "cliente-teste");
assert.equal(client.gates.length, 7);
assert.equal(client.gates[0].status, "ready");
assert.equal(client.executionMode, "dry_run");
const summary = summarizeClient(client);
assert.equal(summary.currentGate, 1);
assert.equal(summary.pendingApprovals, 0);
const contextResult = await runWithAgentKey("a".repeat(64), async () => "context-ok");
assert.equal(contextResult, "context-ok");
console.log("STORE_UNIT_OK");
