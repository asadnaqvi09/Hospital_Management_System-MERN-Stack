import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useCreateDoctorMutation } from "@/api/doctors.api"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import FormField from "@/components/forms/FormField"
import { parseApiError } from "@/utils/parseApiError"
export default function DoctorCreatePage() {
  return <CreateDoctor />
}

const schema = z.object({
  userId: z.string().uuid("Enter a valid userId UUID"),
  specialization: z.string().min(2, "Specialization is required"),
  qualification: z.string().optional().or(z.literal("")),
  experienceYears: z.coerce.number().int().min(0).max(80).optional(),
  licenseNumber: z.string().optional().or(z.literal("")),
  consultationFee: z.coerce.number().min(0).optional(),
  department: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal(""))
})

function CreateDoctor() {
  const navigate = useNavigate()
  const [createDoctor, { isLoading }] = useCreateDoctorMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      userId: "",
      specialization: "",
      qualification: "",
      experienceYears: "",
      licenseNumber: "",
      consultationFee: "",
      department: "",
      bio: ""
    }
  })

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        qualification: values.qualification || undefined,
        licenseNumber: values.licenseNumber || undefined,
        department: values.department || undefined,
        bio: values.bio || undefined
      }
      const res = await createDoctor(payload).unwrap()
      toast.success(res?.message || "Doctor created")
      const id = res?.data?.doctor?.id
      navigate(id ? `/admin/doctors/${id}` : "/admin/doctors")
    } catch (err) {
      setError("root", { message: parseApiError(err?.data || err) })
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Create Doctor</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Linked userId" htmlFor="userId" error={errors.userId?.message}>
              <Input id="userId" {...register("userId")} error={Boolean(errors.userId)} />
            </FormField>
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
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create doctor"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
