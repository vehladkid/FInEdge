// ponytail: one runnable check, no test framework. `node src/utils/format.check.js`
// Asserts the refactor preserved the exact strings the screens rendered before.
import assert from "node:assert/strict";
import { formatCurrency } from "./format.js";

// Dashboard summary cards — whole dollars, thousands separator.
assert.equal(formatCurrency(4250), "$4,250");
assert.equal(formatCurrency(3000), "$3,000");
assert.equal(formatCurrency(1180), "$1,180");

// Budget rows — whole dollars, no separator needed.
assert.equal(formatCurrency(340), "$340");
assert.equal(formatCurrency(400), "$400");

// Landing preview — cents.
assert.equal(formatCurrency(4250, 2), "$4,250.00");
assert.equal(formatCurrency(42.1, 2), "$42.10");
assert.equal(formatCurrency(620.0, 2), "$620.00");
assert.equal(formatCurrency(78.5, 2), "$78.50");

console.log("format.check.js: all assertions passed");
