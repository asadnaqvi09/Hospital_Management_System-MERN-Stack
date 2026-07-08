import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { useForgotPasswordMutation } from "@/api/auth.api"
import { parseApiError } from "@/utils/parseApiError"
import { ROUTES } from "@/constants/routes"
import FormField from "@/components/forms/FormField"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"

const schema = z.object({
  email: z.string().email("Enter a valid email")
})

export default function ForgotPasswordPage() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: "" } })

  const onSubmit = async ({ email }) => {
    try {
      const result = await forgotPassword({ email }).unwrap()
      toast.success(result?.message || "Reset code sent if account exists")
    } catch (err) {
      setError("root", { message: parseApiError(err?.data || err) })
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-slate-900">Forgot password</h1>
        <p className="mt-1 text-sm text-slate-500">We’ll email you a reset code</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register("email")} error={Boolean(errors.email)} />
        </FormField>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Sending..." : "Send reset code"}
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
