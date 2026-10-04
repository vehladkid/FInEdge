import { conflict, notFound } from "../errors/index.js";
import * as repo from "../repositories/categories.js";

export const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", type: "expense" },
  { name: "Transport", type: "expense" },
  { name: "Shopping", type: "expense" },
  { name: "Utilities", type: "expense" },
  { name: "Entertainment", type: "expense" },
  { name: "Other", type: "expense" },
  { name: "Salary", type: "income" },
  { name: "Freelance", type: "income" },
  { name: "Other Income", type: "income" },
];

const isDuplicate = (err) => err.code === "23505";
const DUP = "A category with this name already exists";

export const list = (userId, type) => repo.list(userId, type);

export async function create(userId, data) {
  try {
    return await repo.create(userId, data);
  } catch (err) {
    if (isDuplicate(err)) throw conflict(DUP);
    throw err;
  }
}

export async function rename(userId, id, name) {
  try {
    const category = await repo.rename(userId, id, name);
    if (!category) throw notFound("Category not found");
    return category;
  } catch (err) {
    if (isDuplicate(err)) throw conflict(DUP);
    throw err;
  }
}

// A category in use cannot be deleted: its transactions would lose their label.
export async function remove(userId, id) {
  if (!(await repo.findById(userId, id))) throw notFound("Category not found");
  const used = await repo.countTransactions(userId, id);
  if (used > 0)
    throw conflict(`Category is used by ${used} transaction${used === 1 ? "" : "s"} and cannot be deleted`);
  await repo.remove(userId, id);
}
