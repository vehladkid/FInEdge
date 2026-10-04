// The seam between the UI and its data: every function here is one API call.
import { request } from "./api";

/* ---------- Auth ---------- */
export const registerUser = (body) => request("/api/auth/register", { method: "POST", body, auth: false }).then((r) => r.data);
export const loginUser = (body) => request("/api/auth/login", { method: "POST", body, auth: false }).then((r) => r.data);
export const getCurrentUser = () => request("/api/auth/me").then((r) => r.data.user);

/* ---------- Categories ---------- */
export const getCategories = (type) => request("/api/categories", { params: { type } }).then((r) => r.data);
export const createCategory = (body) => request("/api/categories", { method: "POST", body }).then((r) => r.data);
export const renameCategory = (id, name) => request(`/api/categories/${id}`, { method: "PUT", body: { name } }).then((r) => r.data);
export const deleteCategory = (id) => request(`/api/categories/${id}`, { method: "DELETE" });

/* ---------- Transactions ---------- */
export const getTransactions = (params) => request("/api/transactions", { params });
export const createTransaction = (body) => request("/api/transactions", { method: "POST", body }).then((r) => r.data);
export const updateTransaction = (id, body) => request(`/api/transactions/${id}`, { method: "PUT", body }).then((r) => r.data);
export const deleteTransaction = (id) => request(`/api/transactions/${id}`, { method: "DELETE" });

/* ---------- Budgets ---------- */
export const getBudgets = () => request("/api/budgets").then((r) => r.data);
export const createBudget = (body) => request("/api/budgets", { method: "POST", body }).then((r) => r.data);
export const updateBudget = (id, body) => request(`/api/budgets/${id}`, { method: "PUT", body }).then((r) => r.data);
export const deleteBudget = (id) => request(`/api/budgets/${id}`, { method: "DELETE" });

/* ---------- Reports ---------- */
export const getDashboard = () => request("/api/dashboard").then((r) => r.data);
export const getAnalytics = (months) => request("/api/analytics", { params: { months } }).then((r) => r.data);
export const getInsights = () => request("/api/insights").then((r) => r.data);

/* ---------- Landing preview ---------- */
// The marketing page shows a fixed illustration of the product. It is labelled
// "sample" on screen and is not the user's data.
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
