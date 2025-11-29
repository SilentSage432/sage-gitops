// Passive operator approval and rejection of actions.
// STILL DOES NOT EXECUTE ANYTHING.

import { listActions } from "../federation/action-log.js";

export function approveActionHandler(req, res) {
  const { id } = req.body;
  const action = listActions().find(a => a.id === id);
  if (!action) {
    return res.status(404).json({ ok: false, error: "action not found" });
  }

  action.state = "approved";
  return res.json({ ok: true, action });
}

export function rejectActionHandler(req, res) {
  const { id } = req.body;
  const action = listActions().find(a => a.id === id);
  if (!action) {
    return res.status(404).json({ ok: false, error: "action not found" });
  }

  action.state = "rejected";
  return res.json({ ok: true, action });
}

