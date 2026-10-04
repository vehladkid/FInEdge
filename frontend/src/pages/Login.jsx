import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { fieldClass, labelClass, primaryButton } from "../components/ui/States";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setBusy(true);
    try {
      await login({ email, password });
      navigate(location.state?.from ?? "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 font-sans text-slate-100">
      <Link to="/" className="mb-8 text-xl font-bold tracking-tight text-white">FinEdge</Link>
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900/60 p-8">
        <h1 className="text-center text-2xl font-bold text-white">Login</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} />
          </div>
          {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
          <button type="submit" disabled={busy} className={`w-full ${primaryButton}`}>{busy ? "Signing in…" : "Login"}</button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-400">
          New to FinEdge? <Link to="/register" className="text-indigo-400 hover:text-white">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
