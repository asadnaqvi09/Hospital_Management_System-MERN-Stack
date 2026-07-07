import { z } from "zod"
import { INVOICE_STATUS } from "../../shared/constants/statuses.js"

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  category: z.string().max(40).optional(),
  quantity: z.number().min(0.01).optional(),
  unitPrice: z.number().min(0)
})

export const generateInvoiceSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    consultationId: z.string().uuid().optional(),
    admissionId: z.string().uuid().optional(),
    discountAmount: z.number().min(0).optional(),
    discountReason: z.string().optional(),
    taxAmount: z.number().min(0).optional(),
    insuranceProvider: z.string().max(120).optional(),
    insurancePolicy: z.string().max(80).optional(),
    insuranceCovered: z.number().min(0).optional()
  })
})

export const createInvoiceSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    consultationId: z.string().uuid().optional(),
    admissionId: z.string().uuid().optional(),
    items: z.array(invoiceItemSchema).min(1),
    discountAmount: z.number().min(0).optional(),
    discountReason: z.string().optional(),
    taxAmount: z.number().min(0).optional(),
    insuranceProvider: z.string().max(120).optional(),
    insurancePolicy: z.string().max(80).optional(),
    insuranceCovered: z.number().min(0).optional()
  })
})

export const invoiceIdSchema = z.object({
  params: z.object({
    invoiceId: z.string().uuid()
  })
})

export const updateInvoiceSchema = z.object({
  params: z.object({
    invoiceId: z.string().uuid()
  }),
  body: z.object({
    items: z.array(invoiceItemSchema).optional(),
    discountAmount: z.number().min(0).optional(),
    discountReason: z.string().optional(),
    taxAmount: z.number().min(0).optional(),
    insuranceProvider: z.string().max(120).optional(),
    insurancePolicy: z.string().max(80).optional(),
    insuranceCovered: z.number().min(0).optional()
  })
})

export const listInvoicesSchema = z.object({
  query: z.object({
    patientId: z.string().uuid().optional(),
    consultationId: z.string().uuid().optional(),
    admissionId: z.string().uuid().optional(),
    status: z.enum(Object.values(INVOICE_STATUS)).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
})

export const recordPaymentSchema = z.object({
  params: z.object({
    invoiceId: z.string().uuid()
  }),
  body: z.object({
    amount: z.number().min(0.01),
    method: z.enum(["cash", "card", "bank_transfer", "insurance"]),
    reference: z.string().max(120).optional()
  })
})
