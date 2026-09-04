export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  RELIEF_MANAGER: 'RELIEF_MANAGER',
  SHELTER_MANAGER: 'SHELTER_MANAGER',
  VOLUNTEER: 'VOLUNTEER',
  PUBLIC: 'PUBLIC',
});

export const ROLE_LIST = Object.values(ROLES);

/** Roles a new account is allowed to self-select at registration. */
export const SELF_ASSIGNABLE_ROLES = [ROLES.PUBLIC, ROLES.VOLUNTEER];
