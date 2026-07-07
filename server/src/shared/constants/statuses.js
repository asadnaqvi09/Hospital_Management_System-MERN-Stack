export const AUDIT_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  ACCESS: "ACCESS"
}

export const APPOINTMENT_STATUS = {
  SCHEDULED: "scheduled",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked_in",
  IN_CONSULTATION: "in_consultation",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show"
}

export const APPOINTMENT_STATUS_TRANSITIONS = {
  scheduled: ["confirmed", "checked_in", "cancelled", "no_show"],
  confirmed: ["checked_in", "in_consultation", "cancelled", "no_show"],
  checked_in: ["in_consultation", "cancelled", "no_show"],
  in_consultation: ["completed"],
  completed: [],
  cancelled: [],
  no_show: []
}

export const CONSULTATION_OPEN_STATUSES = [
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.CHECKED_IN,
  APPOINTMENT_STATUS.IN_CONSULTATION
]

export const LAB_ORDER_STATUS_TRANSITIONS = {
  ordered: ["sample_collected"],
  sample_collected: ["processing"],
  processing: ["completed"],
  completed: []
}

export const DIAGNOSIS_TYPES = ["primary", "secondary", "differential"]

export const NURSING_SHIFTS = ["morning", "afternoon", "night"]

export const ROOM_STATUS = {
  AVAILABLE: "available",
  OCCUPIED: "occupied",
  MAINTENANCE: "maintenance"
}

export const ADMISSION_STATUS = {
  ADMITTED: "admitted",
  DISCHARGED: "discharged",
  TRANSFERRED: "transferred"
}

export const PRESCRIPTION_STATUS = {
  PENDING: "pending",
  DISPENSED: "dispensed",
  PARTIALLY_DISPENSED: "partially_dispensed",
  CANCELLED: "cancelled"
}

export const LAB_ORDER_STATUS = {
  ORDERED: "ordered",
  SAMPLE_COLLECTED: "sample_collected",
  PROCESSING: "processing",
  COMPLETED: "completed"
}

export const INVOICE_STATUS = {
  DRAFT: "draft",
  FINALIZED: "finalized",
  PARTIALLY_PAID: "partially_paid",
  FULLY_PAID: "fully_paid",
  CANCELLED: "cancelled"
}
