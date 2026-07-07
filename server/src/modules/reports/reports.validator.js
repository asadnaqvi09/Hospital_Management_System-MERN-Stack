import { z } from "zod"

const dateRangeQuery = {
  fromDate: z.string().date().optional(),
  toDate: z.string().date().optional()
}

export const reportDateRangeSchema = z.object({
  query: z.object(dateRangeQuery)
})

export const reportTypeSchema = z.object({
  params: z.object({
    reportType: z.enum([
      "revenue",
      "patient-volume",
      "doctor-performance",
      "appointment-analytics",
      "bed-occupancy"
    ])
  }),
  query: z.object(dateRangeQuery)
})

export const exportIdSchema = z.object({
  params: z.object({
    exportId: z.string().uuid()
  })
})

export const pdfExportSchema = z.object({
  params: z.object({
    reportType: z.enum([
      "revenue",
      "patient-volume",
      "doctor-performance",
      "appointment-analytics",
      "bed-occupancy"
    ])
  }),
  body: z.object(dateRangeQuery)
})
