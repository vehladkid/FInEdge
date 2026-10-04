import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as v from "../validators/index.js";
import * as auth from "../controllers/auth.js";
import * as categories from "../controllers/categories.js";
import * as transactions from "../controllers/transactions.js";
import * as budgets from "../controllers/budgets.js";
import * as reports from "../controllers/reports.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).then(() => undefined, next);
const idParam = validate(v.idParamSchema, "params");

const router = Router();

router.post("/auth/register", validate(v.registerSchema), wrap(auth.register));
router.post("/auth/login", validate(v.loginSchema), wrap(auth.login));
router.get("/auth/me", requireAuth, wrap(auth.me));

router.use(requireAuth);

router.get("/categories", wrap(categories.list));
router.post("/categories", validate(v.categorySchema), wrap(categories.create));
router.put("/categories/:id", idParam, validate(v.categoryUpdateSchema), wrap(categories.update));
router.delete("/categories/:id", idParam, wrap(categories.remove));

router.get("/transactions", validate(v.transactionQuerySchema, "query"), wrap(transactions.list));
router.post("/transactions", validate(v.transactionSchema), wrap(transactions.create));
router.get("/transactions/:id", idParam, wrap(transactions.get));
router.put("/transactions/:id", idParam, validate(v.transactionSchema), wrap(transactions.update));
router.delete("/transactions/:id", idParam, wrap(transactions.remove));

router.get("/budgets", wrap(budgets.list));
router.post("/budgets", validate(v.budgetSchema), wrap(budgets.create));
router.get("/budgets/:id", idParam, wrap(budgets.get));
router.put("/budgets/:id", idParam, validate(v.budgetUpdateSchema), wrap(budgets.update));
router.delete("/budgets/:id", idParam, wrap(budgets.remove));

router.get("/dashboard", wrap(reports.dashboard));
router.get("/analytics", validate(v.analyticsQuerySchema, "query"), wrap(reports.analytics));
router.get("/insights", wrap(reports.insights));

export default router;
