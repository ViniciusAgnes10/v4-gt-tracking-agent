import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const DATA_DIR = path.resolve(process.env.DATA_DIR || "./data");
const STATE_FILE = path.join(DATA_DIR, "state.json");
let writeQueue = Promise.resolve();

const now = () => new Date().toISOString();
export const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;
export const slugify = (value) => String(value || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function ensureState() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { await fs.access(STATE_FILE); }
  catch {
    await fs.writeFile(STATE_FILE, JSON.stringify({ version: 1, clients: {}, updatedAt: now() }, null, 2));
  }
}

export async function readState() {
  await ensureState();
  const raw = await fs.readFile(STATE_FILE, "utf8");
  const state = JSON.parse(raw);
  state.clients ||= {};
  return state;
}

export async function mutateState(mutator) {
  const operation = writeQueue.then(async () => {
    const state = await readState();
    const result = await mutator(state);
    state.updatedAt = now();
    const tmp = `${STATE_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(state, null, 2));
    await fs.rename(tmp, STATE_FILE);
    return result;
  });
  writeQueue = operation.catch(() => undefined);
  return operation;
}

export function createClientRecord(name, profile = {}) {
  const clientId = slugify(name) || id("client");
  const gates = Array.from({ length: 7 }, (_, index) => ({
    number: index + 1,
    name: [
      "Diagnostico e arquitetura",
      "Dicionario de dados e funil",
      "Base e integracao com CRM",
      "Historico de eventos",
      "Plataformas de midia",
      "Publicos e atribuicao",
      "Dashboard, QA e governanca"
    ][index],
    status: index === 0 ? "ready" : "blocked",
    updatedAt: now(),
    findings: [],
    dependencies: [],
    risks: []
  }));
  return {
    id: clientId,
    name,
    status: "diagnostic",
    paused: false,
    currentGate: 1,
    createdAt: now(),
    updatedAt: now(),
    profile: { timezone: "America/Sao_Paulo", currency: "BRL", ...profile },
    integrations: [],
    gates,
    approvals: [],
    docsEvidence: [],
    qaRuns: [],
    logs: [{ id: id("log"), at: now(), level: "info", message: "Workspace criado" }],
    actions: [],
    metrics: {
      integrationsConfigured: 0,
      pendingApprovals: 0,
      qaPassRate: null,
      trackingCoverage: null,
      lastSyncAt: null
    }
  };
}

export function summarizeClient(client) {
  const approvals = client.approvals || [];
  const qaRuns = client.qaRuns || [];
  const lastQa = qaRuns.at(-1);
  return {
    id: client.id,
    name: client.name,
    status: client.status,
    paused: Boolean(client.paused),
    currentGate: client.currentGate,
    integrations: (client.integrations || []).length,
    pendingApprovals: approvals.filter((item) => item.status === "pending").length,
    approvedActions: approvals.filter((item) => item.status === "approved").length,
    qaPassRate: lastQa?.passRate ?? null,
    lastUpdatedAt: client.updatedAt || client.createdAt
  };
}
