import { ROLES } from "@/constants/roles"

const ROLE_BASE = {
  [ROLES.ADMIN]: "/admin",
  [ROLES.RECEPTIONIST]: "/reception",
  [ROLES.DOCTOR]: "/doctor",
  [ROLES.NURSE]: "/nurse",
  [ROLES.PHARMACIST]: "/pharmacy",
  [ROLES.LAB_TECHNICIAN]: "/lab"
}

export function getRolePatientBase(role) {
  return ROLE_BASE[role] || "/reception"
}

export function getPatientEmrPath(role, patientId) {
  return `${getRolePatientBase(role)}/patients/${patientId}/emr`
}
