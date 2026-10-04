import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { fieldClass, labelClass, primaryButton } from "../components/ui/States";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 font-sans text-slate-100">
      <Link to="/" className="mb-8 text-xl font-bold tracking-tight text-white">FinEdge</Link>
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900/60 p-8">
        <h1 className="text-center text-2xl font-bold text-white">Create account</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="name" className={labelClass}>Name</label>
            <input id="name" name="name" autoComplete="name" value={form.name} onChange={change} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={change} className={fieldClass} />
            <p className="mt-1 text-xs text-slate-500">At least 8 characters, with a letter and a digit.</p>
          </div>
          {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
          <button type="submit" disabled={busy} className={`w-full ${primaryButton}`}>{busy ? "Creating…" : "Register"}</button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-400">
          Already have an account? <Link to="/login" className="text-indigo-400 hover:text-white">Login</Link>
        </p>
      </div>
    </div>
  );
}
