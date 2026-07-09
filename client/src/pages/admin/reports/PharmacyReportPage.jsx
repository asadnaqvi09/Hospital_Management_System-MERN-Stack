import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useGetPharmacyReportQuery } from "@/api/reports.api"
import { useReportDateRange } from "@/hooks/useReportDateRange"
import ReportPageShell from "@/components/domain/ReportPageShell"
import ChartCard from "@/components/data-display/ChartCard"
import StatCard from "@/components/data-display/StatCard"
import DataTable from "@/components/data-display/DataTable"
import { formatDate } from "@/utils/formatDate"

export default function PharmacyReportPage() {
  const { fromDate, toDate, setFromDate, setToDate, params } = useReportDateRange()
  const { data, isLoading, error, refetch } = useGetPharmacyReportQuery(params)
  const rows = data?.data?.rows || []
  const summary = data?.data?.summary || {}
  const chartData = useMemo(
    () => [...rows].reverse().map((row) => ({
      date: formatDate(row.report_date, "MMM d"),
      dispenses: Number(row.dispense_count || 0),
      prescriptions: Number(row.prescription_count || 0)
    })),
    [rows]
  )
  const columns = useMemo(
    () => [
      { header: "Date", cell: ({ row }) => formatDate(row.original.report_date) },
      { header: "Dispenses", cell: ({ row }) => row.original.dispense_count ?? 0 },
      { header: "Prescriptions", cell: ({ row }) => row.original.prescription_count ?? 0 },
      { header: "Items dispensed", cell: ({ row }) => row.original.items_dispensed ?? 0 }
    ],
    []
  )
  return (
    <ReportPageShell
      title="Pharmacy report"
      description="Daily dispensing activity and prescription volume."
      reportType="pharmacy"
      dateParams={params}
      fromDate={fromDate}
      toDate={toDate}
      onFromDateChange={setFromDate}
      onToDateChange={setToDate}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total dispenses" value={summary.total_dispenses ?? 0} />
        <StatCard label="Prescriptions filled" value={summary.total_prescriptions ?? 0} />
        <StatCard label="Items dispensed" value={summary.total_items_dispensed ?? 0} />
      </div>
      <ChartCard title="Dispensing trend" subtitle={`${fromDate} to ${toDate}`}>
        {chartData.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No pharmacy data for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="dispenses" name="Dispenses" stroke="#0d9488" fill="#99f6e4" />
              <Area type="monotone" dataKey="prescriptions" name="Prescriptions" stroke="#3b82f6" fill="#bfdbfe" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
      <DataTable columns={columns} data={rows} emptyTitle="No pharmacy records" />
    </ReportPageShell>
  )
}
