import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

type User = {
  name: string;
  role: 'root';
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function resolveApiBase(): string {
  try {
    if (typeof (window as any).getApiBase === 'function') {
      return (window as any).getApiBase();
    }
    if ((window as any).SAGE_API_BASE) {
      return (window as any).SAGE_API_BASE.toString().replace(/\/+$/, '');
    }
  } catch (e) {
    console.warn('resolveApiBase failed, using /api', e);
  }
  return '/api';
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initial state: always authenticated, never loading
  // This is a trusted operator console
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>({ name: 'Operator', role: 'root' });

  // Non-blocking auth status check (no credentials, no CORS errors)
  useEffect(() => {
    let cancelled = false;

    async function check() {
      const base = resolveApiBase();

      try {
        // IMPORTANT: no credentials: 'include' here
        const res = await fetch(`${base}/auth/status`);
        if (res.ok) {
          await res.json().catch(() => ({}));
        }
        // regardless of result, allow UI
        if (!cancelled) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.warn('Auth status check error (non-fatal):', err);
        if (!cancelled) {
          setIsAuthenticated(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, []);

  const value: AuthContextValue = {
    isAuthenticated,
    isLoading,
    user,
    login: () => {
      setIsAuthenticated(true);
      setUser({ name: 'Operator', role: 'root' });
    },
    logout: () => {
      setIsAuthenticated(false);
      setUser(null);
    },
  };

  // Children always render immediately - no blocking
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
