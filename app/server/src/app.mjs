import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { readState, mutateState, createClientRecord, summarizeClient, id, slugify } from "./store.mjs";
import { executeAction } from "./executor.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIDGET_URI = "ui://widget/v4-tracking-console-v1.html";
const widgetHtml = readFileSync(path.resolve(__dirname, "../../web/tracking-console.html"), "utf8");
const now = () => new Date().toISOString();

function requireClient(state, clientId) {
  const client = state.clients[clientId];
  if (!client) throw new Error(`Cliente nao encontrado: ${clientId}`);
  return client;
}

function dashboardPayload(client) {
  client.metrics = {
    ...(client.metrics || {}),
    integrationsConfigured: (client.integrations || []).filter((item) => item.status === "configured").length,
    pendingApprovals: (client.approvals || []).filter((item) => item.status === "pending").length
  };
  return {
    client: summarizeClient(client),
    profile: client.profile,
    metrics: client.metrics,
    gates: client.gates,
    integrations: client.integrations,
    approvals: client.approvals.slice(-30).reverse(),
    docsEvidence: client.docsEvidence.slice(-30).reverse(),
    qaRuns: client.qaRuns.slice(-20).reverse(),
    logs: client.logs.slice(-80).reverse(),
    actions: client.actions.slice(-30).reverse(),
    generatedAt: now()
  };
}

