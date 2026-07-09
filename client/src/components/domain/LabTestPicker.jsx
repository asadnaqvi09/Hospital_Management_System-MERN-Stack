import { useMemo, useState } from "react"
import { useGetLabTestsQuery } from "@/api/lab.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Card from "@/components/ui/Card"
import Select from "@/components/ui/Select"
import FormField from "@/components/forms/FormField"
import SearchInput from "@/components/forms/SearchInput"
import { formatCurrency } from "@/utils/formatCurrency"

const PRIORITY_OPTIONS = [
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "critical", label: "Critical" }
]

export function LabTestPicker({
  selectedTestIds = [],
  onChange,
  priority = "routine",
  onPriorityChange,
  disabled = false
}) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const { data, isLoading, error, refetch } = useGetLabTestsQuery({
    search: search || undefined,
    category: category || undefined
  })
  const tests = useMemo(() => data?.data?.tests || [], [data])
  const selectedSet = useMemo(() => new Set(selectedTestIds), [selectedTestIds])
  const categories = useMemo(() => {
    const values = new Set(tests.map((t) => t.category).filter(Boolean))
    return [{ value: "", label: "All categories" }, ...Array.from(values).map((c) => ({ value: c, label: c }))]
  }, [tests])

  const toggleTest = (testId) => {
    if (disabled) return
    const next = selectedSet.has(testId)
      ? selectedTestIds.filter((id) => id !== testId)
      : [...selectedTestIds, testId]
    onChange?.(next)
  }

  const selectedTotal = useMemo(() => {
    return tests.filter((t) => selectedSet.has(t.id)).reduce((sum, t) => sum + Number(t.price || 0), 0)
  }, [tests, selectedSet])

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <FormField label="Search tests" htmlFor="lab-test-search">
          <SearchInput
            id="lab-test-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or category"
            disabled={disabled}
          />
        </FormField>
        <FormField label="Category" htmlFor="lab-test-category">
          <Select
            id="lab-test-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categories}
            disabled={disabled}
          />
        </FormField>
        {onPriorityChange && (
          <FormField label="Priority" htmlFor="lab-test-priority">
            <Select
              id="lab-test-priority"
              value={priority}
              onChange={(e) => onPriorityChange(e.target.value)}
              options={PRIORITY_OPTIONS}
              disabled={disabled}
            />
          </FormField>
        )}
      </div>
      {tests.length === 0 ? (
        <Card className="p-6 text-center text-sm text-slate-600">No lab tests match your filters.</Card>
      ) : (
        <div className="grid gap-2">
          {tests.map((test) => {
            const checked = selectedSet.has(test.id)
            return (
              <label
                key={test.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  checked ? "border-teal-300 bg-teal-50" : "border-slate-200 hover:bg-slate-50"
                } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleTest(test.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-900">{test.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-600">
                    {[test.category, test.unit, test.normal_range].filter(Boolean).join(" · ") || "No reference range"}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium text-slate-800">
                  {test.price != null ? formatCurrency(test.price) : "—"}
                </span>
              </label>
            )
          })}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-700">
        <span>{selectedTestIds.length} test(s) selected</span>
        {selectedTestIds.length > 0 && <span className="font-medium text-slate-900">Est. {formatCurrency(selectedTotal)}</span>}
      </div>
    </div>
  )
}

export default LabTestPicker
