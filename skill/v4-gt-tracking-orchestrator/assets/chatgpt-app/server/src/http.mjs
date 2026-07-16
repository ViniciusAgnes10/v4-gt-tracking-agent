import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createTrackingServer } from "./app.mjs";

const app = express();
app.use(express.json({ limit: "2mb" }));
app.get("/health", (_req, res) => res.json({ ok: true, service: "v4-gt-tracking-agent", time: new Date().toISOString() }));
app.post("/mcp", async (req, res) => {
  const server = createTrackingServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
app.get("/mcp", (_req, res) => res.status(405).json({ error: "Use POST /mcp" }));
app.delete("/mcp", (_req, res) => res.status(405).json({ error: "Stateless transport" }));

const port = Number(process.env.PORT || 2091);
app.listen(port, "0.0.0.0", () => console.log(`V4 GT Tracking Agent: http://127.0.0.1:${port}/mcp`));
