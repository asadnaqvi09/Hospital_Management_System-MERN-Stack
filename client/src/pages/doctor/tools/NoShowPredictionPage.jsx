import ComingSoonPanel from "@/components/feedback/ComingSoonPanel"
import { DOCTOR_ROUTES } from "@/constants/routes"

export default function NoShowPredictionPage() {
  return (
    <ComingSoonPanel
      title="AI no-show predictor"
      description="Risk scores and proactive reminders for high-risk appointments will be available in a future release."
      backHref={DOCTOR_ROUTES.APPOINTMENTS}
      backLabel="Back to appointments"
    />
  )
}
