export enum UserRole {
  USER = 'USER',           // Regular users - can browse, view offers
  BUSINESS = 'BUSINESS',   // Business owners - can manage venues, create offers
  ADMIN = 'ADMIN',         // Platform admins - full access
}

export enum Permission {
  // Venue permissions
  VIEW_VENUES = 'VIEW_VENUES',
  CREATE_VENUE = 'CREATE_VENUE',
  UPDATE_OWN_VENUE = 'UPDATE_OWN_VENUE',
  UPDATE_ANY_VENUE = 'UPDATE_ANY_VENUE',
  DELETE_OWN_VENUE = 'DELETE_OWN_VENUE',
  DELETE_ANY_VENUE = 'DELETE_ANY_VENUE',
  UPDATE_VENUE_LIVE_STATE = 'UPDATE_VENUE_LIVE_STATE',
  
  // Offer permissions
  VIEW_OFFERS = 'VIEW_OFFERS',
  REDEEM_OFFER = 'REDEEM_OFFER',
  CREATE_OFFER = 'CREATE_OFFER',
  UPDATE_OWN_OFFER = 'UPDATE_OWN_OFFER',
  UPDATE_ANY_OFFER = 'UPDATE_ANY_OFFER',
  DELETE_OWN_OFFER = 'DELETE_OWN_OFFER',
  DELETE_ANY_OFFER = 'DELETE_ANY_OFFER',
  
  // Analytics permissions
  VIEW_OWN_ANALYTICS = 'VIEW_OWN_ANALYTICS',
  VIEW_ALL_ANALYTICS = 'VIEW_ALL_ANALYTICS',
  VIEW_PLATFORM_ANALYTICS = 'VIEW_PLATFORM_ANALYTICS',
  
  // User management permissions
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_NOTIFICATIONS = 'MANAGE_NOTIFICATIONS',
}

export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.VIEW_VENUES,
    Permission.VIEW_OFFERS,
    Permission.REDEEM_OFFER,
  ],
  [UserRole.BUSINESS]: [
    // All user permissions
    Permission.VIEW_VENUES,
    Permission.VIEW_OFFERS,
    Permission.REDEEM_OFFER,
    // Business-specific permissions
    Permission.CREATE_VENUE,
    Permission.UPDATE_OWN_VENUE,
    Permission.DELETE_OWN_VENUE,
    Permission.UPDATE_VENUE_LIVE_STATE,
    Permission.CREATE_OFFER,
    Permission.UPDATE_OWN_OFFER,
    Permission.DELETE_OWN_OFFER,
    Permission.VIEW_OWN_ANALYTICS,
  ],
  [UserRole.ADMIN]: [
    // All permissions
    Permission.VIEW_VENUES,
    Permission.VIEW_OFFERS,
    Permission.REDEEM_OFFER,
    Permission.CREATE_VENUE,
    Permission.UPDATE_OWN_VENUE,
    Permission.UPDATE_ANY_VENUE,
    Permission.DELETE_OWN_VENUE,
    Permission.DELETE_ANY_VENUE,
    Permission.UPDATE_VENUE_LIVE_STATE,
    Permission.CREATE_OFFER,
    Permission.UPDATE_OWN_OFFER,
    Permission.UPDATE_ANY_OFFER,
    Permission.DELETE_OWN_OFFER,
    Permission.DELETE_ANY_OFFER,
    Permission.VIEW_OWN_ANALYTICS,
    Permission.VIEW_ALL_ANALYTICS,
    Permission.VIEW_PLATFORM_ANALYTICS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_NOTIFICATIONS,
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return RolePermissions[role]?.includes(permission) || false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  const rolePermissions = RolePermissions[role] || [];
  return permissions.some(permission => rolePermissions.includes(permission));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  const rolePermissions = RolePermissions[role] || [];
  return permissions.every(permission => rolePermissions.includes(permission));
}
