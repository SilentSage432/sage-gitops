export interface ThoughtPacket {
  id: string;
  from: "operator" | "whisperer" | "kernel" | "system";
  text: string;
  tags?: string[];
  timestamp: number;
}

let chain: ThoughtPacket[] = [];

export function pushThought(packet: ThoughtPacket) {
  chain.push(packet);
  if (chain.length > 200) chain.shift(); // prevent infinite memory usage

  // Broadcast globally
  window.dispatchEvent(
    new CustomEvent("SAGE_THOUGHT", { detail: packet })
  );
}

export function getThoughtChain() {
  return chain;
}

