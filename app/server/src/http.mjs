import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createTrackingServer } from "./app.mjs";
import { readState, runWithAgentKey } from "./store.mjs";

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/health/:token", async (req, res) => {
  if (String(req.params.token || "").length < 32) return res.status(401).json({ ok: false, error: "unauthorized" });
  try {
    await runWithAgentKey(req.params.token, async () => {
      const state = await readState();
      res.json({ ok: true, service: "v4-gt-tracking-agent", storage: "supabase", clients: Object.keys(state.clients || {}).length, time: new Date().toISOString() });
    });
  } catch (error) { res.status(503).json({ ok: false, error: error instanceof Error ? error.message : String(error) }); }
});
app.post("/mcp/:token", async (req, res) => {
  if (String(req.params.token || "").length < 32) return res.status(401).json({ error: "unauthorized" });
  return runWithAgentKey(req.params.token, async () => {
    const server = createTrackingServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });
});
app.get("/mcp/:token", (_req, res) => res.status(405).json({ error: "Use POST /mcp/:token" }));
app.delete("/mcp/:token", (_req, res) => res.status(405).json({ error: "Stateless transport" }));

const port = Number(process.env.PORT || 2091);
app.listen(port, "0.0.0.0", () => console.log(`V4 GT Tracking Agent: http://127.0.0.1:${port}/mcp/<token>`));
