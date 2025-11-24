import React, { useEffect, useRef, useState } from "react";

export interface TopologyNode {
  id: string;
  name: string;
  status: "healthy" | "elevated" | "critical";
  load: number; // 0-100
  health: number; // 0-100
}

interface FederationTopologyProps {
  nodes: TopologyNode[];
}

export const FederationTopology: React.FC<FederationTopologyProps> = ({ nodes }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const prevStatusesRef = useRef<Map<string, string>>(new Map());

  // Update dimensions on mount and resize
  useEffect(() => {
    if (!svgRef.current) return;

    const updateDimensions = () => {
      const container = svgRef.current?.parentElement;
      if (container) {
        const width = container.clientWidth || 600;
        setDimensions({
          width,
          height: 400, // Fixed height for topology view
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Calculate node positions based on count
  useEffect(() => {
    if (nodes.length === 0) {
      setNodePositions(new Map());
      return;
    }

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.3;

    const positions = new Map<string, { x: number; y: number }>();

    if (nodes.length === 1) {
      // Single node: center it
      positions.set(nodes[0].id, { x: centerX, y: centerY });
    } else {
      // Multiple nodes: radial distribution
      const angleStep = (2 * Math.PI) / nodes.length;
      nodes.forEach((node, index) => {
        const angle = index * angleStep - Math.PI / 2; // Start at top
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        positions.set(node.id, { x, y });
      });
    }

    setNodePositions(positions);
  }, [nodes, dimensions.width, dimensions.height]);

  // Track status changes for pulse animation
  useEffect(() => {
    nodes.forEach((node) => {
      const prevStatus = prevStatusesRef.current.get(node.id);
      if (prevStatus && prevStatus !== node.status) {
        // Status changed - will trigger pulse animation
      }
      prevStatusesRef.current.set(node.id, node.status);
    });
  }, [nodes]);

  // Get node style based on status
  const getNodeStyle = (node: TopologyNode) => {
    const baseSize = 16;
    const size = baseSize + (node.load / 100) * 8; // Size varies with load

    switch (node.status) {
      case "healthy":
        return {
          fill: "rgba(59, 130, 246, 0.3)", // blue-500/30
          stroke: "rgba(59, 130, 246, 0.6)", // blue-500/60
          strokeWidth: 2,
          glow: "rgba(59, 130, 246, 0.4)",
          animation: "breathing 3s ease-in-out infinite",
        };
      case "elevated":
        return {
          fill: "rgba(245, 158, 11, 0.3)", // amber-500/30
          stroke: "rgba(245, 158, 11, 0.6)", // amber-500/60
          strokeWidth: 2,
          glow: "rgba(245, 158, 11, 0.4)",
          animation: "pulse 2s ease-in-out infinite",
        };
      case "critical":
        return {
          fill: "rgba(239, 68, 68, 0.3)", // red-500/30
          stroke: "rgba(239, 68, 68, 0.8)", // red-500/80
          strokeWidth: 4, // Thicker ring
          glow: "rgba(239, 68, 68, 0.6)",
          animation: "pulse 1s ease-in-out infinite",
        };
    }
  };

  // Check if two nodes are both active (for link flashing)
  const isActiveLink = (node1: TopologyNode, node2: TopologyNode) => {
    return (
      (node1.status === "healthy" || node1.status === "elevated") &&
      (node2.status === "healthy" || node2.status === "elevated")
    );
  };

  if (nodes.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-slate-900/60 rounded-lg border border-slate-800">
        <p className="text-slate-500 text-sm">No nodes available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden relative">
      <style>
        {`
          @keyframes breathing {
            0%, 100% {
              opacity: 0.6;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.05);
            }
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }
          @keyframes linkFlash {
            0%, 100% {
              opacity: 0.2;
            }
            50% {
              opacity: 0.6;
            }
          }
          .topology-node {
            transition: all 0.3s ease;
          }
          .topology-link {
            transition: opacity 0.3s ease;
          }
        `}
      </style>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="absolute inset-0"
      >
        {/* Links between active nodes */}
        {nodes.length > 1 &&
          nodes.map((node1, i) =>
            nodes.slice(i + 1).map((node2) => {
              const pos1 = nodePositions.get(node1.id);
              const pos2 = nodePositions.get(node2.id);
              if (!pos1 || !pos2) return null;

              const isActive = isActiveLink(node1, node2);
              return (
                <line
                  key={`${node1.id}-${node2.id}`}
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  className="topology-link"
                  stroke={isActive ? "rgba(168, 85, 247, 0.4)" : "rgba(148, 163, 184, 0.1)"}
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray={isActive ? "5,5" : "0"}
                  style={{
                    animation: isActive ? "linkFlash 2s ease-in-out infinite" : "none",
                  }}
                />
              );
            })
          )}

        {/* Nodes */}
        {nodes.map((node) => {
          const position = nodePositions.get(node.id);
          if (!position) return null;

          const style = getNodeStyle(node);
          const baseSize = 16;
          const size = baseSize + (node.load / 100) * 8;
          const radius = size / 2;

          return (
            <g key={node.id} className="topology-node">
              {/* Glow effect */}
              <circle
                cx={position.x}
                cy={position.y}
                r={radius + 4}
                fill={style.glow}
                opacity={0.3}
                style={{
                  filter: `blur(4px)`,
                  animation: style.animation,
                }}
              />
              {/* Main circle */}
              <circle
                cx={position.x}
                cy={position.y}
                r={radius}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                style={{
                  animation: style.animation,
                }}
              />
              {/* Node label */}
              <text
                x={position.x}
                y={position.y + radius + 16}
                textAnchor="middle"
                className="text-xs fill-slate-300 font-mono"
              >
                {node.name}
              </text>
              {/* Health indicator (small inner dot) */}
              <circle
                cx={position.x}
                cy={position.y}
                r={3}
                fill={
                  node.health > 70
                    ? "rgba(34, 197, 94, 0.8)"
                    : node.health > 40
                    ? "rgba(245, 158, 11, 0.8)"
                    : "rgba(239, 68, 68, 0.8)"
                }
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

