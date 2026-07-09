import { pool } from "../../shared/config/db.js"

export const refreshMaterializedViews = async () => {
  await pool.query(`SELECT refresh_report_materialized_views()`)
}

export const getRevenueReport = async ({ fromDate, toDate }) => {
  const result = await pool.query(
    `SELECT report_date, method, payment_count, total_amount
     FROM mv_daily_revenue
     WHERE report_date BETWEEN $1 AND $2
     ORDER BY report_date DESC, method ASC`,
    [fromDate, toDate]
  )
  return result.rows
}

export const getRevenueSummary = async ({ fromDate, toDate }) => {
  const result = await pool.query(
    `SELECT
       COALESCE(SUM(total_amount), 0)::numeric(14,2) AS total_revenue,
       COALESCE(SUM(payment_count), 0)::int AS total_payments
     FROM mv_daily_revenue
     WHERE report_date BETWEEN $1 AND $2`,
    [fromDate, toDate]
  )
  return result.rows[0]
}

export const getPatientVolumeReport = async ({ fromDate, toDate }) => {
  const result = await pool.query(
    `SELECT report_date, new_patients
     FROM mv_patient_registrations
     WHERE report_date BETWEEN $1 AND $2
     ORDER BY report_date DESC`,
    [fromDate, toDate]
  )
  return result.rows
}

export const getPatientVolumeSummary = async ({ fromDate, toDate }) => {
  const result = await pool.query(
    `SELECT COALESCE(SUM(new_patients), 0)::int AS total_new_patients
     FROM mv_patient_registrations
     WHERE report_date BETWEEN $1 AND $2`,
    [fromDate, toDate]
  )
  return result.rows[0]
}

export const getDoctorPerformanceReport = async () => {
  const result = await pool.query(
    `SELECT doctor_id, doctor_name, department, completed_appointments, no_show_count,
            consultation_count, revenue_generated
     FROM mv_doctor_performance
     ORDER BY completed_appointments DESC, consultation_count DESC`
  )
  return result.rows
}

export const getAppointmentAnalyticsReport = async ({ fromDate, toDate }) => {
  const result = await pool.query(
    `SELECT report_date, status, type, appointment_count, avg_no_show_probability
     FROM mv_appointment_analytics
     WHERE report_date BETWEEN $1 AND $2
     ORDER BY report_date DESC, status ASC`,
    [fromDate, toDate]
  )
  return result.rows
}

export const getAppointmentAnalyticsSummary = async ({ fromDate, toDate }) => {
  const result = await pool.query(
    `SELECT
       COALESCE(SUM(appointment_count), 0)::int AS total_appointments,
       COALESCE(SUM(appointment_count) FILTER (WHERE status = 'completed'), 0)::int AS completed,
       COALESCE(SUM(appointment_count) FILTER (WHERE status = 'cancelled'), 0)::int AS cancelled,
       COALESCE(SUM(appointment_count) FILTER (WHERE status = 'no_show'), 0)::int AS no_shows
     FROM mv_appointment_analytics
     WHERE report_date BETWEEN $1 AND $2`,
    [fromDate, toDate]
  )
  return result.rows[0]
}

export const getBedOccupancyReport = async () => {
  const result = await pool.query(
    `SELECT room_id, room_number, ward, floor, capacity, daily_rate, room_status,
            active_admissions, available_beds, occupancy_rate
     FROM mv_bed_occupancy
     ORDER BY ward ASC, room_number ASC`
  )
  return result.rows
}

export const getLabTurnaroundReport = async ({ fromDate, toDate }) => {
  const result = await pool.query(
    `SELECT
       DATE(ordered_at) AS report_date,
       priority,
       COUNT(*)::int AS order_count,
       ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - ordered_at)) / 3600)::numeric, 2) AS avg_turnaround_hours,
       ROUND(MIN(EXTRACT(EPOCH FROM (completed_at - ordered_at)) / 3600)::numeric, 2) AS min_turnaround_hours,
       ROUND(MAX(EXTRACT(EPOCH FROM (completed_at - ordered_at)) / 3600)::numeric, 2) AS max_turnaround_hours
     FROM lab_orders
     WHERE status = 'completed'
       AND completed_at IS NOT NULL
       AND ordered_at::date BETWEEN $1 AND $2
     GROUP BY DATE(ordered_at), priority
     ORDER BY report_date DESC, priority ASC`,
    [fromDate, toDate]
  )
  return result.rows
}

