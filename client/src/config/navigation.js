export const NAVIGATION = {
  admin: [
    { label: "Dashboard", path: "/admin", icon: "LayoutDashboard" },
    { label: "Users", path: "/admin/users", icon: "Users" },
    { label: "Doctors", path: "/admin/doctors", icon: "Stethoscope" },
    { label: "Lab Tests", path: "/admin/catalog/lab-tests", icon: "FlaskConical" },
    { label: "Medicines", path: "/admin/catalog/medicines", icon: "Pill" },
    { label: "IPD Rooms", path: "/admin/ipd/rooms", icon: "Bed" },
    { label: "Reports", path: "/admin/reports", icon: "BarChart3" },
    { label: "Audit Logs", path: "/admin/audit", icon: "Shield" }
  ],
  receptionist: [
    { label: "Dashboard", path: "/reception", icon: "LayoutDashboard" },
    { label: "Patients", path: "/reception/patients", icon: "Users" },
    { label: "Appointments", path: "/reception/appointments", icon: "Calendar" },
    { label: "Queue", path: "/reception/queue", icon: "ListOrdered" },
    { label: "IPD", path: "/reception/ipd", icon: "Bed" },
    { label: "Billing", path: "/reception/billing", icon: "Receipt" }
  ],
  doctor: [
    { label: "Dashboard", path: "/doctor", icon: "LayoutDashboard" },
    { label: "My Queue", path: "/doctor/queue", icon: "ListOrdered" },
    { label: "Appointments", path: "/doctor/appointments", icon: "Calendar" },
    { label: "Consultations", path: "/doctor/consultations", icon: "FileText" },
    { label: "Patients / EMR", path: "/doctor/patients", icon: "Users" },
    { label: "Prescriptions", path: "/doctor/prescriptions", icon: "Pill" },
    { label: "Lab Orders", path: "/doctor/lab", icon: "FlaskConical" },
    { label: "IPD", path: "/doctor/ipd", icon: "Bed" },
    { label: "Schedule", path: "/doctor/schedule", icon: "Clock" },
    { label: "Drug Interactions", path: "/doctor/tools/interactions", icon: "AlertTriangle", badge: "AI — Coming Soon" },
    { label: "No-Show Predict", path: "/doctor/tools/no-show", icon: "Brain", badge: "AI — Coming Soon" }
  ],
  nurse: [
    { label: "Dashboard", path: "/nurse", icon: "LayoutDashboard" },
    { label: "Queue", path: "/nurse/queue", icon: "ListOrdered" },
    { label: "Patients", path: "/nurse/patients", icon: "Users" },
    { label: "Record Vitals", path: "/nurse/vitals", icon: "Activity" },
    { label: "IPD Admissions", path: "/nurse/ipd", icon: "Bed" }
  ],
  pharmacist: [
    { label: "Dashboard", path: "/pharmacy", icon: "LayoutDashboard" },
    { label: "Pending Rx", path: "/pharmacy/pending", icon: "ClipboardList" },
    { label: "Prescriptions", path: "/pharmacy/prescriptions", icon: "Pill" },
    { label: "Inventory", path: "/pharmacy/inventory", icon: "Package" },
    { label: "Reorder Alerts", path: "/pharmacy/alerts/reorder", icon: "AlertCircle" },
    { label: "Expiry Alerts", path: "/pharmacy/alerts/expiry", icon: "Timer" },
    { label: "Drug Interactions", path: "/pharmacy/tools/interactions", icon: "AlertTriangle" }
  ],
  lab_technician: [
    { label: "Dashboard", path: "/lab", icon: "LayoutDashboard" },
    { label: "Orders Queue", path: "/lab/orders", icon: "FlaskConical" },
    { label: "Test Catalog", path: "/lab/tests", icon: "BookOpen" }
  ],
  patient: [
    { label: "Dashboard", path: "/patient", icon: "LayoutDashboard" },
    { label: "Book Appointment", path: "/patient/appointments/book", icon: "CalendarPlus" },
    { label: "My Appointments", path: "/patient/appointments", icon: "Calendar" },
    { label: "My Health / EMR", path: "/patient/emr", icon: "Heart" },
    { label: "Vitals", path: "/patient/vitals", icon: "Activity" },
    { label: "Allergies", path: "/patient/allergies", icon: "AlertCircle" },
    { label: "Documents", path: "/patient/documents", icon: "FileText" },
    { label: "Prescriptions", path: "/patient/prescriptions", icon: "Pill" },
    { label: "Lab Reports", path: "/patient/lab", icon: "FlaskConical" },
    { label: "Bills", path: "/patient/billing", icon: "Receipt" },
    { label: "Admissions", path: "/patient/admissions", icon: "Bed" },
    { label: "Symptom Check", path: "/patient/symptom-check", icon: "Brain", badge: "AI — Coming Soon" }
  ]
}
