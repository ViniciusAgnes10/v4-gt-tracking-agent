import crypto from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";

const SUPABASE_URL = "https://qcwefiyfqhxyfexsseuw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_q1QNDfcBPIPkjp_Q5Or16w_zzmGLFrD";
const agentKeyContext = new AsyncLocalStorage();
const TENANT_ID = "4227756e-89f4-4fa7-ba26-c4f03706dcd2";
let writeQueue = Promise.resolve();

const now = () => new Date().toISOString();
export const id = () => crypto.randomUUID();
export const slugify = (value) => String(value || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function currentAgentKey() { return agentKeyContext.getStore()?.agentKey || ""; }
export function runWithAgentKey(agentKey, fn) { return agentKeyContext.run({ agentKey }, fn); }
function assertConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TENANT_ID || !currentAgentKey()) {
    throw new Error("Contexto privado do agente ausente");
  }
}

function headers(extra = {}) {
  assertConfig();
  return {
    apikey: SUPABASE_ANON_KEY,
    authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "x-agent-key": currentAgentKey(),
    "content-type": "application/json",
    ...extra
  };
}

function buildUrl(table, query = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  return url;
}

async function request(table, { method = "GET", query = {}, body, prefer, single = false } = {}) {
  const response = await fetch(buildUrl(table, query), {
    method,
    headers: headers(prefer ? { prefer } : {}),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); }
    catch { data = text; }
  }
  if (!response.ok) {
    const detail = typeof data === "object" && data ? (data.message || data.details || JSON.stringify(data)) : text;
    throw new Error(`Supabase ${method} ${table} (${response.status}): ${detail}`);
  }
  if (single && Array.isArray(data)) return data[0] ?? null;
  return data;
}

const mapStatusToDb = (status) => ({ diagnostic: "discovery", operational: "monitoring", paused: "paused" }[status] || status || "discovery");
const mapStatusFromDb = (status) => ({ discovery: "diagnostic", monitoring: "operational" }[status] || status);
const mapGateToDb = (status) => ({ ready: "pending", awaiting_approval: "blocked" }[status] || status || "pending");
const mapGateFromDb = (status, number, currentGate) => status === "pending" ? (number === currentGate ? "ready" : "blocked") : status;
const mapIntegrationToDb = (status) => ({ error: "degraded", paused: "blocked" }[status] || status || "planned");
const mapIntegrationFromDb = (status) => ({ degraded: "error", blocked: "paused", disconnected: "error", requested: "planned" }[status] || status);
const mapAccessMode = (value) => {
  const v = String(value || "").toLowerCase();
  for (const mode of ["oauth", "api", "mcp", "browser", "webhook", "manual", "hybrid"]) if (v.includes(mode)) return mode;
  if (v.includes("opera")) return "browser";
  return "unknown";
};

function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows || []) {
    const value = row[key];
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(row);
  }
  return map;
}

function mapClient(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: mapStatusFromDb(row.status),
    paused: Boolean(row.paused),
    pauseReason: row.pause_reason || "",
    currentGate: Number(row.current_gate || 1),
    executionMode: row.execution_mode || "dry_run",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    profile: { timezone: row.timezone, currency: row.currency, businessModel: row.business_model || "", ...(row.profile || {}) },
    integrations: [], gates: [], approvals: [], docsEvidence: [], qaRuns: [], logs: [], actions: [],
    metrics: { integrationsConfigured: 0, pendingApprovals: 0, qaPassRate: null, trackingCoverage: row.profile?.trackingCoverage ?? null, lastSyncAt: row.profile?.lastSyncAt ?? null }
  };
}

