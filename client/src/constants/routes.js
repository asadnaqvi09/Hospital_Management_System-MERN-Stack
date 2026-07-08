import { ROLES } from "./roles"
export const ROUTES = {
  LOGIN: "/login",
  TWO_FACTOR: "/two-factor",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  PROFILE: "/profile",
  SECURITY: "/security",
  SESSIONS: "/sessions",
  NOTIFICATIONS: "/notifications",
  UNAUTHORIZED: "/unauthorized",
  NOT_FOUND: "*"
}
export const ROLE_DEFAULT_ROUTES = {
  [ROLES.ADMIN]: "/admin",
  [ROLES.RECEPTIONIST]: "/reception",
  [ROLES.DOCTOR]: "/doctor",
  [ROLES.NURSE]: "/nurse",
  [ROLES.PHARMACIST]: "/pharmacy",
  [ROLES.LAB_TECHNICIAN]: "/lab",
  [ROLES.PATIENT]: "/patient"
}
export const ADMIN_ROUTES = {
  DASHBOARD: "/admin",
  USERS: "/admin/users",
  USER_CREATE: "/admin/users/new",
  USER_DETAIL: "/admin/users/:id",
  DOCTORS: "/admin/doctors",
  DOCTOR_CREATE: "/admin/doctors/new",
  DOCTOR_DETAIL: "/admin/doctors/:id",
  DOCTOR_SCHEDULE: "/admin/doctors/:id/schedule",
  LAB_TESTS: "/admin/catalog/lab-tests",
  MEDICINES: "/admin/catalog/medicines",
  IPD_ROOMS: "/admin/ipd/rooms",
  REPORTS: "/admin/reports",
  AUDIT: "/admin/audit"
}
export const RECEPTIONIST_ROUTES = {
  DASHBOARD: "/reception",
  PATIENTS: "/reception/patients",
  APPOINTMENTS: "/reception/appointments",
  QUEUE: "/reception/queue",
  IPD: "/reception/ipd",
  BILLING: "/reception/billing"
}
export const DOCTOR_ROUTES = {
  DASHBOARD: "/doctor",
  QUEUE: "/doctor/queue",
  APPOINTMENTS: "/doctor/appointments",
  CONSULTATIONS: "/doctor/consultations",
  PATIENTS: "/doctor/patients",
  PRESCRIPTIONS: "/doctor/prescriptions",
  LAB: "/doctor/lab",
  IPD: "/doctor/ipd",
  SCHEDULE: "/doctor/schedule",
  INTERACTIONS: "/doctor/tools/interactions"
}
export const NURSE_ROUTES = {
  DASHBOARD: "/nurse",
  QUEUE: "/nurse/queue",
  PATIENTS: "/nurse/patients",
  VITALS: "/nurse/vitals",
  IPD: "/nurse/ipd"
}
export const PHARMACIST_ROUTES = {
  DASHBOARD: "/pharmacy",
  PENDING: "/pharmacy/pending",
  PRESCRIPTIONS: "/pharmacy/prescriptions",
  INVENTORY: "/pharmacy/inventory",
  REORDER_ALERTS: "/pharmacy/alerts/reorder",
  EXPIRY_ALERTS: "/pharmacy/alerts/expiry",
  INTERACTIONS: "/pharmacy/tools/interactions"
}
export const LAB_ROUTES = {
  DASHBOARD: "/lab",
  ORDERS: "/lab/orders",
  TESTS: "/lab/tests"
}
export const PATIENT_ROUTES = {
  DASHBOARD: "/patient",
  BOOK: "/patient/appointments/book",
  APPOINTMENTS: "/patient/appointments",
  EMR: "/patient/emr",
  PRESCRIPTIONS: "/patient/prescriptions",
  LAB: "/patient/lab",
  BILLING: "/patient/billing",
  SYMPTOM_CHECK: "/patient/symptom-check"
}
