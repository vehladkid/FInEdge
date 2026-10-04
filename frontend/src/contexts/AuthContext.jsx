import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { UNAUTHORIZED_EVENT } from "../services/api";
import { getCurrentUser, loginUser, registerUser } from "../services/finance";
import { clearToken, getToken, setToken } from "../services/session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" only while a stored token is being checked against /auth/me.
  const [status, setStatus] = useState(getToken() ? "loading" : "anonymous");

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    getCurrentUser()
      .then((u) => {
        if (!cancelled) {
          setUser(u);
          setStatus("authenticated");
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearToken();
          setStatus("anonymous");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setStatus("anonymous");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const establish = useCallback(({ user: u, token }) => {
    setToken(token);
    setUser(u);
    setStatus("authenticated");
  }, []);

  const login = useCallback(async (credentials) => establish(await loginUser(credentials)), [establish]);
  const register = useCallback(async (details) => establish(await registerUser(details)), [establish]);
  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(() => ({ user, status, login, register, logout }), [user, status, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
