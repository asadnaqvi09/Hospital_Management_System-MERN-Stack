import { useMemo, useState } from "react"
import { toast } from "sonner"
import { ExternalLink, Trash2 } from "lucide-react"
import {
  useGetPatientAllergiesQuery,
  useGetPatientConditionsQuery,
  useGetPatientDocumentsQuery,
  useAddPatientAllergyMutation,
  useRemovePatientAllergyMutation,
  useAddPatientConditionMutation,
  useUpdatePatientConditionMutation,
  useUploadPatientDocumentMutation
} from "@/api/patients.api"
import { ROLES } from "@/constants/roles"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import FormField from "@/components/forms/FormField"
import DataTable from "@/components/data-display/DataTable"
import { parseApiError } from "@/utils/parseApiError"

const SEVERITY_OPTIONS = [
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" }
]

const CONDITION_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "chronic", label: "Chronic" },
  { value: "resolved", label: "Resolved" }
]

function formatDate(value) {
  return String(value || "").replace("T", " ").slice(0, 16) || "-"
}

function formatSize(bytes) {
  const size = Number(bytes)
  if (!size || Number.isNaN(size)) return "-"
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function PatientHealthRecordsPanel({ patientId, role }) {
  const canManageAllergies = role === ROLES.DOCTOR
  const canManageConditions = role === ROLES.DOCTOR
  const canUploadDocuments = [ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN].includes(role)
  const allergiesQuery = useGetPatientAllergiesQuery(patientId, { skip: !patientId })
  const conditionsQuery = useGetPatientConditionsQuery(patientId, { skip: !patientId })
  const documentsQuery = useGetPatientDocumentsQuery(patientId, { skip: !patientId })
  const [addAllergy, { isLoading: addingAllergy }] = useAddPatientAllergyMutation()
  const [removeAllergy] = useRemovePatientAllergyMutation()
  const [addCondition, { isLoading: addingCondition }] = useAddPatientConditionMutation()
  const [updateCondition] = useUpdatePatientConditionMutation()
  const [uploadDocument, { isLoading: uploading }] = useUploadPatientDocumentMutation()
  const [allergyForm, setAllergyForm] = useState({ allergen: "", reaction: "", severity: "mild" })
  const [conditionForm, setConditionForm] = useState({
    conditionName: "",
    icdCode: "",
    diagnosedDate: "",
    status: "active",
    notes: ""
  })
  const [docTitle, setDocTitle] = useState("")
  const [docFile, setDocFile] = useState(null)
  const allergies = allergiesQuery.data?.data?.allergies || []
  const conditions = conditionsQuery.data?.data?.conditions || []
  const documents = documentsQuery.data?.data?.documents || []
  const allergyColumns = useMemo(
    () => [
      { header: "Allergen", cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.allergen || "-"}</span> },
      { header: "Reaction", cell: ({ row }) => row.original.reaction || "-" },
      { header: "Severity", cell: ({ row }) => row.original.severity || "-" },
      {
        header: "",
        cell: ({ row }) =>
          canManageAllergies ? (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await removeAllergy({ patientId, allergyId: row.original.id }).unwrap()
                    toast.success("Allergy removed")
                  } catch (err) {
                    toast.error(parseApiError(err?.data || err))
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ) : null
      }
    ],
    [canManageAllergies, patientId, removeAllergy]
  )
  const conditionColumns = useMemo(
    () => [
      { header: "Condition", cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.condition_name || row.original.conditionName || "-"}</span> },
      { header: "ICD", cell: ({ row }) => row.original.icd_code || row.original.icdCode || "-" },
      { header: "Diagnosed", cell: ({ row }) => row.original.diagnosed_date || row.original.diagnosedDate || "-" },
      {
        header: "Status",
        cell: ({ row }) =>
          canManageConditions ? (
            <Select
              value={row.original.status || "active"}
              options={CONDITION_STATUS_OPTIONS}
              className="w-[130px]"
              onChange={async (e) => {
                try {
                  await updateCondition({
                    patientId,
                    conditionId: row.original.id,
                    status: e.target.value
                  }).unwrap()
                  toast.success("Condition updated")
                } catch (err) {
                  toast.error(parseApiError(err?.data || err))
                }
              }}
            />
          ) : (
            row.original.status || "-"
          )
      },
      { header: "Notes", cell: ({ row }) => row.original.notes || "-" }
    ],
    [canManageConditions, patientId, updateCondition]
  )
  const onAddAllergy = async (e) => {
    e.preventDefault()
    if (!allergyForm.allergen.trim()) {
      toast.error("Allergen is required")
      return
    }
    try {
      await addAllergy({
        patientId,
        allergen: allergyForm.allergen.trim(),
        reaction: allergyForm.reaction.trim() || undefined,
        severity: allergyForm.severity
      }).unwrap()
      toast.success("Allergy recorded")
      setAllergyForm({ allergen: "", reaction: "", severity: "mild" })
    } catch (err) {
      toast.error(parseApiError(err?.data || err))
    }
  }
  const onAddCondition = async (e) => {
    e.preventDefault()
    if (!conditionForm.conditionName.trim()) {
      toast.error("Condition name is required")
      return
    }
    try {
      await addCondition({
        patientId,
        conditionName: conditionForm.conditionName.trim(),
        icdCode: conditionForm.icdCode.trim() || undefined,
        diagnosedDate: conditionForm.diagnosedDate || undefined,
        status: conditionForm.status,
        notes: conditionForm.notes.trim() || undefined
      }).unwrap()
      toast.success("Condition recorded")
      setConditionForm({ conditionName: "", icdCode: "", diagnosedDate: "", status: "active", notes: "" })
    } catch (err) {
      toast.error(parseApiError(err?.data || err))
    }
  }
  const onUploadDocument = async (e) => {
    e.preventDefault()
    if (!docFile) {
      toast.error("Select a file to upload")
      return
    }
    try {
      await uploadDocument({
        patientId,
        file: docFile,
        title: docTitle.trim() || undefined
      }).unwrap()
      toast.success("Document uploaded")
      setDocTitle("")
      setDocFile(null)
    } catch (err) {
      toast.error(parseApiError(err?.data || err))
    }
  }
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Allergies</h2>
        {canManageAllergies && (
          <form onSubmit={onAddAllergy} className="mt-4 grid gap-3 md:grid-cols-4">
            <FormField label="Allergen" htmlFor="allergen">
              <Input id="allergen" value={allergyForm.allergen} onChange={(e) => setAllergyForm((f) => ({ ...f, allergen: e.target.value }))} />
            </FormField>
            <FormField label="Reaction" htmlFor="reaction">
              <Input id="reaction" value={allergyForm.reaction} onChange={(e) => setAllergyForm((f) => ({ ...f, reaction: e.target.value }))} />
            </FormField>
            <FormField label="Severity" htmlFor="severity">
              <Select
                id="severity"
                value={allergyForm.severity}
                options={SEVERITY_OPTIONS}
                onChange={(e) => setAllergyForm((f) => ({ ...f, severity: e.target.value }))}
              />
            </FormField>
            <div className="flex items-end">
              <Button type="submit" disabled={addingAllergy}>
                {addingAllergy ? "Saving..." : "Add allergy"}
              </Button>
            </div>
          </form>
        )}
        <div className="mt-4">
          <DataTable columns={allergyColumns} data={allergies} emptyTitle="No allergies" emptyDescription="No allergies recorded." />
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Conditions</h2>
        {canManageConditions && (
          <form onSubmit={onAddCondition} className="mt-4 grid gap-3 md:grid-cols-3">
            <FormField label="Condition" htmlFor="conditionName">
              <Input id="conditionName" value={conditionForm.conditionName} onChange={(e) => setConditionForm((f) => ({ ...f, conditionName: e.target.value }))} />
            </FormField>
            <FormField label="ICD code" htmlFor="icdCode">
              <Input id="icdCode" value={conditionForm.icdCode} onChange={(e) => setConditionForm((f) => ({ ...f, icdCode: e.target.value }))} />
            </FormField>
            <FormField label="Diagnosed date" htmlFor="diagnosedDate">
              <Input id="diagnosedDate" type="date" value={conditionForm.diagnosedDate} onChange={(e) => setConditionForm((f) => ({ ...f, diagnosedDate: e.target.value }))} />
            </FormField>
            <FormField label="Status" htmlFor="conditionStatus">
              <Select
                id="conditionStatus"
                value={conditionForm.status}
                options={CONDITION_STATUS_OPTIONS}
                onChange={(e) => setConditionForm((f) => ({ ...f, status: e.target.value }))}
              />
            </FormField>
            <FormField label="Notes" htmlFor="conditionNotes" className="md:col-span-2">
              <Input id="conditionNotes" value={conditionForm.notes} onChange={(e) => setConditionForm((f) => ({ ...f, notes: e.target.value }))} />
            </FormField>
            <div className="flex items-end">
              <Button type="submit" disabled={addingCondition}>
                {addingCondition ? "Saving..." : "Add condition"}
              </Button>
            </div>
          </form>
        )}
        <div className="mt-4">
          <DataTable columns={conditionColumns} data={conditions} emptyTitle="No conditions" emptyDescription="No conditions recorded." />
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Documents</h2>
        {canUploadDocuments && (
          <form onSubmit={onUploadDocument} className="mt-4 grid gap-3 md:grid-cols-3">
            <FormField label="Title" htmlFor="docTitle">
              <Input id="docTitle" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Optional title" />
            </FormField>
            <FormField label="File" htmlFor="docFile">
              <Input id="docFile" type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
            </FormField>
            <div className="flex items-end">
              <Button type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload document"}
              </Button>
            </div>
          </form>
        )}
        {documents.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No documents on file.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{doc.title || "Untitled document"}</p>
                  <p className="text-sm text-slate-600">
                    {formatDate(doc.created_at)} • {formatSize(doc.size_bytes)}
                  </p>
                </div>
                {doc.file_url ? (
                  <Button variant="secondary" size="sm" as="a" href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1.5 h-4 w-4" />
                    Open
                  </Button>
                ) : (
                  <span className="text-sm text-slate-500">Unavailable</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default PatientHealthRecordsPanel
