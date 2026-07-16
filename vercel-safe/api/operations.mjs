import { GATES } from "./config.mjs";
const TENANT = process.env.GT_TENANT_ID;
const mapClient = (x) => ({ id: x.id, name: x.name, status: x.status, paused: x.paused, currentGate: x.current_gate, integrations: 0, pendingApprovals: 0, approvedActions: 0, qaPassRate: null, lastUpdatedAt: x.updated_at });
async function callTool(db, name, a) {
  if (name === "search") {
    const q = String(a.query || "").toLowerCase();
    const docs = [{ id: "core", title: "Modelo operacional V4 GT Tracking", url: "https://developers.openai.com/apps-sdk/" }, { id: "meta", title: "Meta Conversions API", url: "https://developers.facebook.com/docs/marketing-api/conversions-api/" }, { id: "google", title: "Google Ads Offline Conversions", url: "https://developers.google.com/google-ads/api/docs/conversions/overview" }, { id: "gtm", title: "Google Tag Manager e GA4", url: "https://developers.google.com/tag-platform/tag-manager" }];
    return { results: docs.filter((x) => (x.id + x.title).toLowerCase().includes(q) || q.split(/\s+/).some((w) => x.title.toLowerCase().includes(w))) };
  }
  if (name === "fetch") {
    const docs = { core: { title: "Modelo operacional V4 GT Tracking", text: "Sete gates, leitura inicial, documenta\xE7\xE3o oficial, aprova\xE7\xF5es e QA.", url: "https://developers.openai.com/apps-sdk/" }, meta: { title: "Meta CAPI", text: "Validar event_id, event_time, action_source, user_data e deduplica\xE7\xE3o.", url: "https://developers.facebook.com/docs/marketing-api/conversions-api/" }, google: { title: "Google Ads", text: "Validar click IDs, Enhanced Conversions for Leads, valores e deduplica\xE7\xE3o.", url: "https://developers.google.com/google-ads/api/docs/conversions/overview" }, gtm: { title: "GTM e GA4", text: "Mapear dataLayer, consentimento, UTMs, click IDs, preview e rollback.", url: "https://developers.google.com/tag-platform/tag-manager" } };
    return { id: a.id, ...docs[a.id], metadata: { source: "v4-gt-tracking-agent" } };
  }
  if (name === "list_tracking_clients") {
    const { x, error } = await db.from("gt_clients").select("*").eq("tenant_id", TENANT).order("updated_at", { ascending: false });
    if (error) throw error;
    return { clients: (x || []).map(mapClient) };
  }
  if (name === "create_tracking_client") {
    const slug = String(a.name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const existing = await db.from("gt_clients").select("*").eq("tenant_id", TENANT).eq("slug", slug).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return { clientId: existing.data.id, created: false, client: mapClient(existing.data) };
    const created = await db.from("gt_clients").insert({ tenant_id: TENANT, name: a.name, slug, business_model: a.businessModel || null, timezone: a.timezone || "America/Sao_Paulo", status: "discovery", current_gate: 1, execution_mode: "dry_run", profile: { segment: a.segment || "", businessModel: a.businessModel || "", crm: a.crm || "" } }).select().single();
    if (created.error) throw created.error;
    const gates = GATES.map((gate, i) => ({ tenant_id: TENANT, client_id: created.data.id, gate_number: i + 1, name: gate, status: i ? "pending" : "in_progress", started_at: i ? null : (/* @__PURE__ */ new Date()).toISOString(), acceptance_criteria: ["Evid\xEAncias registradas", "Riscos classificados", "Depend\xEAncias identificadas"] }));
    const inserted = await db.from("gt_gates").insert(gates);
    if (inserted.error) throw inserted.error;
    return { clientId: created.data.id, created: true, client: mapClient(created.data) };
  }
  const cid = a.clientId;
  const client = await db.from("gt_clients").select("*").eq("id", cid).eq("tenant_id", TENANT).single();
  if (client.error) throw client.error;
  if (name === "get_tracking_dashboard" || name === "render_tracking_console") {
    const [g, i, ap, d, q, l, e] = await Promise.all([db.from("gt_gates").select("*").eq("client_id", cid).order("gate_number"), db.from("gt_integrations").select("*").eq("client_id", cid), db.from("gt_approvals").select("*").eq("client_id", cid).order("requested_at", { ascending: false }).limit(30), db.from("gt_documentation_evidence").select("*").eq("client_id", cid).order("verified_at", { ascending: false }).limit(30), db.from("gt_qa_runs").select("*").eq("client_id", cid).order("created_at", { ascending: false }).limit(20), db.from("gt_audit_logs").select("*").eq("client_id", cid).order("created_at", { ascending: false }).limit(80), db.from("gt_executions").select("*").eq("client_id", cid).order("created_at", { ascending: false }).limit(30)]);
    for (const z of [g, i, ap, d, q, l, e]) if (z.error) throw z.error;
    const qa = (q.data || []).map((x) => {
      const total = x.passed_count + x.warning_count + x.failed_count;
      return { id: x.id, scope: x.scope, status: x.status, checks: x.checks, passRate: total ? Math.round(x.passed_count / total * 100) : 0, createdAt: x.created_at };
    }), ints = i.data || [], approvals = ap.data || [];
    return { dashboard: { client: { ...mapClient(client.data), integrations: ints.length, pendingApprovals: approvals.filter((x) => x.status === "pending").length, approvedActions: approvals.filter((x) => x.status === "approved").length, qaPassRate: qa[0]?.passRate ?? null }, profile: client.data.profile || {}, metrics: { integrationsConfigured: ints.filter((x) => x.status === "configured").length, pendingApprovals: approvals.filter((x) => x.status === "pending").length, qaPassRate: qa[0]?.passRate ?? null }, gates: g.data || [], integrations: ints.map((x) => ({ id: x.id, platform: x.platform, category: x.category, accessMode: x.access_mode, status: x.status, owner: x.owner_name, updatedAt: x.updated_at })), approvals: approvals.map((x) => ({ id: x.id, title: x.title, platform: x.platform, adapter: x.adapter, risk: x.risk_level, reversible: x.reversible, rollbackPlan: x.rollback_plan, payload: x.requested_payload, status: x.status, createdAt: x.requested_at, reviewedAt: x.reviewed_at })), docsEvidence: d.data || [], qaRuns: qa, logs: (l.data || []).map((x) => ({ id: String(x.id), at: x.created_at, level: x.level, message: x.message, details: x.metadata })), actions: e.data || [], generatedAt: (/* @__PURE__ */ new Date()).toISOString() } };
  }
  if (name === "update_tracking_profile") {
    const profile = { ...client.data.profile || {}, ...a.fields || {} };
    const z = await db.from("gt_clients").update({ profile }).eq("id", cid).select("profile").single();
    if (z.error) throw z.error;
    return { clientId: cid, profile: z.data.profile };
  }
  if (name === "register_tracking_integration") {
    const found = await db.from("gt_integrations").select("*").eq("client_id", cid).ilike("platform", a.platform).maybeSingle();
    const values = { tenant_id: TENANT, client_id: cid, platform: a.platform, category: a.category || "other", access_mode: a.accessMode || "unknown", status: a.status || "planned", owner_name: a.owner || null, config: { notes: a.notes || "" }, last_checked_at: (/* @__PURE__ */ new Date()).toISOString() };
    const z = found.data ? await db.from("gt_integrations").update(values).eq("id", found.data.id).select().single() : await db.from("gt_integrations").insert(values).select().single();
    if (z.error) throw z.error;
    return { integration: z.data };
  }
  if (name === "run_tracking_gate") {
    const values = { status: a.status, summary: a.summary || null, findings: a.findings || [], dependencies: a.dependencies || [], risks: a.risks || [] };
    if (a.status === "completed") values.completed_at = (/* @__PURE__ */ new Date()).toISOString();
    const z = await db.from("gt_gates").update(values).eq("client_id", cid).eq("gate_number", a.gate).select().single();
    if (z.error) throw z.error;
    const next = a.status === "completed" && a.gate < 7 ? a.gate + 1 : null;
    if (next) {
      await db.from("gt_gates").update({ status: "in_progress", started_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("client_id", cid).eq("gate_number", next);
      await db.from("gt_clients").update({ current_gate: next, status: "implementation" }).eq("id", cid);
    }
    return { gate: z.data, nextGate: next };
  }
  if (name === "queue_tracking_action") {
    const z = await db.from("gt_approvals").insert({ tenant_id: TENANT, client_id: cid, title: a.title, platform: a.platform, adapter: a.adapter || "manual", action_type: "configuration_change", risk_level: a.risk || "medium", reversible: a.reversible !== false, rollback_plan: a.rollbackPlan, requested_payload: { ...a.payload || {}, evidenceRequired: a.evidenceRequired || [] }, status: "pending", requested_by: "agent" }).select().single();
    if (z.error) throw z.error;
    return { approval: z.data };
  }
  if (name === "review_tracking_action") {
    const z = await db.from("gt_approvals").update({ status: a.decision, review_note: a.note || null, reviewed_by: "user", reviewed_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", a.approvalId).eq("client_id", cid).eq("status", "pending").select().single();
    if (z.error) throw z.error;
    return { approval: z.data };
  }
  if (name === "execute_tracking_action") {
    const approval = await db.from("gt_approvals").select("*").eq("id", a.approvalId).eq("client_id", cid).single();
    if (approval.error) throw approval.error;
    if (approval.data.status !== "approved") throw new Error("A\xE7\xE3o ainda n\xE3o aprovada");
    if (["high", "critical"].includes(approval.data.risk_level) && !approval.data.reversible) throw new Error("A\xE7\xE3o de alto risco sem reversibilidade");
    const z = await db.from("gt_executions").insert({ tenant_id: TENANT, client_id: cid, approval_id: approval.data.id, execution_mode: client.data.execution_mode, executor_type: approval.data.adapter || "internal", action_name: approval.data.action_type, idempotency_key: approval.data.id + ":" + client.data.execution_mode, status: client.data.execution_mode === "live" ? "blocked" : "simulated", request_payload: approval.data.requested_payload, response_payload: { simulated: true, reason: "execution_mode_not_live" }, started_at: (/* @__PURE__ */ new Date()).toISOString(), finished_at: (/* @__PURE__ */ new Date()).toISOString() }).select().single();
    if (z.error) throw z.error;
    return { result: { ok: true, status: "dry_run", preview: approval.data.requested_payload }, approval: approval.data, execution: z.data };
  }
  if (name === "record_tracking_docs_evidence") {
    const url = new URL(a.url);
    const z = await db.from("gt_documentation_evidence").insert({ tenant_id: TENANT, client_id: cid, platform: a.platform, title: a.title, url: a.url, domain: url.hostname, version: a.version || null, verified_at: a.verifiedAt, verified_by: "agent", summary: a.notes || null, impact: a.impact, status: "current" }).select().single();
    if (z.error) throw z.error;
    return { evidence: z.data };
  }
  if (name === "record_tracking_qa") {
    const checks = a.checks || [], passed = checks.filter((x) => x.status === "pass").length, warnings = checks.filter((x) => x.status === "warning").length, failed = checks.filter((x) => x.status === "fail").length;
    const z = await db.from("gt_qa_runs").insert({ tenant_id: TENANT, client_id: cid, scope: a.scope, status: failed ? "fail" : warnings ? "warning" : "pass", checks, passed_count: passed, warning_count: warnings, failed_count: failed, completed_at: (/* @__PURE__ */ new Date()).toISOString() }).select().single();
    if (z.error) throw z.error;
    return { qaRun: { ...z.data, passRate: checks.length ? Math.round(passed / checks.length * 100) : 0 } };
  }
  if (name === "set_tracking_agent_pause") {
    const z = await db.from("gt_clients").update({ paused: a.paused, pause_reason: a.paused ? a.reason : null, status: a.paused ? "paused" : "implementation" }).eq("id", cid).select().single();
    if (z.error) throw z.error;
    return { clientId: cid, paused: a.paused };
  }
  throw new Error("Ferramenta n\xE3o encontrada");
}
export {
  callTool
};
