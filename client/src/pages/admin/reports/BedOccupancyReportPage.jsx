import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useGetBedOccupancyReportQuery } from "@/api/reports.api"
import ReportPageShell from "@/components/domain/ReportPageShell"
import ChartCard from "@/components/data-display/ChartCard"
import StatCard from "@/components/data-display/StatCard"
import DataTable from "@/components/data-display/DataTable"
import { formatCurrency } from "@/utils/formatCurrency"

export default function BedOccupancyReportPage() {
  const { data, isLoading, error, refetch } = useGetBedOccupancyReportQuery({})
  const rows = data?.data?.rows || []
  const summary = data?.data?.summary || {}
  const chartData = useMemo(() => {
    const byWard = {}
    rows.forEach((row) => {
      const ward = row.ward || "Unassigned"
      if (!byWard[ward]) byWard[ward] = { ward, occupied: 0, available: 0 }
      byWard[ward].occupied += Number(row.active_admissions || 0)
      byWard[ward].available += Number(row.available_beds || 0)
    })
    return Object.values(byWard)
  }, [rows])
  const columns = useMemo(
    () => [
      { header: "Ward", cell: ({ row }) => row.original.ward || "-" },
      { header: "Room", cell: ({ row }) => row.original.room_number || "-" },
      { header: "Floor", cell: ({ row }) => row.original.floor ?? "-" },
      { header: "Capacity", cell: ({ row }) => row.original.capacity ?? 0 },
      { header: "Occupied", cell: ({ row }) => row.original.active_admissions ?? 0 },
      { header: "Available", cell: ({ row }) => row.original.available_beds ?? 0 },
      { header: "Occupancy %", cell: ({ row }) => `${row.original.occupancy_rate ?? 0}%` },
      { header: "Daily rate", cell: ({ row }) => formatCurrency(row.original.daily_rate) },
      { header: "Status", cell: ({ row }) => <span className="capitalize">{row.original.room_status?.replace("_", " ") || "-"}</span> }
    ],
    []
  )
  return (
    <ReportPageShell
      title="Bed occupancy"
      description="Current ward and room utilization."
      reportType="bed-occupancy"
      dateParams={{}}
      showDateRange={false}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total rooms" value={summary.total_rooms ?? 0} />
        <StatCard label="Total beds" value={summary.total_beds ?? 0} />
        <StatCard label="Occupied beds" value={summary.occupied_beds ?? 0} />
        <StatCard label="Overall occupancy" value={`${summary.overall_occupancy_rate ?? 0}%`} />
      </div>
      <ChartCard title="Beds by ward">
        {chartData.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No occupancy data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="ward" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="occupied" name="Occupied" fill="#0d9488" radius={[4, 4, 0, 0]} />
              <Bar dataKey="available" name="Available" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
      <DataTable columns={columns} data={rows} emptyTitle="No room data" />
    </ReportPageShell>
  )
}
