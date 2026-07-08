import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import AppProviders from "@/providers/AppProviders"
import App from "@/App"
import "@/index.css"
import "@/api/auth.api"
import "@/api/users.api"
import "@/api/patients.api"
import "@/api/doctors.api"
import "@/api/appointments.api"
import "@/api/consultations.api"
import "@/api/prescriptions.api"
import "@/api/medicines.api"
import "@/api/lab.api"
import "@/api/ipd.api"
import "@/api/billing.api"
import "@/api/notifications.api"
import "@/api/ai.api"
import "@/api/reports.api"
import "@/api/audit.api"
import "@/api/search.api"
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>
)
