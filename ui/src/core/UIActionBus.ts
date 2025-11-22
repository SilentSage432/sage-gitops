/**
 * UIActionBus – Central dispatcher for UI actions
 * Dispatches SAGE_UI_ACTION events that components can listen to
 */

export function dispatchUIAction(action: string, payload?: any) {
  const event = new CustomEvent("SAGE_UI_ACTION", {
    detail: { action, payload },
  });
  window.dispatchEvent(event);
}

