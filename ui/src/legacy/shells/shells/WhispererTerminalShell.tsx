import React from "react";

export interface WhispererTerminalProps {
  className?: string;
}

/**
 * WhispererTerminalShell
 *
 * Temporary wrapper so App.tsx can render a Whisperer console placeholder
 * without breaking the build. The real, fully wired terminal UI can be
 * re-integrated later.
 */
const WhispererTerminal: React.FC<WhispererTerminalProps> = ({ className }) => {
  return (
    <div
      className={
        className ??
        "rounded-lg border border-zinc-700 bg-black/60 p-4 text-zinc-200"
      }
    >
      <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">
        Whisperer Terminal (placeholder shell)
      </div>
      <div className="text-sm text-zinc-300">
        Command bridge wiring is live. The full console UI will dock here as
        the GV / Whisperer phases expand.
      </div>
    </div>
  );
};

export default WhispererTerminal;
export { WhispererTerminal };