export const getLabTurnaroundSummary = async ({ fromDate, toDate }) => {
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS total_completed,
       ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - ordered_at)) / 3600)::numeric, 2) AS avg_turnaround_hours,
       ROUND(MIN(EXTRACT(EPOCH FROM (completed_at - ordered_at)) / 3600)::numeric, 2) AS min_turnaround_hours,
       ROUND(MAX(EXTRACT(EPOCH FROM (completed_at - ordered_at)) / 3600)::numeric, 2) AS max_turnaround_hours
     FROM lab_orders
     WHERE status = 'completed'
       AND completed_at IS NOT NULL
       AND ordered_at::date BETWEEN $1 AND $2`,
    [fromDate, toDate]
  )
  return result.rows[0]
}

export const getPharmacyReport = async ({ fromDate, toDate }) => {
  const result = await pool.query(
    `SELECT
       DATE(md.dispensed_at) AS report_date,
       COUNT(md.id)::int AS dispense_count,
       COUNT(DISTINCT md.prescription_id)::int AS prescription_count,
       COALESCE(SUM(pi.quantity), 0)::int AS items_dispensed
     FROM medicine_dispensing md
     LEFT JOIN prescription_items pi ON pi.prescription_id = md.prescription_id
     WHERE md.dispensed_at::date BETWEEN $1 AND $2
     GROUP BY DATE(md.dispensed_at)
     ORDER BY report_date DESC`,
    [fromDate, toDate]
  )
  return result.rows
}

export const getPharmacySummary = async ({ fromDate, toDate }) => {
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS total_dispenses,
       COUNT(DISTINCT prescription_id)::int AS total_prescriptions
     FROM medicine_dispensing
     WHERE dispensed_at::date BETWEEN $1 AND $2`,
    [fromDate, toDate]
  )
  const items = await pool.query(
    `SELECT COALESCE(SUM(pi.quantity), 0)::int AS total_items_dispensed
     FROM medicine_dispensing md
     JOIN prescription_items pi ON pi.prescription_id = md.prescription_id
     WHERE md.dispensed_at::date BETWEEN $1 AND $2`,
    [fromDate, toDate]
  )
  return { ...result.rows[0], ...items.rows[0] }
}

export const getBedOccupancySummary = async () => {
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS total_rooms,
       COALESCE(SUM(capacity), 0)::int AS total_beds,
       COALESCE(SUM(active_admissions), 0)::int AS occupied_beds,
       CASE
         WHEN COALESCE(SUM(capacity), 0) > 0
         THEN ROUND((COALESCE(SUM(active_admissions), 0)::numeric / SUM(capacity)) * 100, 1)
         ELSE 0
       END AS overall_occupancy_rate
     FROM mv_bed_occupancy`
  )
  return result.rows[0]
}

export const insertReportExport = async ({ reportType, format, params, createdBy }) => {
  const result = await pool.query(
    `INSERT INTO report_exports (report_type, format, params, created_by, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING *`,
    [reportType, format, params || null, createdBy]
  )
  return result.rows[0]
}

export const findReportExportById = async (exportId) => {
  const result = await pool.query(`SELECT * FROM report_exports WHERE id = $1`, [exportId])
  return result.rows[0] || null
}

export const updateReportExport = async (exportId, fields) => {
  const mapping = {
    fileUrl: "file_url",
    status: "status",
    completedAt: "completed_at"
  }
  const setClauses = []
  const values = [exportId]

  for (const [key, column] of Object.entries(mapping)) {
    if (fields[key] !== undefined) {
      values.push(fields[key])
      setClauses.push(`${column} = $${values.length}`)
    }
  }

  if (setClauses.length === 0) {
    return findReportExportById(exportId)
  }

  const result = await pool.query(
    `UPDATE report_exports SET ${setClauses.join(", ")} WHERE id = $1 RETURNING *`,
    values
  )
  return result.rows[0] || null
}

export const getReportExportContext = async (exportId) => {
  const exportRecord = await findReportExportById(exportId)
  if (!exportRecord) {
    return null
  }
  const params = exportRecord.params || {}
  const fromDate = params.fromDate
  const toDate = params.toDate
  const reportType = exportRecord.report_type

  const loaders = {
    revenue: async () => ({
      rows: await getRevenueReport({ fromDate, toDate }),
      summary: await getRevenueSummary({ fromDate, toDate })
    }),
    "patient-volume": async () => ({
      rows: await getPatientVolumeReport({ fromDate, toDate }),
      summary: await getPatientVolumeSummary({ fromDate, toDate })
    }),
    "doctor-performance": async () => ({
      rows: await getDoctorPerformanceReport(),
      summary: null
    }),
    "appointment-analytics": async () => ({
      rows: await getAppointmentAnalyticsReport({ fromDate, toDate }),
      summary: await getAppointmentAnalyticsSummary({ fromDate, toDate })
    }),
    "bed-occupancy": async () => ({
      rows: await getBedOccupancyReport(),
      summary: await getBedOccupancySummary()
    }),
    "lab-turnaround": async () => ({
      rows: await getLabTurnaroundReport({ fromDate, toDate }),
      summary: await getLabTurnaroundSummary({ fromDate, toDate })
    }),
    pharmacy: async () => ({
      rows: await getPharmacyReport({ fromDate, toDate }),
      summary: await getPharmacySummary({ fromDate, toDate })
    })
  }

  const loader = loaders[reportType]
  if (!loader) {
    return null
  }

  const data = await loader()
  return { exportRecord, ...data, reportType, params }
}
