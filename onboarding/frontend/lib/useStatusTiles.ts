import { useEffect, useState } from "react";

type StatusState = "ok" | "warning" | "error";

interface TileStatus {
  label: string;
  state: StatusState;
}

const TILE_LABELS = [
  "Mesh Link",
  "Rho² Vault",
  "Policy Engine",
  "Signal Horizon",
  "Audit Channel",
  "Bootstrap CA"
];

export function useStatusTiles() {
  const [tiles, setTiles] = useState<TileStatus[]>(
    TILE_LABELS.map((label) => ({ label, state: "ok" }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTiles((prev) =>
        prev.map((t) => {
          const roll = Math.random();
          let next: StatusState = t.state;
          if (roll < 0.02) next = "error";
          else if (roll < 0.1) next = "warning";
          else next = "ok";
          return { ...t, state: next };
        })
      );
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return tiles;
}

