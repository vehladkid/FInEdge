import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError, conflict, notFound, unauthorized, validationError } from "../../src/errors/index.js";

async function load(nodeEnv) {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);
  // Re-import together so `instanceof AppError` sees the same class as the handler.
  return { ...(await import("../../src/middleware/errorHandler.js")), errors: await import("../../src/errors/index.js") };
}
const fakeRes = () => {
  const res = { status: vi.fn(() => res), json: vi.fn(() => res) };
  return res;
};

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("error factories", () => {
  it("carry status, code and message", () => {
    expect(validationError("bad", [1])).toMatchObject({ status: 400, code: "VALIDATION_ERROR", message: "bad", details: [1] });
    expect(unauthorized()).toMatchObject({ status: 401, code: "UNAUTHORIZED", message: "Authentication required" });
    expect(unauthorized("custom").message).toBe("custom");
    expect(notFound()).toMatchObject({ status: 404, code: "NOT_FOUND", message: "Resource not found" });
    expect(conflict("dup")).toMatchObject({ status: 409, code: "CONFLICT", message: "dup" });
    expect(new AppError(418, "TEAPOT", "t")).toBeInstanceOf(Error);
  });
});

describe("errorHandler", () => {
  it("serialises an AppError with its details", async () => {
    const { errorHandler, errors } = await load("test");
    const res = fakeRes();
    errorHandler(errors.validationError("bad", [{ field: "x", message: "bad" }]), {}, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: "VALIDATION_ERROR", message: "bad", details: [{ field: "x", message: "bad" }] } });
  });

  it("omits details when there are none", async () => {
    const { errorHandler, errors } = await load("test");
    const res = fakeRes();
    errorHandler(errors.notFound("gone"), {}, res);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: "NOT_FOUND", message: "gone" } });
  });

  it("maps malformed JSON to 400 and oversized bodies to 413", async () => {
    const { errorHandler } = await load("test");
    let res = fakeRes();
    errorHandler(Object.assign(new Error("x"), { type: "entity.parse.failed" }), {}, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error).toEqual({ code: "MALFORMED_JSON", message: "Request body is not valid JSON" });
    res = fakeRes();
    errorHandler(Object.assign(new Error("x"), { type: "entity.too.large" }), {}, res);
    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json.mock.calls[0][0].error).toEqual({ code: "PAYLOAD_TOO_LARGE", message: "Request body is too large" });
  });

  it("returns 500 and shows the cause outside production", async () => {
    const { errorHandler } = await load("development");
    const res = fakeRes();
    errorHandler(new Error("db exploded"), {}, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: "INTERNAL_ERROR", message: "db exploded" } });
    expect(console.error).toHaveBeenCalled();
  });

  it("never leaks the cause in production", async () => {
    const { errorHandler } = await load("production");
    const res = fakeRes();
    errorHandler(new Error("password=hunter2 at /srv/app.js"), {}, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toMatch(/hunter2|srv/);
    expect(res.json.mock.calls[0][0].error.message).toBe("Something went wrong");
  });

  it("notFoundHandler forwards a 404 naming the route", async () => {
    const { notFoundHandler } = await load("test");
    const next = vi.fn();
    notFoundHandler({ method: "GET", path: "/api/zzz" }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 404, code: "NOT_FOUND", message: "Route not found: GET /api/zzz" });
  });
});
