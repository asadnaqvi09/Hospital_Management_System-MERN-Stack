import { ROLES } from "@/constants/roles"
import ReceptionDashboardPage from "@/pages/receptionist/ReceptionDashboardPage"
import PatientListPage from "@/pages/shared/patients/PatientListPage"
import PatientDetailPage from "@/pages/shared/patients/PatientDetailPage"
import PatientCreatePage from "@/pages/shared/patients/PatientCreatePage"
import PatientEmrPage from "@/pages/shared/patients/PatientEmrPage"
import AppointmentListPage from "@/pages/receptionist/appointments/AppointmentListPage"
import AppointmentCreatePage from "@/pages/receptionist/appointments/AppointmentCreatePage"
import AppointmentDetailPage from "@/pages/receptionist/appointments/AppointmentDetailPage"
import QueueBoardPage from "@/pages/receptionist/appointments/QueueBoardPage"
import RoomsOverviewPage from "@/pages/receptionist/ipd/RoomsOverviewPage"
import AdmissionCreatePage from "@/pages/receptionist/ipd/AdmissionCreatePage"
import AdmissionsListPage from "@/pages/receptionist/ipd/AdmissionsListPage"
import InvoiceGeneratePage from "@/pages/receptionist/billing/InvoiceGeneratePage"
import InvoiceListPage from "@/pages/receptionist/billing/InvoiceListPage"
import InvoiceDetailPage from "@/pages/receptionist/billing/InvoiceDetailPage"
export const receptionistRoutes = {
  path: "reception",
  children: [
    { index: true, element: <ReceptionDashboardPage /> },
    { path: "patients", element: <PatientListPage /> },
    { path: "patients/new", element: <PatientCreatePage /> },
    { path: "patients/:id", element: <PatientDetailPage /> },
    { path: "patients/:id/emr", element: <PatientEmrPage /> },
    { path: "appointments", element: <AppointmentListPage /> },
    { path: "appointments/new", element: <AppointmentCreatePage /> },
    { path: "appointments/:id", element: <AppointmentDetailPage /> },
    { path: "queue", element: <QueueBoardPage /> },
    { path: "ipd", element: <RoomsOverviewPage /> },
    { path: "ipd/admissions", element: <AdmissionsListPage /> },
    { path: "ipd/admissions/new", element: <AdmissionCreatePage /> },
    { path: "billing", element: <InvoiceListPage /> },
    { path: "billing/new", element: <InvoiceGeneratePage /> },
    { path: "billing/:id", element: <InvoiceDetailPage /> }
  ],
  meta: { roles: [ROLES.RECEPTIONIST] }
}
