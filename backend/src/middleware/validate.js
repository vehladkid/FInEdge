import { parse } from "../validators/index.js";

// validate(schema, "body" | "query" | "params") -> stores the parsed value on req.valid[source].
export const validate = (schema, source = "body") => (req, _res, next) => {
  try {
    req.valid = { ...req.valid, [source]: parse(schema, req[source]) };
    next();
  } catch (err) {
    next(err);
  }
};