function mapIntegration(row) {
  return { id: row.id, platform: row.platform, category: row.category, adapter: row.adapter || "", accessMode: row.access_mode,
    status: mapIntegrationFromDb(row.status), owner: row.owner_name || "", notes: row.config?.notes || "", externalAccountId: row.external_account_id || "",
    credentialReference: row.credential_reference || "", config: row.config || {}, capabilities: row.capabilities || {}, updatedAt: row.updated_at };
}
function mapGate(row, client) {
  return { id: row.id, number: row.gate_number, name: row.name, status: mapGateFromDb(row.status, row.gate_number, client.currentGate),
    summary: row.summary || "", findings: row.findings || [], dependencies: row.dependencies || [], risks: row.risks || [],
    acceptanceCriteria: row.acceptance_criteria || [], updatedAt: row.updated_at, startedAt: row.started_at, completedAt: row.completed_at };
}
function mapApproval(row) {
  return { id: row.id, title: row.title, description: row.description || "", platform: row.platform, adapter: row.adapter || "manual",
    risk: row.risk_level, reversible: Boolean(row.reversible), payload: row.requested_payload || {}, rollbackPlan: row.rollback_plan || "",
    evidenceRequired: row.requested_payload?.evidenceRequired || [], status: row.status, reviewNote: row.review_note || "",
    createdAt: row.requested_at || row.created_at, reviewedAt: row.reviewed_at, executedAt: row.executed_at,
    executionResult: null, integrationId: row.integration_id || null };
}
function mapDoc(row) {
  return { id: row.id, platform: row.platform, title: row.title, url: row.url, verifiedAt: row.verified_at,
    version: row.version || "", impact: row.impact || "", notes: row.summary || "", createdAt: row.created_at };
}
function mapQa(row) {
  const total = Number(row.passed_count || 0) + Number(row.warning_count || 0) + Number(row.failed_count || 0);
  return { id: row.id, scope: row.scope, checks: row.checks || [], passRate: total ? Math.round(Number(row.passed_count || 0) / total * 100) : 0,
    status: row.status, evidence: row.evidence || [], createdAt: row.created_at };
}
function mapLog(row) { return { id: String(row.id), at: row.created_at, level: row.level, message: row.message, details: row.metadata || {} }; }
function mapAction(row) {
  const result = { ok: ["succeeded", "simulated"].includes(row.status), status: row.status === "simulated" ? "dry_run" : row.status,
    ...(row.response_payload || {}), ...(row.error_message ? { reason: row.error_message } : {}) };
  return { id: row.id, approvalId: row.approval_id, title: row.action_name, at: row.created_at, result,
    executionMode: row.execution_mode, adapter: row.executor_type };
}

async function tableRows(table, query = {}) { return await request(table, { query: { select: "*", ...query } }) || []; }

export async function readState() {
  assertConfig();
  const clientsRows = await tableRows("gt_clients", { tenant_id: `eq.${TENANT_ID}`, order: "updated_at.desc" });
  const [integrationRows, gateRows, approvalRows, docRows, qaRows, logRows, actionRows] = await Promise.all([
    tableRows("gt_integrations", { tenant_id: `eq.${TENANT_ID}` }),
    tableRows("gt_gates", { tenant_id: `eq.${TENANT_ID}`, order: "gate_number.asc" }),
    tableRows("gt_approvals", { tenant_id: `eq.${TENANT_ID}`, order: "requested_at.asc" }),
    tableRows("gt_documentation_evidence", { tenant_id: `eq.${TENANT_ID}`, order: "verified_at.asc" }),
    tableRows("gt_qa_runs", { tenant_id: `eq.${TENANT_ID}`, order: "created_at.asc" }),
    tableRows("gt_audit_logs", { tenant_id: `eq.${TENANT_ID}`, order: "created_at.asc" }),
    tableRows("gt_executions", { tenant_id: `eq.${TENANT_ID}`, order: "created_at.asc" })
  ]);
  const groups = {
    integrations: groupBy(integrationRows, "client_id"), gates: groupBy(gateRows, "client_id"), approvals: groupBy(approvalRows, "client_id"),
    docs: groupBy(docRows, "client_id"), qa: groupBy(qaRows, "client_id"), logs: groupBy(logRows, "client_id"), actions: groupBy(actionRows, "client_id")
  };
  const clients = {};
  for (const row of clientsRows) {
    const client = mapClient(row);
    client.integrations = (groups.integrations.get(client.id) || []).map(mapIntegration);
    client.gates = (groups.gates.get(client.id) || []).map((gate) => mapGate(gate, client));
    client.approvals = (groups.approvals.get(client.id) || []).map(mapApproval);
    client.docsEvidence = (groups.docs.get(client.id) || []).map(mapDoc);
    client.qaRuns = (groups.qa.get(client.id) || []).map(mapQa);
    client.logs = (groups.logs.get(client.id) || []).map(mapLog);
    client.actions = (groups.actions.get(client.id) || []).map(mapAction);
    const latestExecutionByApproval = new Map(client.actions.map((action) => [action.approvalId, action.result]));
    for (const approval of client.approvals) approval.executionResult = latestExecutionByApproval.get(approval.id) || null;
    client.metrics = {
      integrationsConfigured: client.integrations.filter((item) => item.status === "configured").length,
      pendingApprovals: client.approvals.filter((item) => item.status === "pending").length,
      qaPassRate: client.qaRuns.at(-1)?.passRate ?? null,
      trackingCoverage: client.profile.trackingCoverage ?? null,
      lastSyncAt: client.profile.lastSyncAt ?? null
    };
    clients[client.id] = client;
  }
  return { version: 2, clients, updatedAt: now() };
}

function changed(a, b) { return JSON.stringify(a) !== JSON.stringify(b); }
function byId(rows = []) { return new Map(rows.map((row) => [row.id, row])); }