export function createTrackingServer() {
  const server = new McpServer(
    { name: "v4-gt-tracking-agent", version: "1.0.0" },
    {
      instructions: "Use o dashboard para escolher o cliente. Comece em leitura e Gate 1. Nunca execute alteracoes externas sem uma aprovacao aprovada no mesmo cliente. Use documentacao oficial e registre evidencias."
    }
  );

  registerAppResource(server, "v4-tracking-console", WIDGET_URI, {}, async () => ({
    contents: [{
      uri: WIDGET_URI,
      mimeType: RESOURCE_MIME_TYPE,
      text: widgetHtml,
      _meta: {
        ui: {
          prefersBorder: false,
          csp: { connectDomains: [], resourceDomains: [] }
        },
        "openai/widgetDescription": "Console V4 para acompanhar gates, integracoes, aprovacoes, documentacao, QA e execucao do GT de Tracking."
      }
    }]
  }));

  registerAppTool(server, "list_tracking_clients", {
    title: "Listar clientes de tracking",
    description: "Use quando precisar localizar workspaces de clientes antes de abrir ou executar um gate.",
    inputSchema: {},
    outputSchema: { clients: z.array(z.object({
      id: z.string(), name: z.string(), status: z.string(), paused: z.boolean(), currentGate: z.number(),
      integrations: z.number(), pendingApprovals: z.number(), approvedActions: z.number(),
      qaPassRate: z.number().nullable(), lastUpdatedAt: z.string()
    })) },
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false }
  }, async () => {
    const state = await readState();
    const structuredContent = { clients: Object.values(state.clients).map(summarizeClient) };
    return { structuredContent, content: [{ type: "text", text: JSON.stringify(structuredContent) }] };
  });

  registerAppTool(server, "create_tracking_client", {
    title: "Criar workspace de tracking",
    description: "Use quando o usuario iniciar um novo cliente e quiser criar o workspace operacional local antes de qualquer alteracao externa.",
    inputSchema: {
      name: z.string().min(2),
      segment: z.string().optional(),
      businessModel: z.string().optional(),
      crm: z.string().optional(),
      timezone: z.string().default("America/Sao_Paulo")
    },
    outputSchema: { clientId: z.string(), created: z.boolean(), client: z.any() },
    annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
    _meta: { "openai/toolInvocation/invoking": "Criando workspace...", "openai/toolInvocation/invoked": "Workspace criado." }
  }, async (input) => {
    const result = await mutateState((state) => {
      const candidate = createClientRecord(input.name, {
        segment: input.segment || "",
        businessModel: input.businessModel || "",
        crm: input.crm || "",
        timezone: input.timezone
      });
      const existing = Object.values(state.clients).find((item) => slugify(item.name) === candidate.slug);
      if (existing) return { clientId: existing.id, created: false, client: summarizeClient(existing) };
      state.clients[candidate.id] = candidate;
      return { clientId: candidate.id, created: true, client: summarizeClient(candidate) };
    });
    return { structuredContent: result, content: [{ type: "text", text: `Workspace ${result.clientId} ${result.created ? "criado" : "ja existia"}.` }] };
  });

  registerAppTool(server, "get_tracking_dashboard", {
    title: "Obter dashboard do tracking",
    description: "Use para obter o estado completo e atual de um cliente antes de diagnosticar, planejar ou executar qualquer acao.",
    inputSchema: { clientId: z.string() },
    outputSchema: { dashboard: z.any() },
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false }
  }, async ({ clientId }) => {
    const state = await readState();
    const dashboard = dashboardPayload(requireClient(state, clientId));
    return { structuredContent: { dashboard }, content: [{ type: "text", text: `Dashboard carregado para ${dashboard.client.name}.` }], _meta: { dashboard } };
  });

  registerAppTool(server, "render_tracking_console", {
    title: "Abrir console visual de tracking",
    description: "Use depois de get_tracking_dashboard para renderizar a interface operacional do cliente.",
    inputSchema: { clientId: z.string() },
    outputSchema: { dashboard: z.any() },
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
    _meta: {
      ui: { resourceUri: WIDGET_URI },
      "openai/outputTemplate": WIDGET_URI,
      "openai/toolInvocation/invoking": "Abrindo console...",
      "openai/toolInvocation/invoked": "Console aberto."
    }
  }, async ({ clientId }) => {
    const state = await readState();
    const dashboard = dashboardPayload(requireClient(state, clientId));
    return { structuredContent: { dashboard }, content: [{ type: "text", text: `Console de ${dashboard.client.name}.` }], _meta: { dashboard } };
  });

  registerAppTool(server, "update_tracking_profile", {
    title: "Atualizar perfil tecnico do cliente",
    description: "Use para registrar contexto confirmado do cliente no workspace local, sem alterar plataformas externas.",
    inputSchema: { clientId: z.string(), fields: z.record(z.string(), z.any()) },
    outputSchema: { clientId: z.string(), profile: z.any() },
    annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false }
  }, async ({ clientId, fields }) => {
    const result = await mutateState((state) => {
      const client = requireClient(state, clientId);
      client.profile = { ...client.profile, ...fields };
      client.updatedAt = now();
      client.logs.push({ id: id("log"), at: now(), level: "info", message: "Perfil tecnico atualizado", details: Object.keys(fields) });
      return { clientId, profile: client.profile };
    });
    return { structuredContent: result, content: [{ type: "text", text: "Perfil tecnico atualizado." }] };
  });

  registerAppTool(server, "register_tracking_integration", {
    title: "Registrar integracao",
    description: "Use para registrar uma plataforma, seu modo de acesso e status de configuracao no workspace local.",
    inputSchema: {
      clientId: z.string(), platform: z.string(), category: z.string(), accessMode: z.string(),
      status: z.enum(["planned", "connected", "configured", "error", "paused"]),
      owner: z.string().optional(), notes: z.string().optional()
    },
    outputSchema: { integration: z.any() },
    annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false }
  }, async (input) => {
    const integration = await mutateState((state) => {
      const client = requireClient(state, input.clientId);
      const existing = client.integrations.find((item) => item.platform.toLowerCase() === input.platform.toLowerCase());
      const record = { id: existing?.id || id("int"), platform: input.platform, category: input.category, accessMode: input.accessMode, status: input.status, owner: input.owner || "", notes: input.notes || "", updatedAt: now() };
      if (existing) Object.assign(existing, record); else client.integrations.push(record);
      client.updatedAt = now();
      return record;
    });
    return { structuredContent: { integration }, content: [{ type: "text", text: `${integration.platform}: ${integration.status}.` }] };
  });

  registerAppTool(server, "run_tracking_gate", {
    title: "Executar gate de tracking",
    description: "Use para registrar o diagnostico de um gate, seus achados, riscos e dependencias. Nao executa mudancas externas.",
    inputSchema: {
      clientId: z.string(), gate: z.number().int().min(1).max(7),
      status: z.enum(["ready", "in_progress", "blocked", "awaiting_approval", "completed"]),
      findings: z.array(z.string()).default([]), dependencies: z.array(z.string()).default([]), risks: z.array(z.string()).default([])
    },
    outputSchema: { gate: z.any(), nextGate: z.number().nullable() },
    annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false }
  }, async (input) => {
    const result = await mutateState((state) => {
      const client = requireClient(state, input.clientId);
      const gate = client.gates.find((item) => item.number === input.gate);
      Object.assign(gate, { status: input.status, findings: input.findings, dependencies: input.dependencies, risks: input.risks, updatedAt: now() });
      if (input.status === "completed" && input.gate < 7) {
        const next = client.gates.find((item) => item.number === input.gate + 1);
        if (next.status === "blocked") next.status = "ready";
        client.currentGate = input.gate + 1;
      } else client.currentGate = input.gate;
      client.status = input.status === "completed" && input.gate === 7 ? "operational" : "implementation";
      client.updatedAt = now();
      client.logs.push({ id: id("log"), at: now(), level: "info", message: `Gate ${input.gate}: ${input.status}` });
      return { gate, nextGate: input.status === "completed" && input.gate < 7 ? input.gate + 1 : null };
    });
    return { structuredContent: result, content: [{ type: "text", text: `Gate ${input.gate} atualizado para ${input.status}.` }] };
  });

  registerAppTool(server, "queue_tracking_action", {
    title: "Colocar acao externa em aprovacao",
    description: "Use antes de qualquer escrita externa em CRM, midia, GTM, banco, planilha, webhook ou automacao.",
    inputSchema: {
      clientId: z.string(), title: z.string(), platform: z.string(), adapter: z.enum(["n8n", "make", "webhook", "manual"]),
      risk: z.enum(["low", "medium", "high", "critical"]), reversible: z.boolean(),
      payload: z.record(z.string(), z.any()), rollbackPlan: z.string(), evidenceRequired: z.array(z.string()).default([])
    },
    outputSchema: { approval: z.any() },
    annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false }
  }, async (input) => {
    const approval = await mutateState((state) => {
      const client = requireClient(state, input.clientId);
      const record = { id: id("approval"), title: input.title, platform: input.platform, adapter: input.adapter, risk: input.risk, reversible: input.reversible, payload: input.payload, rollbackPlan: input.rollbackPlan, evidenceRequired: input.evidenceRequired, status: "pending", createdAt: now(), reviewedAt: null, executedAt: null, executionResult: null };
      client.approvals.push(record);
      client.updatedAt = now();
      return record;
    });
    return { structuredContent: { approval }, content: [{ type: "text", text: `Acao ${approval.id} aguardando aprovacao.` }] };
  });

  registerAppTool(server, "review_tracking_action", {
    title: "Aprovar ou rejeitar acao de tracking",
    description: "Use somente quando o usuario aprovar ou rejeitar explicitamente uma acao pendente.",
    inputSchema: { clientId: z.string(), approvalId: z.string(), decision: z.enum(["approved", "rejected"]), note: z.string().optional() },
    outputSchema: { approval: z.any() },
    annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
    _meta: { ui: { visibility: ["model", "app"] } }
  }, async ({ clientId, approvalId, decision, note }) => {
    const approval = await mutateState((state) => {
      const client = requireClient(state, clientId);
      const record = client.approvals.find((item) => item.id === approvalId);
      if (!record) throw new Error("Aprovacao nao encontrada");
      if (record.status !== "pending") throw new Error(`Aprovacao ja esta ${record.status}`);
      record.status = decision;
      record.reviewNote = note || "";
      record.reviewedAt = now();
      client.logs.push({ id: id("log"), at: now(), level: "info", message: `${decision}: ${record.title}` });
      client.updatedAt = now();
      return record;
    });
    return { structuredContent: { approval }, content: [{ type: "text", text: `Acao ${decision}.` }] };
  });

  registerAppTool(server, "execute_tracking_action", {
    title: "Executar acao aprovada",
    description: "Use somente depois de confirmar que a acao esta aprovada, possui rollback e o executor externo esta configurado.",
    inputSchema: { clientId: z.string(), approvalId: z.string() },
    outputSchema: { result: z.any(), approval: z.any() },
    annotations: { readOnlyHint: false, openWorldHint: true, destructiveHint: false },
    _meta: { ui: { visibility: ["model", "app"] }, "openai/toolInvocation/invoking": "Executando acao aprovada...", "openai/toolInvocation/invoked": "Execucao finalizada." }
  }, async ({ clientId, approvalId }) => {
    const state = await readState();
    const client = requireClient(state, clientId);
    const approval = client.approvals.find((item) => item.id === approvalId);
    if (!approval) throw new Error("Aprovacao nao encontrada");
    if (approval.status !== "approved") throw new Error("A acao ainda nao esta aprovada");
    if (["high", "critical"].includes(approval.risk) && !approval.reversible) throw new Error("Acao de alto risco sem reversibilidade: execucao bloqueada");
    const result = await executeAction(approval, client);
    const updated = await mutateState((nextState) => {
      const nextClient = requireClient(nextState, clientId);
      const record = nextClient.approvals.find((item) => item.id === approvalId);
      record.executionResult = result;
      record.executedAt = now();
      record.status = result.ok ? (result.status === "dry_run" ? "approved" : "executed") : "execution_error";
      nextClient.actions.push({ id: id("action"), approvalId, title: record.title, at: now(), result });
      nextClient.logs.push({ id: id("log"), at: now(), level: result.ok ? "info" : "error", message: `Execucao ${result.status}: ${record.title}` });
      nextClient.updatedAt = now();
      return record;
    });
    return { structuredContent: { result, approval: updated }, content: [{ type: "text", text: `Resultado da execucao: ${result.status}.` }] };
  });

  registerAppTool(server, "record_tracking_docs_evidence", {
    title: "Registrar evidencia de documentacao",
    description: "Use depois de consultar documentacao oficial para registrar pagina, versao, data e impacto no projeto.",
    inputSchema: { clientId: z.string(), platform: z.string(), title: z.string(), url: z.string().url(), verifiedAt: z.string(), version: z.string().optional(), impact: z.string(), notes: z.string().optional() },
    outputSchema: { evidence: z.any() },
    annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false }
  }, async (input) => {
    const evidence = await mutateState((state) => {
      const client = requireClient(state, input.clientId);
      const record = { id: id("doc"), ...input, createdAt: now() };
      delete record.clientId;
      client.docsEvidence.push(record);
      client.updatedAt = now();
      return record;
    });
    return { structuredContent: { evidence }, content: [{ type: "text", text: `Evidencia registrada para ${evidence.platform}.` }] };
  });

  registerAppTool(server, "record_tracking_qa", {
    title: "Registrar execucao de QA",
    description: "Use para registrar verificacoes, falhas e pass rate antes ou depois do go-live.",
    inputSchema: { clientId: z.string(), scope: z.string(), checks: z.array(z.object({ name: z.string(), status: z.enum(["pass", "fail", "warning"]), evidence: z.string().optional() })) },
    outputSchema: { qaRun: z.any() },
    annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false }
  }, async ({ clientId, scope, checks }) => {
    const qaRun = await mutateState((state) => {
      const client = requireClient(state, clientId);
      const passed = checks.filter((item) => item.status === "pass").length;
      const record = { id: id("qa"), scope, checks, passRate: checks.length ? Math.round((passed / checks.length) * 100) : 0, createdAt: now() };
      client.qaRuns.push(record);
      client.metrics.qaPassRate = record.passRate;
      client.updatedAt = now();
      return record;
    });
    return { structuredContent: { qaRun }, content: [{ type: "text", text: `QA registrado: ${qaRun.passRate}% aprovado.` }] };
  });

  registerAppTool(server, "set_tracking_agent_pause", {
    title: "Pausar ou retomar agente",
    description: "Use quando o usuario pedir para impedir ou liberar novas execucoes externas para um cliente.",
    inputSchema: { clientId: z.string(), paused: z.boolean(), reason: z.string() },
    outputSchema: { clientId: z.string(), paused: z.boolean() },
    annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false }
  }, async ({ clientId, paused, reason }) => {
    const result = await mutateState((state) => {
      const client = requireClient(state, clientId);
      client.paused = paused;
      client.logs.push({ id: id("log"), at: now(), level: "warning", message: paused ? `Agente pausado: ${reason}` : `Agente retomado: ${reason}` });
      client.updatedAt = now();
      return { clientId, paused };
    });
    return { structuredContent: result, content: [{ type: "text", text: paused ? "Agente pausado." : "Agente retomado." }] };
  });

  registerAppTool(server, "search", {
    title: "Pesquisar conhecimento de tracking",
    description: "Use para pesquisar os guias locais do agente por plataforma, gate ou conceito.",
    inputSchema: { query: z.string() },
    outputSchema: { results: z.array(z.object({ id: z.string(), title: z.string(), url: z.string() })) },
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false }
  }, async ({ query }) => {
    const q = query.toLowerCase();
    const docs = [
      { id: "core", title: "Modelo operacional V4 GT Tracking", url: "https://developers.openai.com/apps-sdk/" },
      { id: "meta", title: "Adaptador Meta CAPI", url: "https://developers.facebook.com/docs/marketing-api/conversions-api/" },
      { id: "google", title: "Adaptador Google Ads", url: "https://developers.google.com/google-ads/api/docs/conversions/overview" },
      { id: "gtm", title: "GTM e GA4", url: "https://developers.google.com/tag-platform/tag-manager" }
    ].filter((item) => `${item.id} ${item.title}`.toLowerCase().includes(q) || q.split(/\s+/).some((part) => item.title.toLowerCase().includes(part)));
    const structuredContent = { results: docs };
    return { structuredContent, content: [{ type: "text", text: JSON.stringify(structuredContent) }] };
  });

  registerAppTool(server, "fetch", {
    title: "Abrir conhecimento de tracking",
    description: "Use para recuperar o resumo operacional de um item encontrado por search.",
    inputSchema: { id: z.string() },
    outputSchema: { id: z.string(), title: z.string(), text: z.string(), url: z.string(), metadata: z.record(z.string(), z.string()).optional() },
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false }
  }, async ({ id: docId }) => {
    const docs = {
      core: { title: "Modelo operacional V4 GT Tracking", text: "Trabalhar por sete gates, iniciar em leitura, registrar evidencias e exigir aprovacao para escritas externas.", url: "https://developers.openai.com/apps-sdk/" },
      meta: { title: "Adaptador Meta CAPI", text: "Validar event_id, event_time, action_source, user_data normalizado, Test Events, go-live e deduplicacao.", url: "https://developers.facebook.com/docs/marketing-api/conversions-api/" },
      google: { title: "Adaptador Google Ads", text: "Validar actions, click IDs, enhanced conversions for leads, order ID, timezone, valor e deduplicacao.", url: "https://developers.google.com/google-ads/api/docs/conversions/overview" },
      gtm: { title: "GTM e GA4", text: "Mapear dataLayer, consentimento, first/last touch, click IDs, eventos, preview, publicacao e rollback.", url: "https://developers.google.com/tag-platform/tag-manager" }
    };
    const doc = docs[docId];
    if (!doc) throw new Error("Documento nao encontrado");
    const structuredContent = { id: docId, ...doc, metadata: { source: "v4-gt-tracking-agent" } };
    return { structuredContent, content: [{ type: "text", text: JSON.stringify(structuredContent) }] };
  });

  return server;
}

export default createTrackingServer();
