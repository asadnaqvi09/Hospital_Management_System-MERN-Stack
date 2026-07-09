import { ROLES } from "@/constants/roles"
import PharmacistDashboardPage from "@/pages/pharmacist/PharmacistDashboardPage"
import PendingPrescriptionsPage from "@/pages/pharmacist/prescriptions/PendingPrescriptionsPage"
import DispensePrescriptionPage from "@/pages/pharmacist/prescriptions/DispensePrescriptionPage"
import PrescriptionHistoryPage from "@/pages/pharmacist/prescriptions/PrescriptionHistoryPage"
import MedicinesListPage from "@/pages/pharmacist/inventory/MedicinesListPage"
import MedicineDetailPage from "@/pages/pharmacist/inventory/MedicineDetailPage"
import ReceiveBatchPage from "@/pages/pharmacist/inventory/ReceiveBatchPage"
import ReorderAlertsPage from "@/pages/pharmacist/alerts/ReorderAlertsPage"
import ExpiryAlertsPage from "@/pages/pharmacist/alerts/ExpiryAlertsPage"
import PharmacistDrugInteractionPage from "@/pages/pharmacist/tools/DrugInteractionPage"
export const pharmacistRoutes = {
  path: "pharmacy",
  children: [
    { index: true, element: <PharmacistDashboardPage /> },
    { path: "pending", element: <PendingPrescriptionsPage /> },
    { path: "prescriptions", element: <PrescriptionHistoryPage /> },
    { path: "prescriptions/:id/dispense", element: <DispensePrescriptionPage /> },
    { path: "inventory", element: <MedicinesListPage /> },
    { path: "inventory/receive", element: <ReceiveBatchPage /> },
    { path: "inventory/:id", element: <MedicineDetailPage /> },
    { path: "alerts/reorder", element: <ReorderAlertsPage /> },
    { path: "alerts/expiry", element: <ExpiryAlertsPage /> },
    { path: "tools/interactions", element: <PharmacistDrugInteractionPage /> }
  ],
  meta: { roles: [ROLES.PHARMACIST] }
}
