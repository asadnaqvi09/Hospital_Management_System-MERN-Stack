import ComingSoonPanel from "@/components/feedback/ComingSoonPanel"
import { DOCTOR_ROUTES } from "@/constants/routes"

export default function DoctorDrugInteractionPage() {
  return (
    <ComingSoonPanel
      title="AI drug interaction checker"
      description="Inline interaction warnings during prescribing will be enabled in a future release. Pharmacists can use the live interaction tool in the pharmacy module."
      backHref={DOCTOR_ROUTES.DASHBOARD}
      backLabel="Back to dashboard"
    />
  )
}
