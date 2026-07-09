import { useGetMyPatientProfileQuery } from "@/api/patients.api"

export function usePatientScope() {
  const query = useGetMyPatientProfileQuery()
  const patient = query.data?.data?.patient
  return {
    ...query,
    patient,
    patientId: patient?.id
  }
}
