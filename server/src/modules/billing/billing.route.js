import { Router } from "express"
import { authenticate } from "../../shared/middlewares/authenticate.js"
import { requireRole } from "../../shared/middlewares/requireRole.js"
import { validate } from "../../shared/middlewares/validate.js"
import { ROLES } from "../../shared/constants/roles.js"
import {
  generateInvoiceSchema,
  createInvoiceSchema,
  invoiceIdSchema,
  updateInvoiceSchema,
  listInvoicesSchema,
  recordPaymentSchema
} from "./billing.validator.js"
import {
  generateInvoice,
  createInvoice,
  getInvoice,
  getInvoices,
  updateInvoiceHandler,
  finalizeInvoice,
  cancelInvoice,
  recordPayment
} from "./billing.controller.js"

export const billingRouter = Router()

billingRouter.use(authenticate)

billingRouter.post(
  "/invoices/generate",
  requireRole(ROLES.RECEPTIONIST, ROLES.ADMIN),
  validate(generateInvoiceSchema),
  generateInvoice
)

billingRouter.post(
  "/invoices",
  requireRole(ROLES.RECEPTIONIST, ROLES.ADMIN),
  validate(createInvoiceSchema),
  createInvoice
)

billingRouter.get(
  "/invoices",
  requireRole(ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT),
  validate(listInvoicesSchema),
  getInvoices
)

billingRouter.get(
  "/invoices/:invoiceId",
  requireRole(ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT),
  validate(invoiceIdSchema),
  getInvoice
)

billingRouter.patch(
  "/invoices/:invoiceId",
  requireRole(ROLES.RECEPTIONIST, ROLES.ADMIN),
  validate(updateInvoiceSchema),
  updateInvoiceHandler
)

billingRouter.post(
  "/invoices/:invoiceId/finalize",
  requireRole(ROLES.RECEPTIONIST, ROLES.ADMIN),
  validate(invoiceIdSchema),
  finalizeInvoice
)

billingRouter.post(
  "/invoices/:invoiceId/cancel",
  requireRole(ROLES.RECEPTIONIST, ROLES.ADMIN),
  validate(invoiceIdSchema),
  cancelInvoice
)

billingRouter.post(
  "/invoices/:invoiceId/payments",
  requireRole(ROLES.RECEPTIONIST, ROLES.ADMIN),
  validate(recordPaymentSchema),
  recordPayment
)
