import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FEATURES = [
  {
    icon: "📊",
    title: "Smart Dashboard",
    description: "See your balance and monthly activity at a glance.",
  },
  {
    icon: "🤖",
    title: "AI Spending Insights",
    description: "Plain-language summaries of where your money goes.",
  },
  {
    icon: "🎯",
    title: "Budget Tracking",
    description: "Set category budgets and track spend against them.",
  },
];

export default function App() {
  const [status, setStatus] = useState("loading");
  const [apiMessage, setApiMessage] = useState("Connecting to backend...");

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then((res) => res.json())
      .then((data) => {
        setApiMessage(data.message);
        setStatus("online");
      })
      .catch(() => {
        setApiMessage("Could not reach FinEdge API");
        setStatus("offline");
      });
  }, []);

  const statusStyles = {
    loading: "bg-slate-800 text-slate-300 border-slate-700",
    online: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    offline: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  };

  const dotStyles = {
    loading: "bg-slate-400 animate-pulse",
    online: "bg-emerald-400",
    offline: "bg-rose-400",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top nav */}
      <header className="border-b border-slate-800/80">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-xl font-bold tracking-tight text-white">
            FinEdge
          </span>
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Login
            </a>
            <a
              href="#"
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-500/30 transition hover:bg-indigo-400"
            >
              Sign Up
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main>
        <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Make Your Money{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
              Make Sense
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-400">
            AI-powered expense tracking that turns your transactions into
            clear, actionable insights.
          </p>

          <a
            href="#"
            className="mt-8 rounded-lg bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400"
          >
            Get Started
          </a>

          <div
            className={`mt-10 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium ${statusStyles[status]}`}
          >
            <span className={`h-2 w-2 rounded-full ${dotStyles[status]}`} />
            Backend: <span className="font-mono">{apiMessage}</span>
          </div>
        </section>

        {/* Feature cards */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-slate-700"
              >
                <div className="text-2xl">{feature.icon}</div>
                <h3 className="mt-4 text-base font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8">
        <p className="text-center text-sm text-slate-500">
          © {new Date().getFullYear()} FinEdge
        </p>
      </footer>
    </div>
  );
}
