import {
  APPOINTMENT_STATUS,
  LAB_ORDER_STATUS,
  PRESCRIPTION_STATUS,
  INVOICE_STATUS,
  ADMISSION_STATUS,
  ROOM_STATUS
} from "@/constants/statuses"
const palette = {
  green: "bg-emerald-100 text-emerald-800",
  blue: "bg-blue-100 text-blue-800",
  yellow: "bg-amber-100 text-amber-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-gray-100 text-gray-800",
  purple: "bg-purple-100 text-purple-800",
  teal: "bg-teal-100 text-teal-800"
}
export const STATUS_COLORS = {
  appointment: {
    [APPOINTMENT_STATUS.SCHEDULED]: palette.blue,
    [APPOINTMENT_STATUS.CONFIRMED]: palette.teal,
    [APPOINTMENT_STATUS.CHECKED_IN]: palette.purple,
    [APPOINTMENT_STATUS.IN_CONSULTATION]: palette.orange,
    [APPOINTMENT_STATUS.COMPLETED]: palette.green,
    [APPOINTMENT_STATUS.CANCELLED]: palette.red,
    [APPOINTMENT_STATUS.NO_SHOW]: palette.gray
  },
  lab: {
    [LAB_ORDER_STATUS.ORDERED]: palette.blue,
    [LAB_ORDER_STATUS.SAMPLE_COLLECTED]: palette.purple,
    [LAB_ORDER_STATUS.PROCESSING]: palette.orange,
    [LAB_ORDER_STATUS.COMPLETED]: palette.green
  },
  prescription: {
    [PRESCRIPTION_STATUS.PENDING]: palette.yellow,
    [PRESCRIPTION_STATUS.DISPENSED]: palette.green,
    [PRESCRIPTION_STATUS.PARTIALLY_DISPENSED]: palette.orange,
    [PRESCRIPTION_STATUS.CANCELLED]: palette.red
  },
  invoice: {
    [INVOICE_STATUS.DRAFT]: palette.gray,
    [INVOICE_STATUS.FINALIZED]: palette.blue,
    [INVOICE_STATUS.PARTIALLY_PAID]: palette.orange,
    [INVOICE_STATUS.FULLY_PAID]: palette.green,
    [INVOICE_STATUS.CANCELLED]: palette.red
  },
  admission: {
    [ADMISSION_STATUS.ADMITTED]: palette.blue,
    [ADMISSION_STATUS.DISCHARGED]: palette.green,
    [ADMISSION_STATUS.TRANSFERRED]: palette.purple
  },
  room: {
    [ROOM_STATUS.AVAILABLE]: palette.green,
    [ROOM_STATUS.OCCUPIED]: palette.orange,
    [ROOM_STATUS.MAINTENANCE]: palette.red
  }
}
export function getStatusColor(type, status) {
  return STATUS_COLORS[type]?.[status] || palette.gray
}
