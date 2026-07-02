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
