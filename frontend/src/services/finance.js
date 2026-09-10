// The seam between the UI and its data.
//
// These are the exact mock values the page components used to declare inline.
// Nothing has been added or changed — only moved. Pages now depend on a function
// contract instead of literals, so replacing a body with a call to `api.js` later
// requires no change to any page.
//
// ponytail: kept synchronous on purpose. Making these async now would force
// loading and error states into screens that have none, which is a UI change
// rather than an architectural one. Async arrives with the real endpoints.

import { categoryChartLabel, categoryLabel } from "../domain/categories";

/* ---------- Dashboard ---------- */

// Amounts are numbers, not pre-formatted strings; the page formats them.
const DASHBOARD_SUMMARY = [
  { label: "Total Balance", value: 4250 },
  { label: "Income (Month)", value: 3000 },
  { label: "Expenses (Month)", value: 1180 },
];

const DASHBOARD_TREND = [
  { day: "Mon", amount: 120 },
  { day: "Tue", amount: 340 },
  { day: "Wed", amount: 210 },
  { day: "Thu", amount: 480 },
  { day: "Fri", amount: 300 },
  { day: "Sat", amount: 390 },
];

const DASHBOARD_INSIGHTS = [
  "You spent 18% more on dining out this month compared to last month.",
  "Your biggest expense category was Shopping at $410.",
  "You're on track to save $1,820 this month if spending stays steady.",
];

export const getDashboardSummary = () => DASHBOARD_SUMMARY;
export const getDashboardTrend = () => DASHBOARD_TREND;
export const getDashboardInsights = () => DASHBOARD_INSIGHTS;

/* ---------- Analytics ---------- */

// Stored against category ids; the display name comes from the domain module.
const CATEGORY_SPEND = [
  { id: "food", value: 410 },
  { id: "transport", value: 180 },
  { id: "shopping", value: 320 },
  { id: "utilities", value: 150 },
  { id: "other", value: 120 },
];

const ANALYTICS_MONTHLY = [
  { month: "Feb", total: 980 },
  { month: "Mar", total: 1240 },
  { month: "Apr", total: 860 },
  { month: "May", total: 1420 },
  { month: "Jun", total: 1100 },
  { month: "Jul", total: 1180 },
];

export const getAnalyticsCategories = () =>
  CATEGORY_SPEND.map(({ id, value }) => ({ name: categoryChartLabel(id), value }));

export const getAnalyticsMonthlyData = () => ANALYTICS_MONTHLY;

/* ---------- Budgets ---------- */

const BUDGET_ALLOCATIONS = [
  { id: "food", spent: 340, allocated: 400 },
  { id: "transport", spent: 180, allocated: 150 },
  { id: "shopping", spent: 210, allocated: 300 },
  { id: "utilities", spent: 95, allocated: 150 },
];

export const getBudgets = () =>
  BUDGET_ALLOCATIONS.map(({ id, spent, allocated }) => ({
    id,
    category: categoryLabel(id),
    spent,
    allocated,
  }));

/* ---------- Landing preview ---------- */

// Left as literal strings rather than category ids: "Income" is a transaction
// type, not a spending category, so routing it through the category domain
// would misrepresent it.
const RECENT_TRANSACTIONS = [
  { label: "Grocery Store", category: "Food", amount: -42.1 },
  { label: "Freelance Payment", category: "Income", amount: 620.0 },
  { label: "Electric Bill", category: "Utilities", amount: -78.5 },
];

const PREVIEW_BARS = [30, 55, 40, 70, 50, 85, 60];
const PREVIEW_BALANCE = 4250;

export const getRecentTransactions = () => RECENT_TRANSACTIONS;
export const getPreviewBars = () => PREVIEW_BARS;
export const getPreviewBalance = () => PREVIEW_BALANCE;
