import { Router } from "express";

const router = Router();

// Response body and status are unchanged — the landing page's status indicator
// depends on this exact shape.
router.get("/", (req, res) => {
  res.json({ message: "Welcome to FinEdge API 🚀" });
});

export default router;
