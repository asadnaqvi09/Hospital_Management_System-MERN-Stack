export function formatCurrency(amount, currency = "INR") {
  if (amount == null || Number.isNaN(Number(amount))) return ""
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency
  }).format(Number(amount))
}
