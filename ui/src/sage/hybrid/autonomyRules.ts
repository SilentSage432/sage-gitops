export const AutonomyRules = {
  whitelist: [
    "ui.focus.arc",
    "ui.focus.rho2",
    "ui.open.operator-terminal",
    "ui.scroll.top",
    "ui.scroll.bottom",
    "ui.highlight.panel",
  ],

  validate(action: string) {
    return this.whitelist.includes(action);
  },
};

