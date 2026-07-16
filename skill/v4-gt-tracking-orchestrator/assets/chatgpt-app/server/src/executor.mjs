const allowedAdapters = new Set(
  String(process.env.ALLOWED_EXECUTION_ADAPTERS || "n8n,make,webhook")
    .split(",").map((item) => item.trim()).filter(Boolean)
);

export async function executeAction(action, client) {
  const mode = process.env.EXECUTION_MODE || "dry_run";
  if (!allowedAdapters.has(action.adapter)) {
    return { ok: false, status: "blocked", reason: `Adapter nao permitido: ${action.adapter}` };
  }
  if (mode !== "live") {
    return {
      ok: true,
      status: "dry_run",
      reason: "EXECUTION_MODE nao esta em live",
      preview: { clientId: client.id, actionId: action.id, action: action.payload }
    };
  }
  const url = process.env.N8N_EXECUTION_WEBHOOK_URL;
  if (!url) return { ok: false, status: "blocked", reason: "Webhook de execucao nao configurado" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.N8N_EXECUTION_TOKEN ? { authorization: `Bearer ${process.env.N8N_EXECUTION_TOKEN}` } : {})
      },
      body: JSON.stringify({
        source: "v4-gt-tracking-agent",
        client: { id: client.id, name: client.name },
        action
      }),
      signal: controller.signal
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.ok ? "executed" : "error",
      httpStatus: response.status,
      response: text.slice(0, 4000)
    };
  } catch (error) {
    return { ok: false, status: "error", reason: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeout);
  }
}
