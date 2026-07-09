import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useGetPatientVolumeReportQuery } from "@/api/reports.api"
import { useReportDateRange } from "@/hooks/useReportDateRange"
import ReportPageShell from "@/components/domain/ReportPageShell"
import ChartCard from "@/components/data-display/ChartCard"
import StatCard from "@/components/data-display/StatCard"
import DataTable from "@/components/data-display/DataTable"
import { formatDate } from "@/utils/formatDate"

export default function PatientVolumeReportPage() {
  const { fromDate, toDate, setFromDate, setToDate, params } = useReportDateRange()
  const { data, isLoading, error, refetch } = useGetPatientVolumeReportQuery(params)
  const rows = data?.data?.rows || []
  const summary = data?.data?.summary || {}
  const chartData = useMemo(
    () => [...rows].reverse().map((row) => ({
      date: formatDate(row.report_date, "MMM d"),
      patients: Number(row.new_patients || 0)
    })),
    [rows]
  )
  const columns = useMemo(
    () => [
      { header: "Date", cell: ({ row }) => formatDate(row.original.report_date) },
      { header: "New patients", cell: ({ row }) => row.original.new_patients ?? 0 }
    ],
    []
  )
  return (
    <ReportPageShell
      title="Patient volume"
      description="Daily new patient registrations."
      reportType="patient-volume"
      dateParams={params}
      fromDate={fromDate}
      toDate={toDate}
      onFromDateChange={setFromDate}
      onToDateChange={setToDate}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      <StatCard label="Total new patients" value={summary.total_new_patients ?? 0} />
      <ChartCard title="Registration trend" subtitle={`${fromDate} to ${toDate}`}>
        {chartData.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No registration data for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="patients" name="New patients" stroke="#0d9488" fill="#99f6e4" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
      <DataTable columns={columns} data={rows} emptyTitle="No registration records" />
    </ReportPageShell>
  )
}
