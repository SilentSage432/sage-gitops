import { useEffect, useState } from 'react';

function getApiBase(): string {
  try {
    if (typeof (window as any).getApiBase === 'function') {
      return (window as any).getApiBase();
    }
    if ((window as any).SAGE_API_BASE) {
      return (window as any).SAGE_API_BASE.toString().replace(/\/+$/, '');
    }
  } catch {
    /* ignore */
  }
  return '/api';
}

type MetaVersion = {
  meshId?: string;
  apiBuild?: string;
  now?: string;
};

export function useMetaVersion() {
  const [meta, setMeta] = useState<MetaVersion | null>(null);

  useEffect(() => {
    let cancelled = false;
    const apiBase = getApiBase();

    async function load() {
      try {
        const res = await fetch(`${apiBase}/meta/version`);
        if (!res.ok) return;
        const json = (await res.json()) as MetaVersion;
        if (!cancelled) setMeta(json);
      } catch {
        // silent: footer is best-effort
      }
    }

    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const uiBuild =
    (import.meta as any).env?.VITE_BUILD_ID || 'dev';

  return { uiBuild, meta };
}
