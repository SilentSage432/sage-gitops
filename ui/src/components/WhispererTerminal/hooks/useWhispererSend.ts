import { arcBridge } from "@/lib/arcBridge";

export function sendWhispererCommand(text: string) {
  arcBridge.send({
    kind: "operator_command",
    content: text,
    ts: Date.now(),
  });
}

