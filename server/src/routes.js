import { Router } from "express"
import { authRouter } from "./modules/auth/auth.route.js"
import { usersRouter } from "./modules/users/users.route.js"
import { patientsRouter } from "./modules/patients/patients.route.js"
import { doctorsRouter } from "./modules/doctors/doctors.route.js"
import { appointmentsRouter } from "./modules/appointments/appointments.route.js"
import { consultationsRouter } from "./modules/consultations/consultations.route.js"
import { prescriptionsRouter } from "./modules/pharmacy/pharmacy.route.js"
import { medicinesRouter } from "./modules/pharmacy/medicines.route.js"
import { labRouter } from "./modules/lab/lab.route.js"
import { ipdRouter } from "./modules/ipd/ipd.route.js"
import { billingRouter } from "./modules/billing/billing.route.js"
import { notificationsRouter } from "./modules/notifications/notifications.route.js"
import { aiRouter } from "./modules/ai/ai.route.js"
import { reportsRouter } from "./modules/reports/reports.route.js"
import { auditRouter } from "./modules/audit/audit.route.js"
import { searchRouter } from "./modules/search/search.route.js"

export const apiRouter = Router()

apiRouter.use("/auth", authRouter)
apiRouter.use("/users", usersRouter)
apiRouter.use("/patients", patientsRouter)
apiRouter.use("/doctors", doctorsRouter)
apiRouter.use("/appointments", appointmentsRouter)
apiRouter.use("/consultations", consultationsRouter)
apiRouter.use("/prescriptions", prescriptionsRouter)
apiRouter.use("/medicines", medicinesRouter)
apiRouter.use("/lab", labRouter)
apiRouter.use("/ipd", ipdRouter)
apiRouter.use("/billing", billingRouter)
apiRouter.use("/notifications", notificationsRouter)
apiRouter.use("/ai", aiRouter)
apiRouter.use("/reports", reportsRouter)
apiRouter.use("/audit", auditRouter)
apiRouter.use("/search", searchRouter)