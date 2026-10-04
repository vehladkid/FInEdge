// The only module that touches localStorage. Storage can throw (private mode,
// blocked site data); once it has, the token lives in memory for the tab.
const KEY = "finedge.token";
let memoryToken = null;
let storageBroken = false;

export function getToken() {
  if (!storageBroken) {
    try {
      return localStorage.getItem(KEY);
    } catch {
      storageBroken = true;
    }
  }
  return memoryToken;
}

export function setToken(token) {
  memoryToken = token;
  try {
    localStorage.setItem(KEY, token);
  } catch {
    storageBroken = true;
  }
}

export function clearToken() {
  memoryToken = null;
  try {
    localStorage.removeItem(KEY);
    storageBroken = false;
  } catch {
    storageBroken = true;
  }
}
