import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useGetAppointmentAnalyticsQuery } from "@/api/reports.api"
import { useReportDateRange } from "@/hooks/useReportDateRange"
import ReportPageShell from "@/components/domain/ReportPageShell"
import ChartCard from "@/components/data-display/ChartCard"
import StatCard from "@/components/data-display/StatCard"
import DataTable from "@/components/data-display/DataTable"
import { formatDate } from "@/utils/formatDate"

const STATUS_COLORS = {
  scheduled: "#3b82f6",
  confirmed: "#0d9488",
  completed: "#22c55e",
  cancelled: "#ef4444",
  no_show: "#f59e0b"
}

export default function AppointmentAnalyticsPage() {
  const { fromDate, toDate, setFromDate, setToDate, params } = useReportDateRange()
  const { data, isLoading, error, refetch } = useGetAppointmentAnalyticsQuery(params)
  const rows = data?.data?.rows || []
  const summary = data?.data?.summary || {}
  const chartData = useMemo(() => {
    const byDate = {}
    rows.forEach((row) => {
      const key = row.report_date
      if (!byDate[key]) byDate[key] = { date: formatDate(key, "MMM d") }
      byDate[key][row.status] = Number(row.appointment_count || 0)
    })
    return Object.values(byDate).reverse()
  }, [rows])
  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status).filter(Boolean))], [rows])
  const columns = useMemo(
    () => [
      { header: "Date", cell: ({ row }) => formatDate(row.original.report_date) },
      { header: "Status", cell: ({ row }) => <span className="capitalize">{row.original.status?.replace("_", " ")}</span> },
      { header: "Type", cell: ({ row }) => <span className="capitalize">{row.original.type || "-"}</span> },
      { header: "Count", cell: ({ row }) => row.original.appointment_count ?? 0 },
      { header: "Avg no-show %", cell: ({ row }) => row.original.avg_no_show_probability != null ? `${row.original.avg_no_show_probability}%` : "-" }
    ],
    []
  )
  return (
    <ReportPageShell
      title="Appointment analytics"
      description="Appointment volume and status breakdown."
      reportType="appointment-analytics"
      dateParams={params}
      fromDate={fromDate}
      toDate={toDate}
      onFromDateChange={setFromDate}
      onToDateChange={setToDate}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total appointments" value={summary.total_appointments ?? 0} />
        <StatCard label="Completed" value={summary.completed ?? 0} />
        <StatCard label="Cancelled" value={summary.cancelled ?? 0} />
        <StatCard label="No shows" value={summary.no_shows ?? 0} />
      </div>
      <ChartCard title="Appointments by status" subtitle={`${fromDate} to ${toDate}`}>
        {chartData.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No appointment data for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              {statuses.map((status) => (
                <Bar
                  key={status}
                  dataKey={status}
                  name={status.replace("_", " ")}
                  stackId="appointments"
                  fill={STATUS_COLORS[status] || "#64748b"}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
      <DataTable columns={columns} data={rows} emptyTitle="No appointment records" />
    </ReportPageShell>
  )
}
