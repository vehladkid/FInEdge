import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const DEMO_EMAIL = "student@vit.edu";
const DEMO_PASSWORD = "demo1234";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setError("");
      navigate("/dashboard");
    } else {
      setError("Invalid credentials — use the demo login shown above.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 font-sans text-slate-100">
      <Link to="/" className="mb-8 text-xl font-bold tracking-tight text-white">
        FinEdge
      </Link>

      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900/60 p-8">
        <h1 className="text-center text-2xl font-bold text-white">Login</h1>
        <p className="mt-2 text-center text-xs text-slate-500">
          Demo login: {DEMO_EMAIL} / {DEMO_PASSWORD}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={DEMO_EMAIL}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={DEMO_PASSWORD}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            Login
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
          <a href="#" className="hover:text-white">
            Forgot password?
          </a>
          <a href="#" className="hover:text-white">
            Register here
          </a>
        </div>
      </div>
    </div>
  );
}
