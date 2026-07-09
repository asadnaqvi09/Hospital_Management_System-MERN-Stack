import { useMemo, useState } from "react"

export function getDefaultReportDateRange() {
  const toDate = new Date()
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - 30)
  return {
    fromDate: fromDate.toISOString().slice(0, 10),
    toDate: toDate.toISOString().slice(0, 10)
  }
}

export function useReportDateRange() {
  const defaults = useMemo(() => getDefaultReportDateRange(), [])
  const [fromDate, setFromDate] = useState(defaults.fromDate)
  const [toDate, setToDate] = useState(defaults.toDate)
  const params = useMemo(() => ({ fromDate, toDate }), [fromDate, toDate])
  return { fromDate, toDate, setFromDate, setToDate, params, defaults }
}
