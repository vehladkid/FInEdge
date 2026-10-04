import * as analytics from "../services/analyticsService.js";
import { getInsights } from "../services/insightService.js";
import { today } from "../utils/clock.js";

export async function dashboard(req, res) {
  res.json({ success: true, data: await analytics.dashboard(req.userId, today()) });
}
export async function analyticsReport(req, res) {
  res.json({ success: true, data: await analytics.analytics(req.userId, today(), req.valid.query.months) });
}
export async function insights(req, res) {
  res.json({ success: true, data: await getInsights(req.userId, today(), req.app.locals.ai) });
}
export { analyticsReport as analytics };
