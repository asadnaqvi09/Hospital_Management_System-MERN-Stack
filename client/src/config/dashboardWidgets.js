export const DASHBOARD_WIDGETS = {
  admin: [
    { id: "total-users", label: "Total Users", type: "stat" },
    { id: "today-revenue", label: "Today's Revenue", type: "stat" },
    { id: "bed-occupancy", label: "Bed Occupancy", type: "chart" },
    { id: "appointment-analytics", label: "Appointment Analytics", type: "chart" },
    { id: "recent-audit", label: "Recent Audit Logs", type: "list" }
  ],
  receptionist: [
    { id: "queue-count", label: "Today's Queue", type: "stat" },
    { id: "pending-checkins", label: "Pending Check-ins", type: "stat" },
    { id: "unpaid-invoices", label: "Unpaid Invoices", type: "stat" },
    { id: "new-patients", label: "New Patients Today", type: "stat" }
  ],
  doctor: [
    { id: "today-appointments", label: "Today's Appointments", type: "stat" },
    { id: "live-queue", label: "Live Queue", type: "list" },
    { id: "pending-consultations", label: "Pending Consultations", type: "stat" },
    { id: "recent-lab", label: "Recent Lab Results", type: "list" }
  ],
  nurse: [
    { id: "queue-board", label: "Queue Board", type: "list" },
    { id: "vitals-needed", label: "Patients Needing Vitals", type: "list" },
    { id: "active-ipd", label: "Active IPD Admissions", type: "stat" }
  ],
  pharmacist: [
    { id: "pending-rx", label: "Pending Prescriptions", type: "stat" },
    { id: "low-stock", label: "Low Stock Alerts", type: "list" },
    { id: "expiring", label: "Expiring Medicines", type: "list" }
  ],
  lab_technician: [
    { id: "orders-status", label: "Orders by Status", type: "chart" },
    { id: "critical-results", label: "Critical Results Pending", type: "stat" }
  ],
  patient: [
    { id: "next-appointment", label: "Next Appointment", type: "card" },
    { id: "unread-notifications", label: "Unread Notifications", type: "stat" },
    { id: "recent-prescriptions", label: "Recent Prescriptions", type: "list" },
    { id: "symptom-check", label: "Symptom Check", type: "cta" }
  ]
}
