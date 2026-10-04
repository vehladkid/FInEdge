import * as service from "../services/budgetService.js";

export async function list(req, res) {
  res.json({ success: true, data: await service.list(req.userId) });
}
export async function get(req, res) {
  res.json({ success: true, data: await service.get(req.userId, req.valid.params.id) });
}
export async function create(req, res) {
  res.status(201).json({ success: true, data: await service.create(req.userId, req.valid.body) });
}
export async function update(req, res) {
  res.json({ success: true, data: await service.update(req.userId, req.valid.params.id, req.valid.body) });
}
export async function remove(req, res) {
  await service.remove(req.userId, req.valid.params.id);
  res.status(204).end();
}
