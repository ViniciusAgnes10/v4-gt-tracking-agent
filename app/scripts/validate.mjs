import { promises as fs } from "node:fs";
import path from "node:path";

const required = [
  "package.json", "package-lock.json", "vercel.json", ".env.example", ".gitignore",
  "server/src/app.mjs", "server/src/http.mjs", "server/src/store.mjs", "server/src/executor.mjs",
  "api/mcp.mjs", "api/health.mjs", "web/tracking-console.html", "public/index.html", "README.md",
  "supabase/migrations/202607160001_gt_tracking_core.sql",
  "supabase/migrations/202607160002_agent_data_api_access.sql"
];
let failed = false;
const pass = (message) => console.log(`PASS ${message}`);
const fail = (message) => { console.error(`FAIL ${message}`); failed = true; };

for (const file of required) {
  try {
    const stat = await fs.stat(path.resolve(file));
    if (!stat.isFile()) throw new Error("not a file");
    pass(file);
  } catch (error) { fail(`${file}: ${error.message}`); }
}

for (const forbidden of ["data/state.json", ".agent-secret", ".mcp-access-token", ".env.local"]) {
  try {
    await fs.access(path.resolve(forbidden));
    if ([".agent-secret", ".mcp-access-token", ".env.local"].includes(forbidden)) {
      const gitignore = await fs.readFile(".gitignore", "utf8");
      if (!gitignore.includes(forbidden)) fail(`${forbidden} exists but is not ignored`); else pass(`${forbidden} ignored`);
    } else fail(`${forbidden} must not be part of the deployable app`);
  } catch { pass(`${forbidden} absent or intentionally ignored`); }
}

const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
for (const dep of ["@modelcontextprotocol/sdk", "@modelcontextprotocol/ext-apps", "zod", "express"]) {
  const value = pkg.dependencies?.[dep];
  if (!value) fail(`dependency ${dep}`);
  else if (/^[~^]/.test(value)) fail(`dependency ${dep} must be pinned, got ${value}`);
  else pass(`dependency ${dep}@${value}`);
}

const html = await fs.readFile("web/tracking-console.html", "utf8");
for (const token of ["window.openai", "callTool", "requestDisplayMode", "ui/notifications/tool-result"]) {
  if (!html.includes(token)) fail(`widget token ${token}`); else pass(`widget token ${token}`);
}

const app = await fs.readFile("server/src/app.mjs", "utf8");
const tools = [...app.matchAll(/registerAppTool\(server,\s*"([^"]+)"/g)].map((m) => m[1]);
console.log(`INFO tools ${tools.length}: ${tools.join(", ")}`);
if (tools.length !== 15) fail(`expected 15 tools, got ${tools.length}`); else pass("15 MCP tools");

const store = await fs.readFile("server/src/store.mjs", "utf8");
for (const token of ["/rest/v1/", "x-agent-key", "SUPABASE_ANON_KEY", "TENANT_ID", "persistDiff"]) {
  if (!store.includes(token)) fail(`store token ${token}`); else pass(`store token ${token}`);
}
if (store.includes("writeFile") || store.includes("state.json")) fail("store still contains local persistence");
else pass("no local state persistence");

const mcp = await fs.readFile("api/mcp.mjs", "utf8");
for (const token of ["runWithAgentKey", "StreamableHTTPServerTransport", "req.query?.token"]) {
  if (!mcp.includes(token)) fail(`MCP protection ${token}`); else pass(`MCP protection ${token}`);
}

const env = await fs.readFile(".env.example", "utf8");
for (const key of ["EXECUTION_MODE", "ALLOWED_EXECUTION_ADAPTERS", "N8N_EXECUTION_WEBHOOK_URL", "N8N_EXECUTION_TOKEN"]) {
  if (!env.includes(`${key}=`)) fail(`env ${key}`); else pass(`env ${key}`);
}
for (const forbiddenValue of ["qcwefiyfqhxyfexsseuw", "sb_publishable_", "GT_AGENT_KEY=", "MCP_ACCESS_TOKEN="]) {
  if (env.includes(forbiddenValue)) fail(`.env.example contains forbidden value ${forbiddenValue}`);
}
pass(".env.example contains no deployment secrets");

if (failed) process.exit(1);
console.log("VALIDATION_OK");
