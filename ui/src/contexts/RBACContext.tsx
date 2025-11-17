import { createContext, useContext, useMemo, ReactNode } from "react";

export type Role = string;
export type Permission = string;

export interface RBACContextValue {
  roles: Role[];
  permissions: Permission[];
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  hasPermission: (perm: Permission) => boolean;
  hasAnyPermission: (perms: Permission[]) => boolean;
}

const defaultValue: RBACContextValue = {
  roles: [],
  permissions: [],
  hasRole: () => false,
  hasAnyRole: () => false,
  hasPermission: () => false,
  hasAnyPermission: () => false,
};

const RBACContext = createContext<RBACContextValue>(defaultValue);

export interface RBACProviderProps {
  roles?: Role[];
  permissions?: Permission[];
  children: ReactNode;
}

export const RBACProvider = ({
  roles = [],
  permissions = [],
  children,
}: RBACProviderProps) => {
  const value = useMemo(
    () => ({
      roles,
      permissions,
      hasRole: (r: Role) => roles.includes(r),
      hasAnyRole: (rs: Role[]) => rs.some((r) => roles.includes(r)),
      hasPermission: (p: Permission) => permissions.includes(p),
      hasAnyPermission: (ps: Permission[]) => ps.some((p) => permissions.includes(p)),
    }),
    [roles, permissions]
  );

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
};

export const useRBAC = () => useContext(RBACContext);

export default RBACContext;
