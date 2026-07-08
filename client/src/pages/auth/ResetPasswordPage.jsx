import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { useResetPasswordMutation } from "@/api/auth.api"
import { parseApiError } from "@/utils/parseApiError"
import { ROUTES } from "@/constants/routes"
import FormField from "@/components/forms/FormField"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  otp: z.string().min(6, "Enter the 6-digit code").max(8, "Invalid code"),
  newPassword: z.string().min(8, "Minimum 8 characters")
})

export default function ResetPasswordPage() {
  const [resetPassword, { isLoading }] = useResetPasswordMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: "", otp: "", newPassword: "" } })

  const onSubmit = async (values) => {
    try {
      const result = await resetPassword(values).unwrap()
      toast.success(result?.message || "Password reset successfully")
    } catch (err) {
      setError("root", { message: parseApiError(err?.data || err) })
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-slate-900">Reset password</h1>
        <p className="mt-1 text-sm text-slate-500">Enter the code sent to your email</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register("email")} error={Boolean(errors.email)} />
        </FormField>
        <FormField label="Reset code" htmlFor="otp" error={errors.otp?.message}>
          <Input id="otp" inputMode="numeric" autoComplete="one-time-code" {...register("otp")} error={Boolean(errors.otp)} />
        </FormField>
        <FormField label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
          <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} error={Boolean(errors.newPassword)} />
        </FormField>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Updating..." : "Reset password"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link to={ROUTES.LOGIN} className="text-teal-600 hover:text-teal-700">
          Back to login
        </Link>
      </p>
    </div>
  )
}
