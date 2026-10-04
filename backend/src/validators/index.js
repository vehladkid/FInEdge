import { z } from "zod";
import { validationError } from "../errors/index.js";
import { isValidIsoDate } from "../utils/dates.js";
import { passwordProblems } from "../utils/password.js";

// Runs a zod schema and converts failure into the API's validation error.
export function parse(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (result.success) return result.data;
  const details = result.error.issues.map((i) => ({
    field: i.path.join("."),
    message: i.message,
  }));
  throw validationError(details[0].message, details);
}

const isoDate = z.string({ error: "Date is required" }).refine(isValidIsoDate, {
  message: "Date must be a valid YYYY-MM-DD date",
});
const kind = z.enum(["income", "expense"], { error: "Type must be income or expense" });
const positiveAmount = z
  .number({ error: "Amount must be a number" })
  .positive("Amount must be greater than 0")
  .max(9999999999.99, "Amount is too large")
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, {
    message: "Amount can have at most 2 decimal places",
  });
const id = z.coerce.number().int().positive();

export const registerSchema = z.object({
  name: z.string({ error: "Name is required" }).trim().min(1).max(100, "Name is too long"),
  email: z
    .string({ error: "Email is required" })
    .trim()
    .max(254, "Email is too long")
    .email("Email is invalid")
    .transform((e) => e.toLowerCase()),
  password: z.string({ error: "Password is required" }).superRefine((pw, ctx) => {
    for (const message of passwordProblems(pw)) ctx.addIssue({ code: "custom", message });
  }),
});

export const loginSchema = z.object({
  email: z.string({ error: "Email is required" }).trim().min(1).transform((e) => e.toLowerCase()),
  password: z.string({ error: "Password is required" }).min(1),
});

export const categorySchema = z.object({
  name: z.string({ error: "Name is required" }).trim().min(1).max(50, "Name is too long"),
  type: kind,
});
export const categoryUpdateSchema = categorySchema.pick({ name: true });

export const transactionSchema = z.object({
  type: kind,
  amount: positiveAmount,
  categoryId: id,
  description: z.string().trim().max(200, "Description is too long").default(""),
  date: isoDate,
});

export const transactionQuerySchema = z
  .object({
    type: kind.optional(),
    categoryId: id.optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: "'from' must not be after 'to'",
  });

export const budgetSchema = z.object({
  categoryId: id,
  amount: positiveAmount,
  period: z.enum(["weekly", "monthly", "yearly"], { error: "Period must be weekly, monthly or yearly" }),
  startDate: isoDate,
});
export const budgetUpdateSchema = budgetSchema.omit({ categoryId: true });

export const idParamSchema = z.object({ id });

export const analyticsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});
