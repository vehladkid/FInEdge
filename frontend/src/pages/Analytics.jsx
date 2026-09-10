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
import PageShell from "../layouts/PageShell";
import Card from "../components/ui/Card";
import { axisStyle, chartSeries, palette, tooltipStyle } from "../theme";
import {
  getAnalyticsCategories,
  getAnalyticsMonthlyData,
} from "../services/finance";

export default function Analytics() {
  const categoryData = getAnalyticsCategories();
  const monthlyData = getAnalyticsMonthlyData();

  return (
    <PageShell title="Analytics">
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-white">
            Category Breakdown
          </h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={chartSeries[index % chartSeries.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-white">Monthly Trend</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" {...axisStyle} />
                <YAxis {...axisStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="total"
                  fill={palette.brand}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
