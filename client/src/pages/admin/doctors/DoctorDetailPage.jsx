import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { useGetDoctorQuery, useUpdateDoctorMutation } from "@/api/doctors.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Input from "@/components/ui/Input"
import FormField from "@/components/forms/FormField"
import { parseApiError } from "@/utils/parseApiError"

const schema = z.object({
  specialization: z.string().min(2, "Specialization is required"),
  qualification: z.string().optional().or(z.literal("")),
  experienceYears: z.coerce.number().int().min(0).max(80).optional(),
  licenseNumber: z.string().optional().or(z.literal("")),
  consultationFee: z.coerce.number().min(0).optional(),
  department: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal(""))
})

export default function DoctorDetailPage() {
  return <DoctorDetail />
}

function DoctorDetail() {
  const { id } = useParams()
  const { data, isLoading, error, refetch } = useGetDoctorQuery(id)
  const [updateDoctor, { isLoading: isUpdating }] = useUpdateDoctorMutation()
  const [openEdit, setOpenEdit] = useState(false)
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />
  const doctor = data?.data?.doctor || data?.doctor || data
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{doctor?.full_name || doctor?.fullName || "Doctor"}</h1>
          <p className="mt-1 text-sm text-slate-600">{doctor?.specialization || "-"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setOpenEdit(true)}>
            Edit profile
          </Button>
          <Button variant="secondary" as={Link} to={`/admin/doctors/${doctor.id}/schedule`}>
            Manage schedule
          </Button>
          <Button variant="secondary" as={Link} to="/admin/doctors">
            Back
          </Button>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Department</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{doctor?.department || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Fee</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{doctor?.consultation_fee ?? doctor?.consultationFee ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Experience</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{doctor?.experience_years ?? doctor?.experienceYears ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">License</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{doctor?.license_number ?? doctor?.licenseNumber ?? "-"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Qualification</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{doctor?.qualification || "-"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Bio</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{doctor?.bio || "-"}</p>
          </div>
        </div>
      </div>
      <EditDoctorModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        doctor={doctor}
        isUpdating={isUpdating}
        onSave={async (values) => {
          try {
            await updateDoctor({ id: doctor.id, ...values }).unwrap()
            toast.success("Doctor updated")
            setOpenEdit(false)
          } catch (err) {
            toast.error(parseApiError(err?.data || err))
          }
        }}
      />
    </div>
  )
}

function EditDoctorModal({ open, onClose, doctor, isUpdating, onSave }) {
  const defaults = useMemo(
    () => ({
      specialization: doctor?.specialization || "",
      qualification: doctor?.qualification || "",
      experienceYears: doctor?.experience_years ?? doctor?.experienceYears ?? "",
      licenseNumber: doctor?.license_number ?? doctor?.licenseNumber ?? "",
      consultationFee: doctor?.consultation_fee ?? doctor?.consultationFee ?? "",
      department: doctor?.department || "",
      bio: doctor?.bio || ""
    }),
    [doctor]
  )
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    values: defaults
  })
  const submit = (values) => {
    onSave({
      specialization: values.specialization,
      qualification: values.qualification || undefined,
      experienceYears: values.experienceYears === "" ? undefined : values.experienceYears,
      licenseNumber: values.licenseNumber || undefined,
      consultationFee: values.consultationFee === "" ? undefined : values.consultationFee,
      department: values.department || undefined,
      bio: values.bio || undefined
    })
  }
  return (
    <Modal open={open} onClose={onClose} title="Edit doctor profile">
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Specialization" htmlFor="specialization" error={errors.specialization?.message}>
            <Input id="specialization" {...register("specialization")} error={Boolean(errors.specialization)} />
          </FormField>
          <FormField label="Department" htmlFor="department" error={errors.department?.message}>
            <Input id="department" {...register("department")} error={Boolean(errors.department)} />
          </FormField>
          <FormField label="Consultation fee" htmlFor="consultationFee" error={errors.consultationFee?.message}>
            <Input id="consultationFee" inputMode="decimal" {...register("consultationFee")} error={Boolean(errors.consultationFee)} />
          </FormField>
          <FormField label="Experience years" htmlFor="experienceYears" error={errors.experienceYears?.message}>
            <Input id="experienceYears" inputMode="numeric" {...register("experienceYears")} error={Boolean(errors.experienceYears)} />
          </FormField>
          <FormField label="Qualification" htmlFor="qualification" error={errors.qualification?.message}>
            <Input id="qualification" {...register("qualification")} error={Boolean(errors.qualification)} />
          </FormField>
          <FormField label="License number" htmlFor="licenseNumber" error={errors.licenseNumber?.message}>
            <Input id="licenseNumber" {...register("licenseNumber")} error={Boolean(errors.licenseNumber)} />
          </FormField>
          <FormField label="Bio" htmlFor="bio" error={errors.bio?.message} className="md:col-span-2">
            <Input id="bio" {...register("bio")} error={Boolean(errors.bio)} />
          </FormField>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
