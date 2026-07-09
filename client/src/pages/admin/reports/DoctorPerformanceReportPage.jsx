import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useGetDoctorPerformanceReportQuery } from "@/api/reports.api"
import ReportPageShell from "@/components/domain/ReportPageShell"
import ChartCard from "@/components/data-display/ChartCard"
import DataTable from "@/components/data-display/DataTable"
import { formatCurrency } from "@/utils/formatCurrency"

export default function DoctorPerformanceReportPage() {
  const { data, isLoading, error, refetch } = useGetDoctorPerformanceReportQuery({})
  const rows = data?.data?.rows || []
  const chartData = useMemo(
    () => rows.slice(0, 10).map((row) => ({
      name: (row.doctor_name || "Doctor").split(" ")[0],
      completed: Number(row.completed_appointments || 0),
      consultations: Number(row.consultation_count || 0)
    })),
    [rows]
  )
  const columns = useMemo(
    () => [
      { header: "Doctor", cell: ({ row }) => row.original.doctor_name || "-" },
      { header: "Department", cell: ({ row }) => row.original.department || "-" },
      { header: "Completed", cell: ({ row }) => row.original.completed_appointments ?? 0 },
      { header: "No shows", cell: ({ row }) => row.original.no_show_count ?? 0 },
      { header: "Consultations", cell: ({ row }) => row.original.consultation_count ?? 0 },
      { header: "Revenue", cell: ({ row }) => formatCurrency(row.original.revenue_generated) }
    ],
    []
  )
  return (
    <ReportPageShell
      title="Doctor performance"
      description="Completed visits, consultations, and revenue by doctor."
      reportType="doctor-performance"
      dateParams={{}}
      showDateRange={false}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      <ChartCard title="Top doctors by completed visits">
        {chartData.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No performance data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Bar dataKey="completed" name="Completed visits" fill="#0d9488" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
      <DataTable columns={columns} data={rows} emptyTitle="No doctor performance data" />
    </ReportPageShell>
  )
}
