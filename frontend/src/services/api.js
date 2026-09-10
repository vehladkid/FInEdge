// Owns the backend base URL and every outbound HTTP call.
//
// Pages import from here instead of calling fetch and assembling URLs themselves,
// so changing the transport (base URL, headers, auth, error handling) is a change
// to this file alone.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Resolves when the API answers with JSON, rejects when it is unreachable.
// Deliberately does not inspect res.ok — the landing page's status indicator
// behaved this way before the extraction and still does.
export async function getApiHealth() {
  const res = await fetch(`${API_URL}/`);
  return res.json();
}
