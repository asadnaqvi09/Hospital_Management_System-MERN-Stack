import ComingSoonPanel from "@/components/feedback/ComingSoonPanel"
import { PATIENT_ROUTES } from "@/constants/routes"

export default function SymptomResultPage() {
  return (
    <ComingSoonPanel
      title="AI triage results"
      description="Saved symptom sessions and department recommendations will appear here when the feature launches."
      backHref={PATIENT_ROUTES.SYMPTOM_CHECK}
      backLabel="Back to symptom check"
    />
  )
}
