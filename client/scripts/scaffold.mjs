import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(__dirname, "..", "src")
function write(filePath, content) {
  const full = path.join(src, filePath)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function page(name) {
  return `export default function ${name}() {\n  return null\n}\n`
}
function namedPage(name) {
  return `export function ${name}() {\n  return null\n}\nexport default ${name}\n`
}
function component(name) {
  return `export function ${name}() {\n  return null\n}\nexport default ${name}\n`
}
const pages = [
  ["pages/auth/LoginPage.jsx", "LoginPage"],
  ["pages/auth/TwoFactorPage.jsx", "TwoFactorPage"],
  ["pages/auth/ForgotPasswordPage.jsx", "ForgotPasswordPage"],
  ["pages/auth/ResetPasswordPage.jsx", "ResetPasswordPage"],
  ["pages/auth/ProfilePage.jsx", "ProfilePage"],
  ["pages/auth/SecurityPage.jsx", "SecurityPage"],
  ["pages/auth/SessionsPage.jsx", "SessionsPage"],
  ["pages/shared/NotificationsPage.jsx", "NotificationsPage"],
  ["pages/shared/NotFoundPage.jsx", "NotFoundPage"],
  ["pages/shared/UnauthorizedPage.jsx", "UnauthorizedPage"],
  ["pages/shared/patients/PatientListPage.jsx", "PatientListPage"],
  ["pages/shared/patients/PatientDetailPage.jsx", "PatientDetailPage"],
  ["pages/shared/patients/PatientCreatePage.jsx", "PatientCreatePage"],
  ["pages/shared/patients/PatientEmrPage.jsx", "PatientEmrPage"],
  ["pages/admin/AdminDashboardPage.jsx", "AdminDashboardPage"],
  ["pages/admin/users/UserListPage.jsx", "UserListPage"],
  ["pages/admin/users/UserCreatePage.jsx", "UserCreatePage"],
  ["pages/admin/users/UserDetailPage.jsx", "UserDetailPage"],
  ["pages/admin/doctors/DoctorListPage.jsx", "DoctorListPage"],
  ["pages/admin/doctors/DoctorCreatePage.jsx", "DoctorCreatePage"],
  ["pages/admin/doctors/DoctorDetailPage.jsx", "DoctorDetailPage"],
  ["pages/admin/doctors/DoctorSchedulePage.jsx", "DoctorSchedulePage"],
  ["pages/admin/catalog/LabTestsPage.jsx", "LabTestsPage"],
  ["pages/admin/catalog/MedicinesCatalogPage.jsx", "MedicinesCatalogPage"],
  ["pages/admin/ipd/RoomsManagementPage.jsx", "RoomsManagementPage"],
  ["pages/admin/reports/ReportsHubPage.jsx", "ReportsHubPage"],
  ["pages/admin/reports/RevenueReportPage.jsx", "RevenueReportPage"],
  ["pages/admin/reports/PatientVolumeReportPage.jsx", "PatientVolumeReportPage"],
  ["pages/admin/reports/DoctorPerformanceReportPage.jsx", "DoctorPerformanceReportPage"],
  ["pages/admin/reports/AppointmentAnalyticsPage.jsx", "AppointmentAnalyticsPage"],
  ["pages/admin/reports/BedOccupancyReportPage.jsx", "BedOccupancyReportPage"],
  ["pages/admin/audit/AuditLogListPage.jsx", "AuditLogListPage"],
  ["pages/admin/audit/AuditLogDetailPage.jsx", "AuditLogDetailPage"],
  ["pages/receptionist/ReceptionDashboardPage.jsx", "ReceptionDashboardPage"],
  ["pages/receptionist/appointments/AppointmentListPage.jsx", "AppointmentListPage"],
  ["pages/receptionist/appointments/AppointmentCreatePage.jsx", "AppointmentCreatePage"],
  ["pages/receptionist/appointments/AppointmentDetailPage.jsx", "AppointmentDetailPage"],
  ["pages/receptionist/appointments/QueueBoardPage.jsx", "QueueBoardPage"],
  ["pages/receptionist/ipd/RoomsOverviewPage.jsx", "RoomsOverviewPage"],
  ["pages/receptionist/ipd/AdmissionCreatePage.jsx", "AdmissionCreatePage"],
  ["pages/receptionist/ipd/AdmissionsListPage.jsx", "AdmissionsListPage"],
  ["pages/receptionist/billing/InvoiceGeneratePage.jsx", "InvoiceGeneratePage"],
  ["pages/receptionist/billing/InvoiceListPage.jsx", "InvoiceListPage"],
  ["pages/receptionist/billing/InvoiceDetailPage.jsx", "InvoiceDetailPage"],
  ["pages/doctor/DoctorDashboardPage.jsx", "DoctorDashboardPage"],
  ["pages/doctor/schedule/MySchedulePage.jsx", "MySchedulePage"],
  ["pages/doctor/schedule/MyLeavesPage.jsx", "MyLeavesPage"],
  ["pages/doctor/appointments/MyAppointmentsPage.jsx", "MyAppointmentsPage"],
  ["pages/doctor/appointments/MyQueuePage.jsx", "MyQueuePage"],
  ["pages/doctor/consultations/ConsultationListPage.jsx", "ConsultationListPage"],
  ["pages/doctor/consultations/ConsultationCreatePage.jsx", "ConsultationCreatePage"],
  ["pages/doctor/consultations/ConsultationEditorPage.jsx", "ConsultationEditorPage"],
  ["pages/doctor/prescriptions/PrescriptionCreatePage.jsx", "PrescriptionCreatePage"],
  ["pages/doctor/prescriptions/PrescriptionDetailPage.jsx", "PrescriptionDetailPage"],
  ["pages/doctor/lab/LabOrderCreatePage.jsx", "LabOrderCreatePage"],
  ["pages/doctor/lab/LabOrdersListPage.jsx", "LabOrdersListPage"],
  ["pages/doctor/ipd/AdmissionsListPage.jsx", "DoctorAdmissionsListPage"],
  ["pages/doctor/ipd/AdmissionDetailPage.jsx", "AdmissionDetailPage"],
  ["pages/doctor/tools/DrugInteractionPage.jsx", "DoctorDrugInteractionPage"],
  ["pages/doctor/tools/NoShowPredictionPage.jsx", "NoShowPredictionPage"],
  ["pages/nurse/NurseDashboardPage.jsx", "NurseDashboardPage"],
  ["pages/nurse/QueuePage.jsx", "QueuePage"],
  ["pages/nurse/vitals/RecordVitalsPage.jsx", "RecordVitalsPage"],
  ["pages/nurse/vitals/VitalsHistoryPage.jsx", "VitalsHistoryPage"],
  ["pages/nurse/ipd/AdmissionsListPage.jsx", "NurseAdmissionsListPage"],
  ["pages/nurse/ipd/AdmissionNotesPage.jsx", "AdmissionNotesPage"],
  ["pages/pharmacist/PharmacistDashboardPage.jsx", "PharmacistDashboardPage"],
  ["pages/pharmacist/prescriptions/PendingPrescriptionsPage.jsx", "PendingPrescriptionsPage"],
  ["pages/pharmacist/prescriptions/DispensePrescriptionPage.jsx", "DispensePrescriptionPage"],
  ["pages/pharmacist/prescriptions/PrescriptionHistoryPage.jsx", "PrescriptionHistoryPage"],
  ["pages/pharmacist/inventory/MedicinesListPage.jsx", "MedicinesListPage"],
  ["pages/pharmacist/inventory/MedicineDetailPage.jsx", "MedicineDetailPage"],
  ["pages/pharmacist/inventory/ReceiveBatchPage.jsx", "ReceiveBatchPage"],
  ["pages/pharmacist/alerts/ReorderAlertsPage.jsx", "ReorderAlertsPage"],
  ["pages/pharmacist/alerts/ExpiryAlertsPage.jsx", "ExpiryAlertsPage"],
  ["pages/pharmacist/tools/DrugInteractionPage.jsx", "PharmacistDrugInteractionPage"],
  ["pages/lab-technician/LabDashboardPage.jsx", "LabDashboardPage"],
  ["pages/lab-technician/orders/LabOrdersQueuePage.jsx", "LabOrdersQueuePage"],
  ["pages/lab-technician/orders/LabOrderDetailPage.jsx", "LabOrderDetailPage"],
  ["pages/lab-technician/orders/EnterResultsPage.jsx", "EnterResultsPage"],
  ["pages/lab-technician/tests/LabTestsCatalogPage.jsx", "LabTestsCatalogPage"],
  ["pages/patient/PatientDashboardPage.jsx", "PatientDashboardPage"],
  ["pages/patient/appointments/BookAppointmentPage.jsx", "BookAppointmentPage"],
  ["pages/patient/appointments/MyAppointmentsPage.jsx", "PatientMyAppointmentsPage"],
  ["pages/patient/appointments/AppointmentDetailPage.jsx", "PatientAppointmentDetailPage"],
  ["pages/patient/health/MyEmrPage.jsx", "MyEmrPage"],
  ["pages/patient/health/MyVitalsPage.jsx", "MyVitalsPage"],
  ["pages/patient/health/MyDocumentsPage.jsx", "MyDocumentsPage"],
  ["pages/patient/health/MyAllergiesPage.jsx", "MyAllergiesPage"],
  ["pages/patient/prescriptions/MyPrescriptionsPage.jsx", "MyPrescriptionsPage"],
  ["pages/patient/lab/MyLabReportsPage.jsx", "MyLabReportsPage"],
  ["pages/patient/billing/MyInvoicesPage.jsx", "MyInvoicesPage"],
  ["pages/patient/ipd/MyAdmissionsPage.jsx", "MyAdmissionsPage"],
  ["pages/patient/ai/SymptomCheckPage.jsx", "SymptomCheckPage"],
  ["pages/patient/ai/SymptomResultPage.jsx", "SymptomResultPage"]
]
pages.forEach(([file, name]) => write(file, page(name)))
const uiComponents = [
  "Button", "Input", "Select", "Textarea", "Badge", "Card", "Modal", "Drawer",
  "Tabs", "Table", "Pagination", "Spinner", "EmptyState", "ErrorState", "ConfirmDialog", "DatePicker"
]
uiComponents.forEach((name) => write(`components/ui/${name}.jsx`, component(name)))
const formComponents = ["FormField", "SearchInput", "FileUpload", "StatusSelect"]
formComponents.forEach((name) => write(`components/forms/${name}.jsx`, component(name)))
const dataComponents = ["DataTable", "StatCard", "StatusBadge", "Timeline", "ChartCard"]
dataComponents.forEach((name) => write(`components/data-display/${name}.jsx`, component(name)))
const feedbackComponents = ["ToastProvider", "PageLoader"]
feedbackComponents.forEach((name) => write(`components/feedback/${name}.jsx`, component(name)))
const domainComponents = [
  "PatientSearchBar", "PatientCard", "DoctorSlotPicker", "AppointmentStatusActions",
  "VitalsForm", "PrescriptionItemsForm", "LabTestPicker", "DiagnosisIcdForm",
  "InvoiceItemsTable", "PaymentForm", "NursingNoteForm", "DrugInteractionPanel", "NotificationBell"
]
domainComponents.forEach((name) => write(`components/domain/${name}.jsx`, component(name)))
const apiFiles = [
  "auth", "users", "patients", "doctors", "appointments", "consultations",
  "prescriptions", "medicines", "lab", "ipd", "billing", "notifications",
  "ai", "reports", "audit", "search"
]
apiFiles.forEach((name) => {
  write(`api/${name}.api.js`, `export const ${name}Api = {}\n`)
})
fs.mkdirSync(path.join(src, "assets/images"), { recursive: true })
fs.mkdirSync(path.join(src, "assets/icons"), { recursive: true })
console.log("Scaffold complete")
