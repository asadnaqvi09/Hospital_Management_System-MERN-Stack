import { format, parseISO, isValid } from "date-fns"
export function formatDate(value, pattern = "MMM d, yyyy") {
  if (!value) return ""
  const date = typeof value === "string" ? parseISO(value) : value
  return isValid(date) ? format(date, pattern) : ""
}
export function formatDateTime(value, pattern = "MMM d, yyyy h:mm a") {
  return formatDate(value, pattern)
}
