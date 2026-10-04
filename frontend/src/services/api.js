// Owns the backend base URL and every outbound HTTP call.
//
// Pages import from here (via services/finance.js) instead of calling fetch
// themselves, so transport concerns — base URL, auth header, error shape — live here.
import { clearToken, getToken } from "./session";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Fired when the server rejects the stored token, so the auth context can sign out.
export const UNAUTHORIZED_EVENT = "finedge:unauthorized";

export async function request(path, { method = "GET", body, auth = true, params } = {}) {
  const url = new URL(`${API_URL}${path}`);
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Cannot reach the server. Check your connection and try again.");
  }

  if (res.status === 204) return { data: null };
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const err = payload?.error ?? {};
    if (res.status === 401 && auth && token) {
      clearToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(res.status, err.code ?? "ERROR", err.message ?? `Request failed (${res.status})`, err.details);
  }
  return payload;
}

// Resolves when the API answers with JSON, rejects when it is unreachable.
export async function getApiHealth() {
  const res = await fetch(`${API_URL}/`);
  return res.json();
}
