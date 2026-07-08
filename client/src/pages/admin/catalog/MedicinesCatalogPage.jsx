import { useMemo, useState } from "react"
import { toast } from "sonner"
import { useCreateMedicineMutation, useGetMedicinesQuery, useUpdateMedicineMutation } from "@/api/medicines.api"
import DataTable from "@/components/data-display/DataTable"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Pagination from "@/components/ui/Pagination"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import FormField from "@/components/forms/FormField"
import Input from "@/components/ui/Input"
import SearchInput from "@/components/forms/SearchInput"
import { parseApiError } from "@/utils/parseApiError"
export default function MedicinesCatalogPage() {
  return <Medicines />
}

function Medicines() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const limit = 20
  const { data, isLoading, error, refetch } = useGetMedicinesQuery({ page, limit, search: search || undefined })
  const [createMedicine, { isLoading: isCreating }] = useCreateMedicineMutation()
  const [updateMedicine, { isLoading: isUpdating }] = useUpdateMedicineMutation()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const medicines = data?.data?.medicines || []
  const totalPages = data?.pagination?.totalPages || 1

  const columns = useMemo(
    () => [
      { header: "Name", cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span> },
      { header: "Generic", cell: ({ row }) => row.original.generic_name || row.original.genericName || "-" },
      { header: "Category", cell: ({ row }) => row.original.category || "-" },
      { header: "Unit", cell: ({ row }) => row.original.unit || "-" },
      { header: "Stock", cell: ({ row }) => row.original.stock_quantity ?? row.original.stockQuantity ?? "-" },
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
          </div>
        )
      }
    ],
    []
  )

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Medicines</h1>
        <div className="flex items-center gap-2">
          <SearchInput placeholder="Search..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} className="w-[260px]" />
          <Button
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            New medicine
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={medicines} emptyTitle="No medicines" emptyDescription="No medicines found." />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <Modal open={open} title={editing ? "Edit medicine" : "Create medicine"} onClose={() => setOpen(false)} className="max-w-lg">
        <MedicineForm
          initial={editing}
          loading={isCreating || isUpdating}
          onSubmit={async (payload) => {
            try {
              const res = editing
                ? await updateMedicine({ id: editing.id, ...payload }).unwrap()
                : await createMedicine(payload).unwrap()
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

function MedicineForm({ initial, onSubmit, loading }) {
  const [name, setName] = useState(initial?.name || "")
  const [genericName, setGenericName] = useState(initial?.generic_name || initial?.genericName || "")
  const [category, setCategory] = useState(initial?.category || "")
  const [unit, setUnit] = useState(initial?.unit || "")
  const [reorderLevel, setReorderLevel] = useState(initial?.reorder_level ?? initial?.reorderLevel ?? "")
  const [purchasePrice, setPurchasePrice] = useState(initial?.purchase_price ?? initial?.purchasePrice ?? "")
  const [salePrice, setSalePrice] = useState(initial?.sale_price ?? initial?.salePrice ?? "")
  const [supplier, setSupplier] = useState(initial?.supplier || "")

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({
          name,
          genericName: genericName || undefined,
          category: category || undefined,
          unit: unit || undefined,
          reorderLevel: reorderLevel === "" ? undefined : Number(reorderLevel),
          purchasePrice: purchasePrice === "" ? undefined : Number(purchasePrice),
          salePrice: salePrice === "" ? undefined : Number(salePrice),
          supplier: supplier || undefined
        })
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Name" htmlFor="name">
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Generic name" htmlFor="genericName">
          <Input id="genericName" value={genericName} onChange={(e) => setGenericName(e.target.value)} />
        </FormField>
        <FormField label="Category" htmlFor="category">
          <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
        </FormField>
        <FormField label="Unit" htmlFor="unit">
          <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </FormField>
        <FormField label="Reorder level" htmlFor="reorderLevel">
          <Input id="reorderLevel" inputMode="numeric" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
        </FormField>
        <FormField label="Purchase price" htmlFor="purchasePrice">
          <Input id="purchasePrice" inputMode="decimal" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
        </FormField>
        <FormField label="Sale price" htmlFor="salePrice">
          <Input id="salePrice" inputMode="decimal" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
        </FormField>
        <FormField label="Supplier" htmlFor="supplier">
          <Input id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
        </FormField>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  )
}
