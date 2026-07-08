import { ROLES } from "@/constants/roles"
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage"
import UserListPage from "@/pages/admin/users/UserListPage"
import UserCreatePage from "@/pages/admin/users/UserCreatePage"
import UserDetailPage from "@/pages/admin/users/UserDetailPage"
import DoctorListPage from "@/pages/admin/doctors/DoctorListPage"
import DoctorCreatePage from "@/pages/admin/doctors/DoctorCreatePage"
import DoctorDetailPage from "@/pages/admin/doctors/DoctorDetailPage"
import DoctorSchedulePage from "@/pages/admin/doctors/DoctorSchedulePage"
import LabTestsPage from "@/pages/admin/catalog/LabTestsPage"
import MedicinesCatalogPage from "@/pages/admin/catalog/MedicinesCatalogPage"
import RoomsManagementPage from "@/pages/admin/ipd/RoomsManagementPage"
import ReportsHubPage from "@/pages/admin/reports/ReportsHubPage"
import RevenueReportPage from "@/pages/admin/reports/RevenueReportPage"
import PatientVolumeReportPage from "@/pages/admin/reports/PatientVolumeReportPage"
import DoctorPerformanceReportPage from "@/pages/admin/reports/DoctorPerformanceReportPage"
import AppointmentAnalyticsPage from "@/pages/admin/reports/AppointmentAnalyticsPage"
import BedOccupancyReportPage from "@/pages/admin/reports/BedOccupancyReportPage"
import AuditLogListPage from "@/pages/admin/audit/AuditLogListPage"
import AuditLogDetailPage from "@/pages/admin/audit/AuditLogDetailPage"
export const adminRoutes = {
  path: "admin",
  children: [
    { index: true, element: <AdminDashboardPage /> },
    { path: "users", element: <UserListPage /> },
    { path: "users/new", element: <UserCreatePage /> },
    { path: "users/:id", element: <UserDetailPage /> },
    { path: "doctors", element: <DoctorListPage /> },
    { path: "doctors/new", element: <DoctorCreatePage /> },
    { path: "doctors/:id", element: <DoctorDetailPage /> },
    { path: "doctors/:id/schedule", element: <DoctorSchedulePage /> },
    { path: "catalog/lab-tests", element: <LabTestsPage /> },
    { path: "catalog/medicines", element: <MedicinesCatalogPage /> },
    { path: "ipd/rooms", element: <RoomsManagementPage /> },
    { path: "reports", element: <ReportsHubPage /> },
    { path: "reports/revenue", element: <RevenueReportPage /> },
    { path: "reports/patient-volume", element: <PatientVolumeReportPage /> },
    { path: "reports/doctor-performance", element: <DoctorPerformanceReportPage /> },
    { path: "reports/appointments", element: <AppointmentAnalyticsPage /> },
    { path: "reports/bed-occupancy", element: <BedOccupancyReportPage /> },
    { path: "audit", element: <AuditLogListPage /> },
    { path: "audit/:id", element: <AuditLogDetailPage /> }
  ],
  meta: { roles: [ROLES.ADMIN] }
}
