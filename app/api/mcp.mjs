import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createTrackingServer } from "../server/src/app.mjs";
import { runWithAgentKey } from "../server/src/store.mjs";

export const maxDuration = 300;

export default async function handler(req, res) {
  const token = String(req.query?.token || "");
  if (token.length < 32) return res.status(401).json({ error: "unauthorized" });
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST" });
  }
  return runWithAgentKey(token, async () => {
    const server = createTrackingServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => transport.close());
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("mcp_handler_error", error);
      if (!res.headersSent) res.status(500).json({ error: "mcp_handler_error" });
    }
  });
}
