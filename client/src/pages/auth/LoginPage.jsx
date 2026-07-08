import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/hooks/useAuth"
import { parseApiError } from "@/utils/parseApiError"
import { env } from "@/config/env"
import { ROUTES } from "@/constants/routes"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import FormField from "@/components/forms/FormField"

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required")
})

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } })
  const onSubmit = async (values) => {
    try {
      const result = await login(values)
      if (result?.requiresTwoFactor) {
        localStorage.setItem("twoFactorToken", result.twoFactorToken)
        localStorage.setItem("twoFactorEmail", watch("email"))
        window.location.href = ROUTES.TWO_FACTOR
      }
    } catch (err) {
      setError("root", { message: parseApiError(err) })
    }
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">{env.appName}</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register("email")} error={Boolean(errors.email)} />
        </FormField>
        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" {...register("password")} error={Boolean(errors.password)} />
        </FormField>
        <Button type="submit" disabled={isLoggingIn} className="w-full">
          {isLoggingIn ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link to={ROUTES.FORGOT_PASSWORD} className="text-teal-600 hover:text-teal-700">
          Forgot password?
        </Link>
      </p>
    </div>
  )
}
