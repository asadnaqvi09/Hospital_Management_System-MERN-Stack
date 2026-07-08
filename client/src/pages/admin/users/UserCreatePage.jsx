import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useCreateUserMutation } from "@/api/users.api"
import { ROLE_VALUES } from "@/constants/roles"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import FormField from "@/components/forms/FormField"
import Select from "@/components/ui/Select"
import { parseApiError } from "@/utils/parseApiError"
export default function UserCreatePage() {
  return <CreateUser />
}

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7).max(20).optional().or(z.literal("")),
  password: z.string().min(8, "Minimum 8 characters"),
  role: z.enum(ROLE_VALUES)
})

function CreateUser() {
  const navigate = useNavigate()
  const [createUser, { isLoading }] = useCreateUserMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", role: "receptionist" }
  })

  const onSubmit = async (values) => {
    try {
      const res = await createUser({ ...values, phone: values.phone || undefined }).unwrap()
      toast.success(res?.message || "User created")
      const id = res?.data?.user?.id
      navigate(id ? `/admin/users/${id}` : "/admin/users")
    } catch (err) {
      setError("root", { message: parseApiError(err?.data || err) })
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Create User</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
              <Input id="fullName" {...register("fullName")} error={Boolean(errors.fullName)} />
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" {...register("email")} error={Boolean(errors.email)} />
            </FormField>
            <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" {...register("phone")} error={Boolean(errors.phone)} />
            </FormField>
            <FormField label="Role" htmlFor="role" error={errors.role?.message}>
              <Select
                id="role"
                options={ROLE_VALUES.map((r) => ({ label: r.replace("_", " "), value: r }))}
                error={Boolean(errors.role)}
                {...register("role")}
              />
            </FormField>
            <FormField label="Temporary password" htmlFor="password" error={errors.password?.message} className="md:col-span-2">
              <Input id="password" type="password" {...register("password")} error={Boolean(errors.password)} />
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create user"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
