import { ROLES } from "@/constants/roles"
import NurseDashboardPage from "@/pages/nurse/NurseDashboardPage"
import QueuePage from "@/pages/nurse/QueuePage"
import RecordVitalsPage from "@/pages/nurse/vitals/RecordVitalsPage"
import VitalsHistoryPage from "@/pages/nurse/vitals/VitalsHistoryPage"
import NurseAdmissionsListPage from "@/pages/nurse/ipd/AdmissionsListPage"
import AdmissionNotesPage from "@/pages/nurse/ipd/AdmissionNotesPage"
import PatientListPage from "@/pages/shared/patients/PatientListPage"
import PatientDetailPage from "@/pages/shared/patients/PatientDetailPage"
export const nurseRoutes = {
  path: "nurse",
  children: [
    { index: true, element: <NurseDashboardPage /> },
    { path: "queue", element: <QueuePage /> },
    { path: "patients", element: <PatientListPage /> },
    { path: "patients/:id", element: <PatientDetailPage /> },
    { path: "vitals", element: <RecordVitalsPage /> },
    { path: "vitals/history", element: <VitalsHistoryPage /> },
    { path: "ipd", element: <NurseAdmissionsListPage /> },
    { path: "ipd/:id/notes", element: <AdmissionNotesPage /> }
  ],
  meta: { roles: [ROLES.NURSE] }
}
