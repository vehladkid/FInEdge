import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiError, request, UNAUTHORIZED_EVENT } from "../../src/services/api.js";
import { clearToken, getToken, setToken } from "../../src/services/session.js";

const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
afterEach(() => {
  vi.unstubAllGlobals();
  clearToken();
});

describe("session", () => {
  it("stores, reads and clears the token", () => {
    expect(getToken()).toBeNull();
    setToken("abc");
    expect(getToken()).toBe("abc");
    clearToken();
    expect(getToken()).toBeNull();
  });
  it("falls back to memory when storage throws", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    setToken("mem");
    expect(getToken()).toBe("mem");
    vi.restoreAllMocks();
    clearToken();
    expect(getToken()).toBeNull();
    spy.mockRestore();
  });
});

describe("request", () => {
  it("sends JSON, the bearer token and query params, skipping empty ones", async () => {
    setToken("tok");
    fetch.mockResolvedValue(reply(200, { data: 1 }));
    const out = await request("/api/x", { method: "POST", body: { a: 1 }, params: { page: 2, type: "", q: undefined } });
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/x\?page=2$/);
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ "Content-Type": "application/json", Authorization: "Bearer tok" });
    expect(init.body).toBe('{"a":1}');
    expect(out).toEqual({ data: 1 });
  });
  it("omits the auth header when auth is false", async () => {
    setToken("tok");
    fetch.mockResolvedValue(reply(200, {}));
    await request("/api/auth/login", { auth: false });
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });
  it("returns null data for 204", async () => {
    fetch.mockResolvedValue(reply(204));
    expect(await request("/x", { method: "DELETE" })).toEqual({ data: null });
  });
  it("throws ApiError with the server's code and message", async () => {
    fetch.mockResolvedValue(reply(409, { error: { code: "CONFLICT", message: "exists", details: [1] } }));
    await expect(request("/x")).rejects.toMatchObject({ name: "ApiError", status: 409, code: "CONFLICT", message: "exists", details: [1] });
  });
  it("describes a network failure", async () => {
    fetch.mockRejectedValue(new TypeError("failed"));
    const err = await request("/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });
  it("survives a non-JSON error body", async () => {
    fetch.mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error("html"); } });
    await expect(request("/x")).rejects.toMatchObject({ status: 502, message: "Request failed (502)" });
  });
  it("clears the token and signals on 401 for an authenticated call", async () => {
    setToken("stale");
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    fetch.mockResolvedValue(reply(401, { error: { code: "UNAUTHORIZED", message: "no" } }));
    await expect(request("/x")).rejects.toMatchObject({ status: 401 });
    expect(getToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });
  it("does not sign out when a login attempt is rejected", async () => {
    setToken("keep");
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    fetch.mockResolvedValue(reply(401, { error: { code: "INVALID_CREDENTIALS", message: "bad" } }));
    await expect(request("/api/auth/login", { auth: false })).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    expect(getToken()).toBe("keep");
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });
});
