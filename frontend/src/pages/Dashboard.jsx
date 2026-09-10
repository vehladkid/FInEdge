import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import PageShell from "../layouts/PageShell";
import Card from "../components/ui/Card";
import { axisStyle, palette, tooltipStyle } from "../theme";
import { formatCurrency } from "../utils/format";
import {
  getDashboardInsights,
  getDashboardSummary,
  getDashboardTrend,
} from "../services/finance";

export default function Dashboard() {
  const summary = getDashboardSummary();
  const trend = getDashboardTrend();
  const insights = getDashboardInsights();

  return (
    <PageShell title="Dashboard">
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {summary.map((item) => (
          <Card key={item.label}>
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {formatCurrency(item.value)}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold text-white">Spending Trend</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <XAxis dataKey="day" {...axisStyle} />
                <YAxis {...axisStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={palette.brand}
                  strokeWidth={2}
                  dot={{ fill: palette.brandLight, r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-white">
            AI Spending Insight
          </h2>
          <p className="mt-1 text-xs text-slate-500">Sample insight (static)</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {insights.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-indigo-400">•</span>
                {line}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </PageShell>
  );
}
