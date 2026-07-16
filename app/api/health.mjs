import { readState, runWithAgentKey } from "../server/src/store.mjs";
export const maxDuration = 30;
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Use GET" });
  const token = String(req.query?.token || "");
  if (token.length < 32) return res.status(401).json({ ok: false, error: "unauthorized" });
  try {
    return await runWithAgentKey(token, async () => {
      const state = await readState();
      return res.status(200).json({ ok: true, service: "v4-gt-tracking-agent", storage: "supabase", executionMode: "dry_run", clients: Object.keys(state.clients || {}).length, time: new Date().toISOString() });
    });
  } catch (error) {
    return res.status(503).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}
