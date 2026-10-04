import { notFound, validationError } from "../errors/index.js";
import * as repo from "../repositories/transactions.js";
import * as categories from "../repositories/categories.js";

// The category must belong to the caller and match the transaction's type.
async function assertCategory(userId, data) {
  const category = await categories.findById(userId, data.categoryId);
  if (!category) throw validationError("Category does not exist", [{ field: "categoryId", message: "Category does not exist" }]);
  if (category.type !== data.type)
    throw validationError(`Category "${category.name}" is an ${category.type} category`, [
      { field: "categoryId", message: "Category type does not match transaction type" },
    ]);
}

export async function list(userId, query) {
  const { items, total } = await repo.list(userId, query);
  return {
    items,
    meta: { page: query.page, limit: query.limit, total, pages: Math.max(1, Math.ceil(total / query.limit)) },
  };
}

export async function get(userId, id) {
  const t = await repo.findById(userId, id);
  if (!t) throw notFound("Transaction not found");
  return t;
}

export async function create(userId, data) {
  await assertCategory(userId, data);
  return repo.create(userId, data);
}

export async function update(userId, id, data) {
  await get(userId, id);
  await assertCategory(userId, data);
  return repo.update(userId, id, data);
}

export async function remove(userId, id) {
  if (!(await repo.remove(userId, id))) throw notFound("Transaction not found");
}
