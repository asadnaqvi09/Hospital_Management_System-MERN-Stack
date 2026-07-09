import { ROLES } from "@/constants/roles"
import PatientDashboardPage from "@/pages/patient/PatientDashboardPage"
import BookAppointmentPage from "@/pages/patient/appointments/BookAppointmentPage"
import PatientMyAppointmentsPage from "@/pages/patient/appointments/MyAppointmentsPage"
import PatientAppointmentDetailPage from "@/pages/patient/appointments/AppointmentDetailPage"
import MyEmrPage from "@/pages/patient/health/MyEmrPage"
import MyVitalsPage from "@/pages/patient/health/MyVitalsPage"
import MyDocumentsPage from "@/pages/patient/health/MyDocumentsPage"
import MyAllergiesPage from "@/pages/patient/health/MyAllergiesPage"
import MyPrescriptionsPage from "@/pages/patient/prescriptions/MyPrescriptionsPage"
import MyLabReportsPage from "@/pages/patient/lab/MyLabReportsPage"
import LabReportDetailPage from "@/pages/patient/lab/LabReportDetailPage"
import MyInvoicesPage from "@/pages/patient/billing/MyInvoicesPage"
import MyAdmissionsPage from "@/pages/patient/ipd/MyAdmissionsPage"
import SymptomCheckPage from "@/pages/patient/ai/SymptomCheckPage"
import SymptomResultPage from "@/pages/patient/ai/SymptomResultPage"
export const patientRoutes = {
  path: "patient",
  children: [
    { index: true, element: <PatientDashboardPage /> },
    { path: "appointments/book", element: <BookAppointmentPage /> },
    { path: "appointments", element: <PatientMyAppointmentsPage /> },
    { path: "appointments/:id", element: <PatientAppointmentDetailPage /> },
    { path: "emr", element: <MyEmrPage /> },
    { path: "vitals", element: <MyVitalsPage /> },
    { path: "documents", element: <MyDocumentsPage /> },
    { path: "allergies", element: <MyAllergiesPage /> },
    { path: "prescriptions", element: <MyPrescriptionsPage /> },
    { path: "lab", element: <MyLabReportsPage /> },
    { path: "lab/:id", element: <LabReportDetailPage /> },
    { path: "billing", element: <MyInvoicesPage /> },
    { path: "admissions", element: <MyAdmissionsPage /> },
    { path: "symptom-check", element: <SymptomCheckPage /> },
    { path: "symptom-check/:id", element: <SymptomResultPage /> }
  ],
  meta: { roles: [ROLES.PATIENT] }
}
