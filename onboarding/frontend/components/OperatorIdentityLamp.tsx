"use client";

// Operator Identity Lamp - displays operator status from /api/auth/status
// Shows: not registered -> registered -> authenticated
import { useEffect, useState } from "react";

interface AuthStatus {
  registered: boolean;
  authenticated: boolean;
  operator: string;
}

export default function OperatorIdentityLamp() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Fetch status from /api/auth/status (not federation state)
    const refresh = async () => {
      if (!isMounted) return;
      
      try {
        const res = await fetch('/api/auth/status');
        if (!isMounted) return;
        
        if (res.ok) {
          const data = await res.json();
          if (!isMounted) return;
          
          setStatus({
            registered: data.registered === true,
            authenticated: data.authenticated === true,
            operator: data.operator || 'prime',
          });
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to fetch operator status:", err);
        setStatus(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    refresh();
    // Refresh every 10 seconds to update badge (less frequent to reduce load)
    const interval = setInterval(() => {
      if (isMounted) {
        refresh();
      }
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="text-xs text-slate-500">
        Operator: <span className="text-slate-400">checking...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="text-xs">
        <span className="text-slate-400">Operator:</span>{" "}
        <span className="text-orange-500">not registered</span>
      </div>
    );
  }

  // State machine: not registered -> registered -> authenticated
  if (!status.registered) {
    return (
      <div className="text-xs">
        <span className="text-slate-400">Operator:</span>{" "}
        <span className="text-orange-500">not registered</span>
      </div>
    );
  }

  if (!status.authenticated) {
    return (
      <div className="text-xs">
        <span className="text-slate-400">Operator:</span>{" "}
        <span className="text-yellow-500">registered</span>
      </div>
    );
  }

  return (
    <div className="text-xs">
      <span className="text-slate-400">Operator:</span>{" "}
      <span className="text-green-500">authenticated</span>
    </div>
  );
}
