import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  useCreateLabTestMutation,
  useDeleteLabTestMutation,
  useGetLabTestsQuery,
  useUpdateLabTestMutation
} from "@/api/lab.api"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import FormField from "@/components/forms/FormField"
import Input from "@/components/ui/Input"
import SearchInput from "@/components/forms/SearchInput"
import { parseApiError } from "@/utils/parseApiError"
export default function LabTestsPage() {
  return <LabTests />
}

function LabTests() {
  const [search, setSearch] = useState("")
  const { data, isLoading, error, refetch } = useGetLabTestsQuery({ includeInactive: true, search: search || undefined })
  const [createTest, { isLoading: isCreating }] = useCreateLabTestMutation()
  const [updateTest, { isLoading: isUpdating }] = useUpdateLabTestMutation()
  const [deleteTest, { isLoading: isDeleting }] = useDeleteLabTestMutation()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const tests = data?.data?.tests || []

  const columns = useMemo(
    () => [
      { header: "Name", cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span> },
      { header: "Category", cell: ({ row }) => row.original.category || "-" },
      { header: "Unit", cell: ({ row }) => row.original.unit || "-" },
      { header: "Price", cell: ({ row }) => row.original.price ?? "-" },
      { header: "Active", cell: ({ row }) => (row.original.is_active === false || row.original.isActive === false ? "No" : "Yes") },
      {
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditing(row.original)
                setOpen(true)
              }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isDeleting}
              onClick={async () => {
                try {
                  const res = await deleteTest(row.original.id).unwrap()
                  toast.success(res?.message || "Deleted")
                } catch (err) {
                  toast.error(parseApiError(err?.data || err))
                }
              }}
            >
              Delete
            </Button>
          </div>
        )
      }
    ],
    [deleteTest, isDeleting]
  )

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Lab Tests</h1>
        <div className="flex items-center gap-2">
          <SearchInput placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-[260px]" />
          <Button
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            New test
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={tests} emptyTitle="No tests" emptyDescription="No lab tests found." />
      <Modal open={open} title={editing ? "Edit lab test" : "Create lab test"} onClose={() => setOpen(false)} className="max-w-lg">
        <TestForm
          initial={editing}
          loading={isCreating || isUpdating}
          onSubmit={async (payload) => {
            try {
              const res = editing
                ? await updateTest({ id: editing.id, ...payload }).unwrap()
                : await createTest(payload).unwrap()
              toast.success(res?.message || (editing ? "Updated" : "Created"))
              setOpen(false)
            } catch (err) {
              toast.error(parseApiError(err?.data || err))
            }
          }}
        />
      </Modal>
    </div>
  )
}

function TestForm({ initial, onSubmit, loading }) {
  const [name, setName] = useState(initial?.name || "")
  const [category, setCategory] = useState(initial?.category || "")
  const [unit, setUnit] = useState(initial?.unit || "")
  const [normalRange, setNormalRange] = useState(initial?.normal_range || initial?.normalRange || "")
  const [price, setPrice] = useState(initial?.price ?? "")
  const [isActive, setIsActive] = useState(!(initial?.is_active === false || initial?.isActive === false))

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({
          name,
          category: category || undefined,
          unit: unit || undefined,
          normalRange: normalRange || undefined,
          price: price === "" ? undefined : Number(price),
          isActive
        })
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Name" htmlFor="name">
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Category" htmlFor="category">
          <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
        </FormField>
        <FormField label="Unit" htmlFor="unit">
          <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </FormField>
        <FormField label="Normal range" htmlFor="normalRange">
          <Input id="normalRange" value={normalRange} onChange={(e) => setNormalRange(e.target.value)} />
        </FormField>
        <FormField label="Price" htmlFor="price">
          <Input id="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </FormField>
        <div className="flex items-center gap-2 pt-7">
          <input
            id="isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="isActive" className="text-sm text-slate-700">
            Active
          </label>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  )
}
