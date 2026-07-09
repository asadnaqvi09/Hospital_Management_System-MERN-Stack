import { ROLES } from "@/constants/roles"
import DoctorDashboardPage from "@/pages/doctor/DoctorDashboardPage"
import MySchedulePage from "@/pages/doctor/schedule/MySchedulePage"
import MyLeavesPage from "@/pages/doctor/schedule/MyLeavesPage"
import MyAppointmentsPage from "@/pages/doctor/appointments/MyAppointmentsPage"
import MyQueuePage from "@/pages/doctor/appointments/MyQueuePage"
import ConsultationListPage from "@/pages/doctor/consultations/ConsultationListPage"
import ConsultationCreatePage from "@/pages/doctor/consultations/ConsultationCreatePage"
import ConsultationEditorPage from "@/pages/doctor/consultations/ConsultationEditorPage"
import PrescriptionListPage from "@/pages/doctor/prescriptions/PrescriptionListPage"
import PrescriptionCreatePage from "@/pages/doctor/prescriptions/PrescriptionCreatePage"
import PrescriptionDetailPage from "@/pages/doctor/prescriptions/PrescriptionDetailPage"
import LabOrderCreatePage from "@/pages/doctor/lab/LabOrderCreatePage"
import LabOrdersListPage from "@/pages/doctor/lab/LabOrdersListPage"
import DoctorAdmissionsListPage from "@/pages/doctor/ipd/AdmissionsListPage"
import AdmissionDetailPage from "@/pages/doctor/ipd/AdmissionDetailPage"
import DoctorDrugInteractionPage from "@/pages/doctor/tools/DrugInteractionPage"
import NoShowPredictionPage from "@/pages/doctor/tools/NoShowPredictionPage"
import PatientListPage from "@/pages/shared/patients/PatientListPage"
import PatientDetailPage from "@/pages/shared/patients/PatientDetailPage"
import PatientEmrPage from "@/pages/shared/patients/PatientEmrPage"
export const doctorRoutes = {
  path: "doctor",
  children: [
    { index: true, element: <DoctorDashboardPage /> },
    { path: "queue", element: <MyQueuePage /> },
    { path: "appointments", element: <MyAppointmentsPage /> },
    { path: "consultations", element: <ConsultationListPage /> },
    { path: "consultations/new", element: <ConsultationCreatePage /> },
    { path: "consultations/:id", element: <ConsultationEditorPage /> },
    { path: "patients", element: <PatientListPage /> },
    { path: "patients/:id", element: <PatientDetailPage /> },
    { path: "patients/:id/emr", element: <PatientEmrPage /> },
    { path: "prescriptions", element: <PrescriptionListPage /> },
    { path: "prescriptions/new", element: <PrescriptionCreatePage /> },
    { path: "prescriptions/:id", element: <PrescriptionDetailPage /> },
    { path: "lab", element: <LabOrdersListPage /> },
    { path: "lab/new", element: <LabOrderCreatePage /> },
    { path: "ipd", element: <DoctorAdmissionsListPage /> },
    { path: "ipd/:id", element: <AdmissionDetailPage /> },
    { path: "schedule", element: <MySchedulePage /> },
    { path: "schedule/leaves", element: <MyLeavesPage /> },
    { path: "tools/interactions", element: <DoctorDrugInteractionPage /> },
    { path: "tools/no-show", element: <NoShowPredictionPage /> }
  ],
  meta: { roles: [ROLES.DOCTOR] }
}
