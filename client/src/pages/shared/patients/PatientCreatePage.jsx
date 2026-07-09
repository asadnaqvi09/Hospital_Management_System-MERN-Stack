import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useCreatePatientMutation } from "@/api/patients.api"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import FormField from "@/components/forms/FormField"
import { parseApiError } from "@/utils/parseApiError"
export default function PatientCreatePage() {
  return <CreatePatient />
}
const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  cnic: z.string().min(5, "Enter a valid CNIC").max(15, "Enter a valid CNIC").optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other"]).optional().or(z.literal("")),
  bloodGroup: z.string().max(5, "Max 5 characters").optional().or(z.literal("")),
  phone: z.string().min(7, "Phone is required").max(20, "Enter a valid phone"),
  address: z.string().optional().or(z.literal("")),
  emergencyContactName: z.string().max(80, "Max 80 characters").optional().or(z.literal("")),
  emergencyContactPhone: z.string().max(20, "Max 20 characters").optional().or(z.literal("")),
  userId: z.string().uuid("Enter a valid userId UUID").optional().or(z.literal(""))
})
function CreatePatient() {
  const navigate = useNavigate()
  const [createPatient, { isLoading }] = useCreatePatientMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      cnic: "",
      dateOfBirth: "",
      gender: "",
      bloodGroup: "",
      phone: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      userId: ""
    }
  })
  const onSubmit = async (values) => {
    try {
      const payload = {
        fullName: values.fullName,
        phone: values.phone,
        cnic: values.cnic || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        gender: values.gender || undefined,
        bloodGroup: values.bloodGroup || undefined,
        address: values.address || undefined,
        emergencyContactName: values.emergencyContactName || undefined,
        emergencyContactPhone: values.emergencyContactPhone || undefined,
        userId: values.userId || undefined
      }
      const res = await createPatient(payload).unwrap()
      toast.success(res?.message || "Patient created")
      const id = res?.data?.patient?.id
      navigate(id ? `/reception/patients/${id}` : "/reception/patients")
    } catch (error) {
      const message = parseApiError(error?.data || error)
      console.error("createPatient failed", { error })
      setError("root", { message })
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Create Patient</h1>
        <Button variant="secondary" as="a" href="/reception/patients">
          Back
        </Button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
              <Input id="fullName" {...register("fullName")} error={Boolean(errors.fullName)} />
            </FormField>
            <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" {...register("phone")} error={Boolean(errors.phone)} />
            </FormField>
            <FormField label="CNIC" htmlFor="cnic" error={errors.cnic?.message}>
              <Input id="cnic" {...register("cnic")} error={Boolean(errors.cnic)} />
            </FormField>
            <FormField label="Date of birth" htmlFor="dateOfBirth" error={errors.dateOfBirth?.message}>
              <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} error={Boolean(errors.dateOfBirth)} />
            </FormField>
            <FormField label="Gender" htmlFor="gender" error={errors.gender?.message}>
              <Select
                id="gender"
                {...register("gender")}
                error={Boolean(errors.gender)}
                options={[
                  { value: "", label: "Select..." },
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" }
                ]}
              />
            </FormField>
            <FormField label="Blood group" htmlFor="bloodGroup" error={errors.bloodGroup?.message}>
              <Input id="bloodGroup" {...register("bloodGroup")} error={Boolean(errors.bloodGroup)} />
            </FormField>
            <FormField label="Address" htmlFor="address" error={errors.address?.message} className="md:col-span-2">
              <Input id="address" {...register("address")} error={Boolean(errors.address)} />
            </FormField>
            <FormField label="Emergency contact name" htmlFor="emergencyContactName" error={errors.emergencyContactName?.message}>
              <Input id="emergencyContactName" {...register("emergencyContactName")} error={Boolean(errors.emergencyContactName)} />
            </FormField>
            <FormField label="Emergency contact phone" htmlFor="emergencyContactPhone" error={errors.emergencyContactPhone?.message}>
              <Input id="emergencyContactPhone" {...register("emergencyContactPhone")} error={Boolean(errors.emergencyContactPhone)} />
            </FormField>
            <FormField label="Linked userId (optional)" htmlFor="userId" error={errors.userId?.message} className="md:col-span-2">
              <Input id="userId" {...register("userId")} error={Boolean(errors.userId)} />
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create patient"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