async function insertRows(table, rows) {
  if (!rows.length) return;
  await request(table, { method: "POST", body: rows, prefer: "return=minimal" });
}
async function updateRow(table, rowId, body) {
  await request(table, { method: "PATCH", query: { id: `eq.${rowId}` }, body, prefer: "return=minimal" });
}

function clientDbRow(client) {
  return { id: client.id, tenant_id: TENANT_ID, name: client.name, slug: client.slug || slugify(client.name),
    business_model: client.profile?.businessModel || null, timezone: client.profile?.timezone || "America/Sao_Paulo",
    currency: client.profile?.currency || "BRL", status: mapStatusToDb(client.status), current_gate: client.currentGate || 1,
    execution_mode: client.executionMode || "dry_run", paused: Boolean(client.paused), pause_reason: client.pauseReason || null,
    profile: client.profile || {} };
}
function gateDbRow(client, gate) {
  return { id: gate.id, tenant_id: TENANT_ID, client_id: client.id, gate_number: gate.number, name: gate.name,
    status: mapGateToDb(gate.status), summary: gate.summary || null, findings: gate.findings || [], risks: gate.risks || [],
    dependencies: gate.dependencies || [], acceptance_criteria: gate.acceptanceCriteria || [], started_at: gate.startedAt || null,
    completed_at: gate.completedAt || null };
}
function integrationDbRow(client, row) {
  return { id: row.id, tenant_id: TENANT_ID, client_id: client.id, platform: row.platform, category: row.category || "other",
    adapter: row.adapter || null, access_mode: mapAccessMode(row.accessMode), status: mapIntegrationToDb(row.status),
    external_account_id: row.externalAccountId || null, owner_name: row.owner || null, credential_reference: row.credentialReference || null,
    config: { ...(row.config || {}), ...(row.notes ? { notes: row.notes } : {}) }, capabilities: row.capabilities || {}, last_checked_at: now() };
}
function approvalDbRow(client, row) {
  return { id: row.id, tenant_id: TENANT_ID, client_id: client.id, integration_id: row.integrationId || null, title: row.title,
    description: row.description || null, platform: row.platform, adapter: row.adapter || "manual", action_type: row.actionType || "configuration_change",
    risk_level: row.risk || "medium", reversible: row.reversible !== false, rollback_plan: row.rollbackPlan || null,
    requested_payload: { ...(row.payload || {}), evidenceRequired: row.evidenceRequired || [] }, status: row.status || "pending",
    requested_by: row.requestedBy || "agent", reviewed_by: row.reviewedBy || null, review_note: row.reviewNote || null,
    requested_at: row.createdAt || now(), reviewed_at: row.reviewedAt || null, executed_at: row.executedAt || null };
}
function docDbRow(client, row) {
  const domain = (() => { try { return new URL(row.url).hostname; } catch { return "unknown"; } })();
  return { id: row.id, tenant_id: TENANT_ID, client_id: client.id, platform: row.platform, title: row.title, url: row.url, domain,
    version: row.version || null, verified_at: row.verifiedAt || now(), verified_by: "agent", summary: row.notes || null,
    impact: row.impact || null, status: "current", metadata: {} };
}
function qaDbRow(client, row) {
  const passed = (row.checks || []).filter((item) => item.status === "pass").length;
  const warnings = (row.checks || []).filter((item) => item.status === "warning").length;
  const failed = (row.checks || []).filter((item) => item.status === "fail").length;
  return { id: row.id, tenant_id: TENANT_ID, client_id: client.id, scope: row.scope, status: failed ? "fail" : warnings ? "warning" : "pass",
    checks: row.checks || [], passed_count: passed, warning_count: warnings, failed_count: failed, evidence: row.evidence || [],
    completed_at: row.createdAt || now() };
}
function actionDbRow(client, row) {
  const resultStatus = row.result?.status;
  const dbStatus = resultStatus === "dry_run" ? "simulated" : resultStatus === "executed" ? "succeeded" : resultStatus === "blocked" ? "blocked" : resultStatus === "error" ? "failed" : "queued";
  return { id: row.id, tenant_id: TENANT_ID, client_id: client.id, approval_id: row.approvalId || null,
    execution_mode: resultStatus === "dry_run" ? "dry_run" : client.executionMode || "dry_run",
    executor_type: row.adapter || "internal", action_name: row.title || "tracking_action", idempotency_key: `${row.approvalId || row.id}:${row.id}`,
    status: dbStatus, request_payload: {}, response_payload: row.result || {}, error_message: row.result?.reason || null,
    started_at: row.at || now(), finished_at: row.at || now() };
}

