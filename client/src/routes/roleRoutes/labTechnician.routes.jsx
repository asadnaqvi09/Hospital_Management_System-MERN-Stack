import { ROLES } from "@/constants/roles"
import LabDashboardPage from "@/pages/lab-technician/LabDashboardPage"
import LabOrdersQueuePage from "@/pages/lab-technician/orders/LabOrdersQueuePage"
import LabOrderDetailPage from "@/pages/lab-technician/orders/LabOrderDetailPage"
import EnterResultsPage from "@/pages/lab-technician/orders/EnterResultsPage"
import LabTestsCatalogPage from "@/pages/lab-technician/tests/LabTestsCatalogPage"
import PatientEmrPage from "@/pages/shared/patients/PatientEmrPage"
export const labTechnicianRoutes = {
  path: "lab",
  children: [
    { index: true, element: <LabDashboardPage /> },
    { path: "orders", element: <LabOrdersQueuePage /> },
    { path: "orders/:id", element: <LabOrderDetailPage /> },
    { path: "orders/:id/results", element: <EnterResultsPage /> },
    { path: "tests", element: <LabTestsCatalogPage /> },
    { path: "patients/:id/emr", element: <PatientEmrPage /> }
  ],
  meta: { roles: [ROLES.LAB_TECHNICIAN] }
}
