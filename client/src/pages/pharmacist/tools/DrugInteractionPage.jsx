import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { useDrugInteractionMutation } from "@/api/ai.api"
import { useLazySearchPatientsQuery } from "@/api/search.api"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import FormField from "@/components/forms/FormField"
import SearchInput from "@/components/forms/SearchInput"
import { parseApiError } from "@/utils/parseApiError"
const EMPTY_MEDICINE = { medicineName: "", genericName: "", dosage: "", frequency: "" }
export default function PharmacistDrugInteractionPage() {
  const [patientQuery, setPatientQuery] = useState("")
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [medicines, setMedicines] = useState([{ ...EMPTY_MEDICINE }])
  const [result, setResult] = useState(null)
  const [searchPatients, { data: searchData, isFetching }] = useLazySearchPatientsQuery()
  const [checkInteractions, { isLoading }] = useDrugInteractionMutation()
  const patients = searchData?.data?.patients || []
  useEffect(() => {
    if (!patientQuery.trim()) return
    const timer = setTimeout(() => {
      searchPatients(patientQuery.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [patientQuery, searchPatients])
  const updateMedicine = (index, field, value) => {
    setMedicines((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)))
  }
  const addMedicine = () => setMedicines((prev) => [...prev, { ...EMPTY_MEDICINE }])
  const removeMedicine = (index) => {
    setMedicines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPatient?.id) {
      toast.error("Select a patient")
      return
    }
    const payloadMeds = medicines
      .map((m) => ({
        medicineName: m.medicineName.trim(),
        genericName: m.genericName.trim() || undefined,
        dosage: m.dosage.trim() || undefined,
        frequency: m.frequency.trim() || undefined
      }))
      .filter((m) => m.medicineName)
    if (payloadMeds.length === 0) {
      toast.error("Add at least one medicine")
      return
    }
    try {
      const res = await checkInteractions({
        patientId: selectedPatient.id,
        medicines: payloadMeds
      }).unwrap()
      setResult(res?.data?.result || null)
    } catch (err) {
      console.error("drugInteraction", { patientId: selectedPatient.id, medicines: payloadMeds, error: err })
      toast.error(parseApiError(err?.data || err))
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Drug interaction check</h1>
          <p className="text-sm text-slate-600">Check medicine interactions against patient allergies.</p>
        </div>
        <Button variant="secondary" as={Link} to="/pharmacy">
          Back
        </Button>
      </div>
      <Card className="p-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Patient search" htmlFor="patientSearch">
            <SearchInput
              id="patientSearch"
              placeholder="Search by name or MRN..."
              value={patientQuery}
              onChange={(e) => {
                setPatientQuery(e.target.value)
                setSelectedPatient(null)
              }}
            />
          </FormField>
          {isFetching && <p className="text-xs text-slate-500">Searching...</p>}
          {patients.length > 0 && !selectedPatient && (
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {patients.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => {
                    setSelectedPatient(p)
                    setPatientQuery(p.full_name || p.fullName || "")
                  }}
                >
                  <span className="font-medium text-slate-900">{p.full_name || p.fullName}</span>
                  <span className="text-slate-600">MRN {p.mrn || "-"}</span>
                </button>
              ))}
            </div>
          )}
          {selectedPatient && (
            <p className="text-sm text-slate-700">
              Selected: <span className="font-medium text-slate-900">{selectedPatient.full_name || selectedPatient.fullName}</span>
              {" "}• MRN {selectedPatient.mrn || "-"}
            </p>
          )}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Medicines</h2>
              <Button type="button" variant="secondary" size="sm" onClick={addMedicine}>
                Add medicine
              </Button>
            </div>
            {medicines.map((med, index) => (
              <div key={index} className="rounded-lg border border-slate-200 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <FormField label="Medicine name" htmlFor={`name-${index}`}>
                    <Input
                      id={`name-${index}`}
                      value={med.medicineName}
                      onChange={(e) => updateMedicine(index, "medicineName", e.target.value)}
                    />
                  </FormField>
                  <FormField label="Generic name" htmlFor={`generic-${index}`}>
                    <Input
                      id={`generic-${index}`}
                      value={med.genericName}
                      onChange={(e) => updateMedicine(index, "genericName", e.target.value)}
                    />
                  </FormField>
                  <FormField label="Dosage" htmlFor={`dosage-${index}`}>
                    <Input
                      id={`dosage-${index}`}
                      value={med.dosage}
                      onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                    />
                  </FormField>
                  <FormField label="Frequency" htmlFor={`frequency-${index}`}>
                    <Input
                      id={`frequency-${index}`}
                      value={med.frequency}
                      onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
                    />
                  </FormField>
                </div>
                {medicines.length > 1 && (
                  <div className="mt-3 flex justify-end">
                    <Button type="button" variant="secondary" size="sm" onClick={() => removeMedicine(index)}>
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Checking..." : "Run check"}
            </Button>
          </div>
        </form>
      </Card>
      {result && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-900">Results</h2>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  result.hasInteractions
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                {result.hasInteractions ? "Interactions found" : "No interactions"}
              </span>
              {result.severity && result.severity !== "none" && (
                <span className="text-xs text-slate-600">Severity: {result.severity}</span>
              )}
              {result.configured === false && (
                <span className="text-xs text-amber-700">AI provider not configured</span>
              )}
            </div>
            {(result.warnings || []).length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-900">Warnings</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{typeof w === "string" ? w : w.message || JSON.stringify(w)}</li>
                  ))}
                </ul>
              </div>
            )}
            {(result.allergyAlerts || []).length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-900">Allergy alerts</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
                  {result.allergyAlerts.map((a, i) => (
                    <li key={i}>{typeof a === "string" ? a : a.message || JSON.stringify(a)}</li>
                  ))}
                </ul>
              </div>
            )}
            {!result.hasInteractions &&
              (result.warnings || []).length === 0 &&
              (result.allergyAlerts || []).length === 0 && (
                <p className="text-sm text-slate-600">No warnings or allergy alerts reported.</p>
              )}
          </div>
        </Card>
      )}
    </div>
  )
}
