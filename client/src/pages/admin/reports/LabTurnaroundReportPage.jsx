import { useMemo } from "react"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useGetLabTurnaroundReportQuery } from "@/api/reports.api"
import { useReportDateRange } from "@/hooks/useReportDateRange"
import ReportPageShell from "@/components/domain/ReportPageShell"
import ChartCard from "@/components/data-display/ChartCard"
import StatCard from "@/components/data-display/StatCard"
import DataTable from "@/components/data-display/DataTable"
import { formatDate } from "@/utils/formatDate"

const PRIORITY_COLORS = {
  routine: "#0d9488",
  urgent: "#f59e0b",
  critical: "#ef4444"
}

export default function LabTurnaroundReportPage() {
  const { fromDate, toDate, setFromDate, setToDate, params } = useReportDateRange()
  const { data, isLoading, error, refetch } = useGetLabTurnaroundReportQuery(params)
  const rows = data?.data?.rows || []
  const summary = data?.data?.summary || {}
  const chartData = useMemo(() => {
    const byDate = {}
    rows.forEach((row) => {
      const key = row.report_date
      if (!byDate[key]) byDate[key] = { date: formatDate(key, "MMM d") }
      byDate[key][row.priority] = Number(row.avg_turnaround_hours || 0)
    })
    return Object.values(byDate).reverse()
  }, [rows])
  const priorities = useMemo(() => [...new Set(rows.map((r) => r.priority).filter(Boolean))], [rows])
  const columns = useMemo(
    () => [
      { header: "Date", cell: ({ row }) => formatDate(row.original.report_date) },
      { header: "Priority", cell: ({ row }) => <span className="capitalize">{row.original.priority}</span> },
      { header: "Orders", cell: ({ row }) => row.original.order_count ?? 0 },
      { header: "Avg hours", cell: ({ row }) => row.original.avg_turnaround_hours ?? "-" },
      { header: "Min hours", cell: ({ row }) => row.original.min_turnaround_hours ?? "-" },
      { header: "Max hours", cell: ({ row }) => row.original.max_turnaround_hours ?? "-" }
    ],
    []
  )
  return (
    <ReportPageShell
      title="Lab turnaround"
      description="Average order completion time by priority."
      reportType="lab-turnaround"
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
        <StatCard label="Completed orders" value={summary.total_completed ?? 0} />
        <StatCard label="Avg turnaround" value={summary.avg_turnaround_hours != null ? `${summary.avg_turnaround_hours}h` : "-"} />
        <StatCard label="Fastest" value={summary.min_turnaround_hours != null ? `${summary.min_turnaround_hours}h` : "-"} />
        <StatCard label="Slowest" value={summary.max_turnaround_hours != null ? `${summary.max_turnaround_hours}h` : "-"} />
      </div>
      <ChartCard title="Turnaround by priority" subtitle={`${fromDate} to ${toDate}`}>
        {chartData.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No lab turnaround data for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="h" />
              <Tooltip formatter={(value) => `${value}h`} />
              <Legend />
              {priorities.map((priority) => (
                <Line
                  key={priority}
                  type="monotone"
                  dataKey={priority}
                  name={priority}
                  stroke={PRIORITY_COLORS[priority] || "#64748b"}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
      <DataTable columns={columns} data={rows} emptyTitle="No lab turnaround records" />
    </ReportPageShell>
  )
}
