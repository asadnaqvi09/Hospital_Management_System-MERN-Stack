import { z } from "zod"

export const createMedicineSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    genericName: z.string().max(120).optional(),
    category: z.string().max(60).optional(),
    unit: z.string().max(20).optional(),
    stockQuantity: z.number().int().min(0).optional(),
    reorderLevel: z.number().int().min(0).optional(),
    purchasePrice: z.number().min(0).optional(),
    salePrice: z.number().min(0).optional(),
    supplier: z.string().max(120).optional()
  })
})

export const medicineIdSchema = z.object({
  params: z.object({
    medicineId: z.string().uuid()
  })
})

export const updateMedicineSchema = z.object({
  params: z.object({
    medicineId: z.string().uuid()
  }),
  body: z.object({
    name: z.string().min(1).max(120).optional(),
    genericName: z.string().max(120).optional(),
    category: z.string().max(60).optional(),
    unit: z.string().max(20).optional(),
    reorderLevel: z.number().int().min(0).optional(),
    purchasePrice: z.number().min(0).optional(),
    salePrice: z.number().min(0).optional(),
    supplier: z.string().max(120).optional()
  })
})

export const listMedicinesSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    lowStockOnly: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
})

export const receiveBatchSchema = z.object({
  params: z.object({
    medicineId: z.string().uuid()
  }),
  body: z.object({
    batchNumber: z.string().min(1).max(50),
    quantity: z.number().int().min(1),
    expiryDate: z.string().date()
  })
})

export const expiryAlertsSchema = z.object({
  query: z.object({
    days: z.coerce.number().int().min(1).max(365).optional()
  })
})
