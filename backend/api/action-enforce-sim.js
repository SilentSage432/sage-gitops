import { simulateEnforcement } from "../federation/enforcement-sim.js";

export function simulateEnforcementHandler(req, res) {
  const { type, role = "sovereign" } = req.body;

  const fakeAction = { type };
  const result = simulateEnforcement(fakeAction, role);

  return res.json({
    ok: true,
    enforcement: result,
    note: "Enforcement simulation only. No execution.",
  });
}

