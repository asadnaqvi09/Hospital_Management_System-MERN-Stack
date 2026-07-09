import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { useGetMedicinesQuery, useReceiveBatchMutation } from "@/api/medicines.api"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import FormField from "@/components/forms/FormField"
import SearchInput from "@/components/forms/SearchInput"
import { parseApiError } from "@/utils/parseApiError"
export default function ReceiveBatchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedId = searchParams.get("medicineId") || ""
  const [search, setSearch] = useState("")
  const [medicineId, setMedicineId] = useState(preselectedId)
  const [batchNumber, setBatchNumber] = useState("")
  const [quantity, setQuantity] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const { data } = useGetMedicinesQuery({ search: search || undefined, limit: 50 })
  const [receiveBatch, { isLoading }] = useReceiveBatchMutation()
  const medicines = data?.data?.medicines || []
  const medicineOptions = useMemo(
    () => [
      { value: "", label: "Select medicine" },
      ...medicines.map((m) => ({
        value: m.id,
        label: `${m.name}${m.generic_name ? ` (${m.generic_name})` : ""}`
      }))
    ],
    [medicines]
  )
  useEffect(() => {
    if (preselectedId) setMedicineId(preselectedId)
  }, [preselectedId])
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!medicineId) {
      toast.error("Select a medicine")
      return
    }
    const qty = Number(quantity)
    if (!batchNumber.trim()) {
      toast.error("Batch number is required")
      return
    }
    if (!Number.isInteger(qty) || qty < 1) {
      toast.error("Quantity must be at least 1")
      return
    }
    if (!expiryDate) {
      toast.error("Expiry date is required")
      return
    }
    try {
      const res = await receiveBatch({
        medicineId,
        batchNumber: batchNumber.trim(),
        quantity: qty,
        expiryDate
      }).unwrap()
      toast.success(res?.message || "Batch received")
      navigate(`/pharmacy/inventory/${medicineId}`)
    } catch (err) {
      console.error("receiveBatch", { medicineId, batchNumber, quantity, expiryDate, error: err })
      toast.error(parseApiError(err?.data || err))
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Receive batch</h1>
          <p className="text-sm text-slate-600">Add incoming stock for a medicine batch.</p>
        </div>
        <Button variant="secondary" as={Link} to="/pharmacy/inventory">
          Back
        </Button>
      </div>
      <Card className="p-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Search medicine" htmlFor="search">
            <SearchInput
              id="search"
              placeholder="Search to filter medicines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </FormField>
          <FormField label="Medicine" htmlFor="medicineId">
            <Select
              id="medicineId"
              value={medicineId}
              onChange={(e) => setMedicineId(e.target.value)}
              options={medicineOptions}
            />
          </FormField>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="Batch number" htmlFor="batchNumber">
              <Input id="batchNumber" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} />
            </FormField>
            <FormField label="Quantity" htmlFor="quantity">
              <Input id="quantity" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </FormField>
            <FormField label="Expiry date" htmlFor="expiryDate">
              <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Receive batch"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
