import { describe, it, expect, vi, beforeEach } from "vitest";

async function load(key) {
  vi.resetModules();
  vi.stubEnv("AI_API_KEY", key);
  return (await import("../../src/services/aiClient.js")).aiInsights;
}
const reply = (status, text) => ({ ok: status === 200, status, json: async () => ({ content: [{ text }] }) });
const data = { thisMonth: { income: 1, expenses: 2 } };

beforeEach(() => vi.unstubAllEnvs());

describe("aiInsights", () => {
  it("does nothing without an API key (never calls the network)", async () => {
    const aiInsights = await load("");
    const fetchImpl = vi.fn();
    expect(await aiInsights(data, fetchImpl)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("calls the provider with the key, model and aggregated data only", async () => {
    const aiInsights = await load("sk-test");
    const fetchImpl = vi.fn().mockResolvedValue(reply(200, '[{"severity":"warning","message":"Dining is up"}]'));
    await aiInsights(data, fetchImpl);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(init.method).toBe("POST");
    expect(init.headers["x-api-key"]).toBe("sk-test");
    expect(init.headers["anthropic-version"]).toBe("2023-06-01");
    expect(init.headers["content-type"]).toBe("application/json");
    const body = JSON.parse(init.body);
    expect(body.model).toMatch(/claude/);
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe("user");
    expect(body.messages[0].content).toContain("personal finance assistant");
    expect(body.messages[0].content).toContain("JSON array");
    expect(body.messages[0].content).toContain(JSON.stringify(data));
  });

  it("parses the model's JSON array, tolerating surrounding prose", async () => {
    const aiInsights = await load("k");
    const fetchImpl = vi.fn().mockResolvedValue(reply(200, 'Sure! [{"severity":"critical","message":"Over budget"},{"severity":"positive","message":"Great savings"}] Hope this helps.'));
    expect(await aiInsights(data, fetchImpl)).toEqual([
      { id: "ai-0", severity: "critical", message: "Over budget" },
      { id: "ai-1", severity: "positive", message: "Great savings" },
    ]);
  });

  it("defaults an unknown severity to info and drops malformed items", async () => {
    const aiInsights = await load("k");
    const text = JSON.stringify([{ severity: "doom", message: "x" }, { severity: "info" }, null, { severity: "info", message: "" }, { message: "kept" }]);
    expect(await aiInsights(data, vi.fn().mockResolvedValue(reply(200, text)))).toEqual([
      { id: "ai-0", severity: "info", message: "x" },
      { id: "ai-1", severity: "info", message: "kept" },
    ]);
  });

  it("keeps every valid severity and drops non-string messages", async () => {
    const aiInsights = await load("k");
    const text = JSON.stringify([
      { severity: "info", message: "a" }, { severity: "warning", message: "b" },
      { severity: "critical", message: "c" }, { severity: "positive", message: "d" },
    ]);
    const out = await aiInsights(data, vi.fn().mockResolvedValue(reply(200, text)));
    expect(out.map((i) => i.severity)).toEqual(["info", "warning", "critical", "positive"]);
    const bad = await aiInsights(data, vi.fn().mockResolvedValue(reply(200, JSON.stringify([{ severity: "info", message: 123 }, { severity: "info", message: "ok" }]))));
    expect(bad).toEqual([{ id: "ai-0", severity: "info", message: "ok" }]);
  });

  it("returns at most four insights", async () => {
    const aiInsights = await load("k");
    const text = JSON.stringify(Array.from({ length: 6 }, (_, i) => ({ severity: "info", message: `m${i}` })));
    expect(await aiInsights(data, vi.fn().mockResolvedValue(reply(200, text)))).toHaveLength(4);
  });

  it("throws when the provider responds with an error status", async () => {
    const aiInsights = await load("k");
    await expect(aiInsights(data, vi.fn().mockResolvedValue(reply(429, "")))).rejects.toThrow("AI provider responded 429");
  });

  it("throws when the answer is not JSON, so the caller can fall back", async () => {
    const aiInsights = await load("k");
    await expect(aiInsights(data, vi.fn().mockResolvedValue(reply(200, "I cannot help with that")))).rejects.toThrow();
    await expect(aiInsights(data, vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) }))).rejects.toThrow();
  });
});
