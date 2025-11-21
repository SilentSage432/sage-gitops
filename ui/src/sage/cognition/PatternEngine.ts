import { ThoughtPacket, getThoughtChain } from "./ThoughtChain";

type Pattern = {
  id: string;
  name: string;
  match: (chain: ThoughtPacket[]) => boolean;
  onMatch: () => void;
};

// --------------------------------------------------------
// Pattern Registry
// --------------------------------------------------------
const patterns: Pattern[] = [];

// Register a new pattern
export function registerPattern(name: string, match: Pattern["match"], onMatch: Pattern["onMatch"]) {
  patterns.push({
    id: crypto.randomUUID(),
    name,
    match,
    onMatch,
  });
}

// Evaluate all patterns every time a new thought arrives
export function evaluatePatterns() {
  const chain = getThoughtChain();
  for (const p of patterns) {
    if (p.match(chain)) {
      p.onMatch();
    }
  }
}

// Attach listener to new thoughts
window.addEventListener("SAGE_THOUGHT", () => {
  evaluatePatterns();
});

