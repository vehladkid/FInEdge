import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import NavBar from "../components/NavBar";

const CATEGORY_DATA = [
  { name: "Food", value: 410 },
  { name: "Transport", value: 180 },
  { name: "Shopping", value: 320 },
  { name: "Utilities", value: 150 },
  { name: "Other", value: 120 },
];

const COLORS = ["#6366f1", "#38bdf8", "#a855f7", "#f472b6", "#64748b"];

const MONTHLY_DATA = [
  { month: "Feb", total: 980 },
  { month: "Mar", total: 1240 },
  { month: "Apr", total: 860 },
  { month: "May", total: 1420 },
  { month: "Jun", total: 1100 },
  { month: "Jul", total: 1180 },
];

const tooltipStyle = {
  backgroundColor: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: "8px",
  color: "#e2e8f0",
};

export default function Analytics() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <NavBar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-base font-semibold text-white">
              Category Breakdown
            </h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORY_DATA}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {CATEGORY_DATA.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-base font-semibold text-white">Monthly Trend</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_DATA}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
