import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import NavBar from "../components/NavBar";

const SUMMARY = [
  { label: "Total Balance", value: "$4,250" },
  { label: "Income (Month)", value: "$3,000" },
  { label: "Expenses (Month)", value: "$1,180" },
];

const TREND_DATA = [
  { day: "Mon", amount: 120 },
  { day: "Tue", amount: 340 },
  { day: "Wed", amount: 210 },
  { day: "Thu", amount: 480 },
  { day: "Fri", amount: 300 },
  { day: "Sat", amount: 390 },
];

const INSIGHT_LINES = [
  "You spent 18% more on dining out this month compared to last month.",
  "Your biggest expense category was Shopping at $410.",
  "You're on track to save $1,820 this month if spending stays steady.",
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <NavBar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {SUMMARY.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 lg:col-span-2">
            <h2 className="text-base font-semibold text-white">Spending Trend</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND_DATA}>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: "#818cf8", r: 4 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-base font-semibold text-white">
              AI Spending Insight
            </h2>
            <p className="mt-1 text-xs text-slate-500">Sample insight (static)</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {INSIGHT_LINES.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-indigo-400">•</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
