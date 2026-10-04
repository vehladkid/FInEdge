import { config } from "../config/index.js";

// Optional LLM provider (Anthropic Messages API). Only aggregated figures are
// sent — never raw transactions, names or emails. Returns null when no key is
// configured; throws on provider failure so the caller can fall back.
export async function aiInsights(data, fetchImpl = fetch) {
  if (!config.aiApiKey) return null;
  const res = await fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.aiApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.aiModel,
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content:
            "You are a personal finance assistant. Given this month's aggregated figures, reply with ONLY a JSON array of up to 4 objects " +
            '{"severity":"info|warning|critical|positive","message":"<one plain sentence>"}.\n' +
            JSON.stringify(data),
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`AI provider responded ${res.status}`);
  const body = await res.json();
  const text = body.content?.[0]?.text ?? "";
  const parsed = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1));
  return parsed
    .filter((i) => i && typeof i.message === "string" && i.message)
    .slice(0, 4)
    .map((i, n) => ({
      id: `ai-${n}`,
      severity: ["info", "warning", "critical", "positive"].includes(i.severity) ? i.severity : "info",
      message: i.message,
    }));
}
