import * as service from "../services/categoryService.js";

export async function list(req, res) {
  const type = ["income", "expense"].includes(req.query.type) ? req.query.type : undefined;
  res.json({ success: true, data: await service.list(req.userId, type) });
}
export async function create(req, res) {
  res.status(201).json({ success: true, data: await service.create(req.userId, req.valid.body) });
}
export async function update(req, res) {
  res.json({ success: true, data: await service.rename(req.userId, req.valid.params.id, req.valid.body.name) });
}
export async function remove(req, res) {
  await service.remove(req.userId, req.valid.params.id);
  res.status(204).end();
}
