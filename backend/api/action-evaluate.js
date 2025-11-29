import { evaluateAction } from "../federation/rule-engine.js";

export function evaluateHandler(req, res) {
  const { type, role = "sovereign" } = req.body;

  const fakeAction = { type };
  const result = evaluateAction(fakeAction, role);

  return res.json({
    ok: true,
    analysis: result,
    note: "Read-only evaluation. No enforcement.",
  });
}

