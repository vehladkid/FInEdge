import { toIso } from "./dates.js";

// Today's date (UTC) as YYYY-MM-DD. Isolated so services take it as a parameter.
export const today = () => toIso(new Date());
