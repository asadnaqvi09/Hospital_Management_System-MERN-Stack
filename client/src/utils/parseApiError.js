export function parseApiError(error) {
  if (!error) return "Something went wrong"
  if (typeof error === "string") return error
  if (error.error) return error.error
  if (error.message) return error.message
  if (Array.isArray(error.errors)) return error.errors.map((e) => e.message || e).join(", ")
  return "Something went wrong"
}
