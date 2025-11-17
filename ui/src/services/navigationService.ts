/**
 * navigationService – central navigation wiring
 *
 * This keeps the app wiring stable until the full navigation engine is in place.
 * It supports both:
 *  - simple in-memory path tracking, and
 *  - a globally injected navigate() function (e.g. from React Router).
 */

export interface NavigationContextValue {
  currentPath: string;
  setPath: (path: string) => void;
}

// Simple in-memory state for now
let _currentPath = "/";

// Optional global navigate function injected from App.tsx (React Router, etc.)
let _navigate: ((path: string) => void) | null = null;

/**
 * Called from App.tsx (or router setup) to inject the real navigate handler.
 * Example usage:
 *   const navigate = useNavigate();
 *   setNavigateFunction(navigate);
 */
export const setNavigateFunction = (fn: (path: string) => void) => {
  _navigate = fn;
};

export const navigationService = {
  getCurrentPath: () => _currentPath,
  goTo: (path: string) => {
    _currentPath = path;

    // If a real navigate function has been injected, use it.
    if (_navigate) {
      _navigate(path);
    }
  },
};

// Alias for existing imports that expect a class-like name
export const NavigationService = navigationService;

// Convenience initializer; can be expanded later if needed
export const initNavigation = () => navigationService;

// Simple hook-style helper for components that just need currentPath + setter
export const useNavigation = (): NavigationContextValue => ({
  currentPath: _currentPath,
  setPath: navigationService.goTo,
});

// Default export for `import navigationService from "./services/navigationService"`
export default navigationService;
