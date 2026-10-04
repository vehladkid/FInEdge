import * as service from "../services/authService.js";

export async function register(req, res) {
  const result = await service.register(req.valid.body);
  res.status(201).json({ success: true, data: result });
}

export async function login(req, res) {
  res.json({ success: true, data: await service.login(req.valid.body) });
}

export async function me(req, res) {
  res.json({ success: true, data: { user: await service.currentUser(req.userId) } });
}
