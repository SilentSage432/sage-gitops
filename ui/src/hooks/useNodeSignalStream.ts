import { useEffect, useState } from "react";



interface NodeSignal {

  cpu: string;

  memory: string;

  heartbeat: string;

  status: string;

}



export function useNodeSignalStream(nodeId: string) {

  const [data, setData] = useState<NodeSignal | null>(null);



  useEffect(() => {

    let ws: WebSocket | null = null;

    let mockInterval: number | null = null;



    try {

      // ✅ real backend when Pi cluster is online

      if (import.meta.env.VITE_SAGE_WS_URL) {

        ws = new WebSocket(

          `${import.meta.env.VITE_SAGE_WS_URL}/nodes/${nodeId}/stream`

        );

      }

    } catch {

      ws = null;

    }



    // ✅ fallback mock stream (works right now)

    if (!ws || !import.meta.env.VITE_SAGE_WS_URL) {

      mockInterval = window.setInterval(() => {

        setData({

          cpu: (Math.random() * 15).toFixed(1) + "%",

          memory: `${Math.floor(Math.random() * 350)} MB`,

          heartbeat: new Date().toLocaleTimeString(),

          status: "ONLINE",

        });

      }, 2000);

    } else {

      ws.onmessage = (event) => {

        try {

          const incoming = JSON.parse(event.data);

          setData(incoming);

        } catch (err) {

          console.error("Invalid WS payload:", err);

        }

      };



      ws.onerror = () => {

        console.warn("WS stream failed — switching to mock");

        ws?.close();

        ws = null;

        mockInterval = window.setInterval(() => {

          setData({

            cpu: (Math.random() * 15).toFixed(1) + "%",

            memory: `${Math.floor(Math.random() * 350)} MB`,

            heartbeat: new Date().toLocaleTimeString(),

            status: "DEGRADED",

          });

        }, 2000);

      };

    }



    return () => {

      if (mockInterval) clearInterval(mockInterval);

      ws?.close();

    };

  }, [nodeId]);



  return data;

}

