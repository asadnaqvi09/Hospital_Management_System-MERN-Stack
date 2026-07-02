export const ROLES = {
  ADMIN: "admin",
  DOCTOR: "doctor",
  PATIENT: "patient",
  RECEPTIONIST: "receptionist",
  PHARMACIST: "pharmacist",
  LAB_TECHNICIAN: "lab_technician",
  NURSE: "nurse"
}

export const ROLE_VALUES = Object.values(ROLES)

export const TWO_FACTOR_ROLES = [ROLES.ADMIN, ROLES.DOCTOR]
