import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { QRCodeCanvas } from "qrcode.react"
import { useEnableTwoFactorMutation, useMeQuery, useSetupTwoFactorMutation } from "@/api/auth.api"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import FormField from "@/components/forms/FormField"
import Input from "@/components/ui/Input"
import { parseApiError } from "@/utils/parseApiError"
export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Security</h1>
      <TwoFactorCard />
    </div>
  )
}

const enableSchema = z.object({ code: z.string().min(6, "Enter the 6-digit code").max(8, "Invalid code") })

function TwoFactorCard() {
  const { data: meData, isLoading: meLoading, error: meError, refetch } = useMeQuery()
  const user = meData?.data?.user || meData?.user || meData
  const [setupTwoFactor, { isLoading: isSettingUp }] = useSetupTwoFactorMutation()
  const [enableTwoFactor, { isLoading: isEnabling }] = useEnableTwoFactorMutation()
  const [setup, setSetup] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset
  } = useForm({ resolver: zodResolver(enableSchema), defaultValues: { code: "" } })

  if (meLoading) return <PageLoader />
  if (meError) return <ErrorState error={meError?.data || meError} onRetry={refetch} />

  const onSetup = async () => {
    try {
      const res = await setupTwoFactor().unwrap()
      const payload = res.data || res
      setSetup(payload)
      toast.success(payload.message || "Two-factor setup started")
    } catch (err) {
      toast.error(parseApiError(err?.data || err))
    }
  }

  const onEnable = async ({ code }) => {
    try {
      const res = await enableTwoFactor({ code }).unwrap()
      toast.success(res?.message || "Two-factor enabled")
      setSetup(null)
      reset()
      refetch()
    } catch (err) {
      setError("root", { message: parseApiError(err?.data || err) })
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Two-factor authentication</h2>
          <p className="mt-1 text-sm text-slate-600">
            Status: <span className="font-medium text-slate-900">{user?.twoFactorEnabled ? "Enabled" : "Disabled"}</span>
          </p>
        </div>
        {!user?.twoFactorEnabled && (
          <Button variant="secondary" onClick={onSetup} disabled={isSettingUp}>
            {isSettingUp ? "Starting..." : "Start setup"}
          </Button>
        )}
      </div>
      {!user?.twoFactorEnabled && setup && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-900">Scan QR code</p>
            <div className="mt-3 inline-flex rounded-lg border border-slate-200 bg-white p-3">
              <QRCodeCanvas value={setup.otpauthUrl} size={200} includeMargin />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-900">Enable with a code</p>
            <form onSubmit={handleSubmit(onEnable)} className="mt-3 space-y-3">
              {errors.root?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div>}
              <FormField label="Code" htmlFor="code" error={errors.code?.message}>
                <Input id="code" inputMode="numeric" autoComplete="one-time-code" {...register("code")} error={Boolean(errors.code)} />
              </FormField>
              <Button type="submit" disabled={isEnabling} className="w-full">
                {isEnabling ? "Enabling..." : "Enable 2FA"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