async function persistDiff(before, after) {
  const beforeClients = before.clients || {};
  for (const [clientId, client] of Object.entries(after.clients || {})) {
    const oldClient = beforeClients[clientId];
    if (!oldClient) {
      await insertRows("gt_clients", [clientDbRow(client)]);
      await insertRows("gt_gates", (client.gates || []).map((gate) => gateDbRow(client, gate)));
      await insertRows("gt_audit_logs", [{ tenant_id: TENANT_ID, client_id: client.id, actor_type: "agent", actor_id: "v4-gt-tracking-agent",
        level: "info", category: "workspace", action: "create", message: "Workspace criado", metadata: {} }]);
      continue;
    }
    if (changed({ status: oldClient.status, paused: oldClient.paused, currentGate: oldClient.currentGate, profile: oldClient.profile },
      { status: client.status, paused: client.paused, currentGate: client.currentGate, profile: client.profile })) {
      await updateRow("gt_clients", client.id, clientDbRow(client));
    }
    for (const [collection, table, mapper] of [
      ["integrations", "gt_integrations", integrationDbRow], ["gates", "gt_gates", gateDbRow],
      ["approvals", "gt_approvals", approvalDbRow]
    ]) {
      const oldMap = byId(oldClient[collection]);
      for (const row of client[collection] || []) {
        const payload = mapper(client, row);
        if (!oldMap.has(row.id)) await insertRows(table, [payload]);
        else if (changed(oldMap.get(row.id), row)) await updateRow(table, row.id, payload);
      }
    }
    const appendOnly = [
      ["docsEvidence", "gt_documentation_evidence", docDbRow], ["qaRuns", "gt_qa_runs", qaDbRow], ["actions", "gt_executions", actionDbRow]
    ];
    for (const [collection, table, mapper] of appendOnly) {
      const oldIds = new Set((oldClient[collection] || []).map((row) => row.id));
      const rows = (client[collection] || []).filter((row) => !oldIds.has(row.id)).map((row) => mapper(client, row));
      await insertRows(table, rows);
    }
    const oldLogIds = new Set((oldClient.logs || []).map((row) => row.id));
    const logs = (client.logs || []).filter((row) => !oldLogIds.has(row.id)).map((row) => ({ tenant_id: TENANT_ID, client_id: client.id,
      actor_type: "agent", actor_id: "v4-gt-tracking-agent", level: ["debug", "info", "warning", "error", "critical"].includes(row.level) ? row.level : "info",
      category: "agent", action: "log", message: row.message, metadata: row.details || {} }));
    await insertRows("gt_audit_logs", logs);
  }
}

export async function mutateState(mutator) {
  const operation = writeQueue.then(async () => {
    const before = await readState();
    const state = structuredClone(before);
    const result = await mutator(state);
    await persistDiff(before, state);
    return result;
  });
  writeQueue = operation.catch(() => undefined);
  return operation;
}

export function createClientRecord(name, profile = {}) {
  const clientId = crypto.randomUUID();
  const gates = Array.from({ length: 7 }, (_, index) => ({
    id: crypto.randomUUID(), number: index + 1,
    name: ["Diagnostico e arquitetura", "Dicionario de dados e funil", "Base e integracao com CRM", "Historico de eventos", "Plataformas de midia", "Publicos e atribuicao", "Dashboard, QA e governanca"][index],
    status: index === 0 ? "ready" : "blocked", updatedAt: now(), findings: [], dependencies: [], risks: [], acceptanceCriteria: []
  }));
  return { id: clientId, slug: slugify(name), name, status: "diagnostic", paused: false, currentGate: 1, executionMode: "dry_run",
    createdAt: now(), updatedAt: now(), profile: { timezone: "America/Sao_Paulo", currency: "BRL", ...profile }, integrations: [], gates,
    approvals: [], docsEvidence: [], qaRuns: [], logs: [{ id: crypto.randomUUID(), at: now(), level: "info", message: "Workspace criado" }], actions: [],
    metrics: { integrationsConfigured: 0, pendingApprovals: 0, qaPassRate: null, trackingCoverage: null, lastSyncAt: null } };
}

export function summarizeClient(client) {
  const approvals = client.approvals || []; const qaRuns = client.qaRuns || []; const lastQa = qaRuns.at(-1);
  return { id: client.id, name: client.name, status: client.status, paused: Boolean(client.paused), currentGate: client.currentGate,
    integrations: (client.integrations || []).length, pendingApprovals: approvals.filter((item) => item.status === "pending").length,
    approvedActions: approvals.filter((item) => item.status === "approved").length, qaPassRate: lastQa?.passRate ?? null,
    lastUpdatedAt: client.updatedAt || client.createdAt };
}
