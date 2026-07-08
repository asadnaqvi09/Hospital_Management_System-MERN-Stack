import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useVerifyTwoFactorMutation } from "@/api/auth.api"
import { setCredentials } from "@/store/authSlice"
import { ROLE_DEFAULT_ROUTES } from "@/constants/routes"
import { parseApiError } from "@/utils/parseApiError"
import FormField from "@/components/forms/FormField"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"

const schema = z.object({
  code: z.string().min(6, "Enter the 6-digit code").max(8, "Invalid code")
})

export default function TwoFactorPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [verifyTwoFactor, { isLoading }] = useVerifyTwoFactorMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm({ resolver: zodResolver(schema), defaultValues: { code: "" } })

  const onSubmit = async ({ code }) => {
    const twoFactorToken = localStorage.getItem("twoFactorToken")
    if (!twoFactorToken) {
      setError("root", { message: "Two-factor session expired. Please login again." })
      return
    }
    try {
      const result = await verifyTwoFactor({ twoFactorToken, code }).unwrap()
      const payload = result.data || result
      const tokens = payload.tokens || payload
      dispatch(setCredentials({ user: payload.user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }))
      localStorage.removeItem("twoFactorToken")
      localStorage.removeItem("twoFactorEmail")
      const role = payload.user?.role
      toast.success("Login successful")
      navigate(ROLE_DEFAULT_ROUTES[role] || "/")
    } catch (err) {
      setError("root", { message: parseApiError(err?.data || err) })
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-slate-900">Two-factor verification</h1>
        <p className="mt-1 text-sm text-slate-500">Enter the code from your authenticator app</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
        <FormField label="Code" htmlFor="code" error={errors.code?.message}>
          <Input id="code" inputMode="numeric" autoComplete="one-time-code" {...register("code")} error={Boolean(errors.code)} />
        </FormField>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Verifying..." : "Verify"}
        </Button>
      </form>
    </div>
  )
}
