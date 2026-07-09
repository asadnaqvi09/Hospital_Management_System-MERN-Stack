import ComingSoonPanel from "@/components/feedback/ComingSoonPanel"
import { PATIENT_ROUTES } from "@/constants/routes"

export default function SymptomCheckPage() {
  return (
    <ComingSoonPanel
      title="AI symptom checker"
      description="Pre-appointment triage will suggest the right department and urgency level."
      backHref={PATIENT_ROUTES.DASHBOARD}
      backLabel="Back to dashboard"
    />
  )
}
