import { conflict, notFound, validationError } from "../errors/index.js";
import * as repo from "../repositories/budgets.js";
import * as categories from "../repositories/categories.js";
import { endOfPeriod } from "../utils/dates.js";
import { budgetStatus } from "./budgetCalc.js";

export const withStatus = (b) => ({ ...b, ...budgetStatus(b.amount, b.spent) });

async function assertExpenseCategory(userId, categoryId) {
  const c = await categories.findById(userId, categoryId);
  if (!c) throw validationError("Category does not exist", [{ field: "categoryId", message: "Category does not exist" }]);
  if (c.type !== "expense")
    throw validationError("Budgets can only be set on expense categories", [
      { field: "categoryId", message: "Budgets can only be set on expense categories" },
    ]);
}

const toRow = (d) => ({ ...d, endDate: endOfPeriod(d.period, d.startDate) });
const guard = (err) => {
  if (err.code === "23505") throw conflict("A budget for this category and period already exists");
  throw err;
};

export async function list(userId) {
  return (await repo.list(userId)).map(withStatus);
}

export async function get(userId, id) {
  const b = await repo.findById(userId, id);
  if (!b) throw notFound("Budget not found");
  return withStatus(b);
}

export async function create(userId, data) {
  await assertExpenseCategory(userId, data.categoryId);
  try {
    return withStatus(await repo.create(userId, toRow(data)));
  } catch (err) {
    return guard(err);
  }
}

export async function update(userId, id, data) {
  const existing = await repo.findById(userId, id);
  if (!existing) throw notFound("Budget not found");
  try {
    return withStatus(await repo.update(userId, id, toRow(data)));
  } catch (err) {
    return guard(err);
  }
}

export async function remove(userId, id) {
  if (!(await repo.remove(userId, id))) throw notFound("Budget not found");
}
