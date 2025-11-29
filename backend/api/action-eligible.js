import { getEligibleAgents } from "../federation/capability-matcher.js";

export function eligibleAgentsHandler(req, res) {
  const { type } = req.body;
  const result = getEligibleAgents(type);
  return res.json({
    ok: true,
    eligible: result,
    note: "Read-only capability matching.",
  });
}

