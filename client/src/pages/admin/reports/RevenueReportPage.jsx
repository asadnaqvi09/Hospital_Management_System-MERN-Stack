import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { useGetRevenueReportQuery } from "@/api/reports.api"
import { useReportDateRange } from "@/hooks/useReportDateRange"
import ReportPageShell from "@/components/domain/ReportPageShell"
import ChartCard from "@/components/data-display/ChartCard"
import StatCard from "@/components/data-display/StatCard"
import DataTable from "@/components/data-display/DataTable"
import { formatCurrency } from "@/utils/formatCurrency"
import { formatDate } from "@/utils/formatDate"

const METHOD_COLORS = {
  cash: "#0d9488",
  card: "#3b82f6",
  bank_transfer: "#8b5cf6",
  insurance: "#f59e0b"
}

export default function RevenueReportPage() {
  const { fromDate, toDate, setFromDate, setToDate, params } = useReportDateRange()
  const { data, isLoading, error, refetch } = useGetRevenueReportQuery(params)
  const rows = data?.data?.rows || []
  const summary = data?.data?.summary || {}
  const chartData = useMemo(() => {
    const byDate = {}
    rows.forEach((row) => {
      const key = row.report_date
      if (!byDate[key]) byDate[key] = { date: formatDate(key, "MMM d") }
      byDate[key][row.method] = Number(row.total_amount || 0)
    })
    return Object.values(byDate).reverse()
  }, [rows])
  const methods = useMemo(() => [...new Set(rows.map((r) => r.method).filter(Boolean))], [rows])
  const columns = useMemo(
    () => [
      { header: "Date", cell: ({ row }) => formatDate(row.original.report_date) },
      { header: "Method", cell: ({ row }) => <span className="capitalize">{row.original.method?.replace("_", " ")}</span> },
      { header: "Payments", cell: ({ row }) => row.original.payment_count ?? 0 },
      { header: "Amount", cell: ({ row }) => formatCurrency(row.original.total_amount) }
    ],
    []
  )
  return (
    <ReportPageShell
      title="Revenue report"
      description="Payment collections by method and date."
      reportType="revenue"
      dateParams={params}
      fromDate={fromDate}
      toDate={toDate}
      onFromDateChange={setFromDate}
      onToDateChange={setToDate}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total revenue" value={formatCurrency(summary.total_revenue || 0)} />
        <StatCard label="Total payments" value={summary.total_payments ?? 0} />
      </div>
      <ChartCard title="Revenue by payment method" subtitle={`${fromDate} to ${toDate}`}>
        {chartData.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No revenue data for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              {methods.map((method) => (
                <Bar
                  key={method}
                  dataKey={method}
                  name={method.replace("_", " ")}
                  stackId="revenue"
                  fill={METHOD_COLORS[method] || "#64748b"}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
      <DataTable columns={columns} data={rows} emptyTitle="No revenue records" />
    </ReportPageShell>
  )
}
