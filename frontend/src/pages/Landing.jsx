import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiHealth } from "../services/api";
import {
  getPreviewBalance,
  getPreviewBars,
  getRecentTransactions,
} from "../services/finance";
import { formatCurrency } from "../utils/format";

export default function Landing() {
  const [status, setStatus] = useState("loading");
  const [apiMessage, setApiMessage] = useState("connecting");

  const transactions = getRecentTransactions();
  const bars = getPreviewBars();

  useEffect(() => {
    getApiHealth()
      .then(() => {
        setApiMessage("connected");
        setStatus("online");
      })
      .catch(() => {
        setApiMessage("unreachable");
        setStatus("offline");
      });
  }, []);

  const dotStyles = {
    loading: "bg-slate-500 animate-pulse",
    online: "bg-emerald-400",
    offline: "bg-rose-400",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top nav */}
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-lg font-semibold text-white">FinEdge</span>

          <div className="flex items-center gap-5">
            <div
              className="flex items-center gap-1.5 text-xs text-slate-500"
              title={`Backend ${apiMessage}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status]}`} />
              {apiMessage}
            </div>
            <Link
              to="/login"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Login
            </Link>
            <Link
              to="/login"
              className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-white transition hover:border-slate-500"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[55%_1fr] lg:items-center">
          {/* Left: copy */}
          <div>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Track every dollar without opening a spreadsheet.
            </h1>
            <p className="mt-4 max-w-md text-base text-slate-400">
              FinEdge logs your income and expenses, sorts them into
              categories, and tells you in plain language where your
              money actually went each month.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <Link
                to="/login"
                className="rounded-md bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="rounded-md border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Log in
              </Link>
            </div>

            <div className="mt-10 h-px w-16 bg-indigo-500" />
          </div>

          {/* Right: mock UI panel */}
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs text-slate-500">Total Balance</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {formatCurrency(getPreviewBalance(), 2)}
            </p>

            <div className="mt-5 flex h-16 items-end gap-1.5">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-indigo-500/40"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            <div className="mt-5 space-y-2.5 border-t border-slate-800 pt-4">
              {transactions.map((t) => (
                <div key={t.label} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-slate-200">{t.label}</p>
                    <p className="text-xs text-slate-500">{t.category}</p>
                  </div>
                  <span
                    className={t.amount < 0 ? "text-slate-400" : "text-emerald-400"}
                  >
                    {t.amount < 0 ? "-" : "+"}
                    {formatCurrency(Math.abs(t.amount), 2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature section — asymmetric */}
        <div className="mt-24 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-lg border border-slate-800 p-6">
            <h3 className="text-base font-semibold text-white">
              Spending insight, in plain English
            </h3>
            <p className="mt-2 max-w-sm text-sm text-slate-400">
              Instead of digging through rows of transactions, get a short
              written summary of what changed this month and why your
              balance moved the way it did.
            </p>
          </div>

          <div className="space-y-6">
            <div className="border-l-2 border-indigo-500 pl-4">
              <h3 className="text-sm font-semibold text-white">Budget tracking</h3>
              <p className="mt-1 text-sm text-slate-400">
                Set a monthly cap per category and see what's left.
              </p>
            </div>
            <div className="border-l-2 border-slate-700 pl-4">
              <h3 className="text-sm font-semibold text-white">
                One place for transactions
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Log income and expenses as they happen, sorted by category.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <p className="text-center text-sm text-slate-500">FinEdge</p>
      </footer>
    </div>
  );
}
