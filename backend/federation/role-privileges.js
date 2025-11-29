// Which roles can perform which privilege levels (read-only)

export const rolePrivileges = {
  sovereign: ["user", "operator", "sovereign"],
  operator: ["user", "operator"],
  viewer: ["user"],
};

export function getRolePrivileges(role) {
  return rolePrivileges[role] || [];
}

