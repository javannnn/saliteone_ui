export function pickHomeForRoles(roles: string[]): string {
  const map: Array<[string, string]> = [
    ["Finance Admin", "/payments"],
    ["User Management Admin", "/members"],
    ["Media Admin", "/media"],
    ["Volunteer", "/volunteers"],
    ["Admin", "/"],
  ];
  for (const [role, route] of map) if (roles.includes(role)) return route;
  return "/";
}

