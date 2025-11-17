import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type RedirectMiddlewareProps = {
  children: React.ReactNode;
};

/**
 * RedirectMiddleware
 *
 * Placeholder middleware wrapper to keep App.tsx routing imports happy.
 * Right now it:
 *  - Watches location & navigate (so we can add redirect rules later)
 *  - Simply returns children unchanged.
 */
export const RedirectMiddleware: React.FC<RedirectMiddlewareProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Future: add redirect / guard logic here.
    // For now, this is a no-op middleware.
  }, [location, navigate]);

  return <>{children}</>;
};

export default RedirectMiddleware;
