import { Link } from "react-router-dom"
import { useGetMyDoctorProfileQuery } from "@/api/doctors.api"
import DoctorScheduleEditor from "@/components/domain/DoctorScheduleEditor"
import PageLoader from "@/components/feedback/PageLoader"
import ErrorState from "@/components/ui/ErrorState"
import Button from "@/components/ui/Button"
import { DOCTOR_ROUTES } from "@/constants/routes"

export default function MySchedulePage() {
  const { data, isLoading, error, refetch } = useGetMyDoctorProfileQuery()
  const doctorId = data?.data?.doctor?.id

  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error?.data || error} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" as={Link} to={DOCTOR_ROUTES.LEAVES}>
          Manage leaves
        </Button>
      </div>
      <DoctorScheduleEditor
        doctorId={doctorId}
        title="My schedule"
        description="Set your weekly availability for appointments."
      />
    </div>
  )
}
