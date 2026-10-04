import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, LineChart, Line } from "recharts";
import PageShell from "../layouts/PageShell";
import Card from "../components/ui/Card";
import { Empty, ErrorMessage, fieldClass, Loading } from "../components/ui/States";
import { useAsync } from "../hooks/useAsync";
import { axisStyle, barCursor, chartSeries, palette, tooltipStyle } from "../theme";
import { getAnalytics } from "../services/finance";
import { formatCurrency } from "../utils/format";
import { monthLabel } from "../utils/dates";

export default function Analytics() {
  const [months, setMonths] = useState(6);
  const { data, error, loading, reload } = useAsync(() => getAnalytics(months), [months]);

  const monthly = data?.monthly.map((m) => ({ ...m, label: monthLabel(m.month) }));
  const hasData = data && (data.summary.income > 0 || data.summary.expenses > 0);

  const range = (
    <select aria-label="Date range" value={months} onChange={(e) => setMonths(Number(e.target.value))} className={`${fieldClass} w-auto`}>
      <option value={3}>Last 3 months</option>
      <option value={6}>Last 6 months</option>
      <option value={12}>Last 12 months</option>
    </select>
  );

  return (
    <PageShell title="Analytics" action={range}>
      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}

      {data && !hasData && <Card className="mt-6"><Empty>No transactions in this period yet. Add some to see your analytics.</Empty></Card>}

      {hasData && (
        <>
          <div className="mt-6 grid gap-6 sm:grid-cols-4">
            {[
              ["Income", formatCurrency(data.summary.income, 2)],
              ["Expenses", formatCurrency(data.summary.expenses, 2)],
              ["Net", formatCurrency(data.summary.balance, 2)],
              ["Savings rate", data.summary.savingsRate === null ? "—" : `${data.summary.savingsRate}%`],
            ].map(([label, value]) => (
              <Card key={label}>
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-2 text-xl font-bold text-white" data-testid={`summary-${label}`}>{value}</p>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="text-base font-semibold text-white">Category Breakdown</h2>
              {data.spendingByCategory.length === 0 ? (
                <Empty>No expenses in this period.</Empty>
              ) : (
                <div className="mt-4 h-72" data-testid="category-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.spendingByCategory} dataKey="total" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2} isAnimationActive={false}>
                        {data.spendingByCategory.map((entry, index) => (
                          <Cell key={entry.categoryId} fill={chartSeries[index % chartSeries.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-base font-semibold text-white">Income vs Expenses</h2>
              <div className="mt-4 h-72" data-testid="monthly-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly}>
                    <XAxis dataKey="label" {...axisStyle} />
                    <YAxis {...axisStyle} />
                    <Tooltip contentStyle={tooltipStyle} cursor={barCursor} />
                    <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                    <Bar dataKey="income" name="Income" fill="#34d399" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="expenses" name="Expenses" fill={palette.brand} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <h2 className="text-base font-semibold text-white">Daily spending (last 30 days)</h2>
              {data.dailySpending.length === 0 ? (
                <Empty>No expenses in the last 30 days.</Empty>
              ) : (
                <div className="mt-4 h-64" data-testid="daily-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.dailySpending}>
                      <XAxis dataKey="date" {...axisStyle} />
                      <YAxis {...axisStyle} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="total" name="Spent" stroke={palette.brand} strokeWidth={2} dot={{ fill: palette.brandLight, r: 4 }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </PageShell>
  );
}
