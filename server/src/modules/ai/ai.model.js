import { pool } from "../../shared/config/db.js"

const SESSION_COLUMNS = `id, patient_id, symptoms_input, ai_response, suggested_department, urgency_level,
  led_to_appointment, status, created_at`

export const insertSymptomSession = async ({ patientId, symptomsInput }) => {
  const result = await pool.query(
    `INSERT INTO ai_symptom_sessions (patient_id, symptoms_input, ai_response, status)
     VALUES ($1, $2, '', 'pending')
     RETURNING ${SESSION_COLUMNS}`,
    [patientId, symptomsInput]
  )
  return result.rows[0]
}

export const findSymptomSessionById = async (sessionId) => {
  const result = await pool.query(`SELECT ${SESSION_COLUMNS} FROM ai_symptom_sessions WHERE id = $1`, [sessionId])
  return result.rows[0] || null
}

export const listSymptomSessions = async ({ patientId, limit, offset }) => {
  const result = await pool.query(
    `SELECT ${SESSION_COLUMNS} FROM ai_symptom_sessions
     WHERE patient_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [patientId, limit, offset]
  )
  return result.rows
}

export const countSymptomSessions = async (patientId) => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS total FROM ai_symptom_sessions WHERE patient_id = $1`,
    [patientId]
  )
  return result.rows[0].total
}

export const updateSymptomSession = async (sessionId, fields) => {
  const mapping = {
    aiResponse: "ai_response",
    suggestedDepartment: "suggested_department",
    urgencyLevel: "urgency_level",
    ledToAppointment: "led_to_appointment",
    status: "status"
  }
  const setClauses = []
  const values = [sessionId]

  for (const [key, column] of Object.entries(mapping)) {
    if (fields[key] !== undefined) {
      values.push(fields[key])
      setClauses.push(`${column} = $${values.length}`)
    }
  }

  if (setClauses.length === 0) {
    return findSymptomSessionById(sessionId)
  }

  const result = await pool.query(
    `UPDATE ai_symptom_sessions SET ${setClauses.join(", ")} WHERE id = $1 RETURNING ${SESSION_COLUMNS}`,
    values
  )
  return result.rows[0] || null
}

export const getTodayHistorySummary = async (patientId) => {
  const result = await pool.query(
    `SELECT * FROM ai_history_summaries
     WHERE patient_id = $1 AND DATE(generated_at) = CURRENT_DATE
     ORDER BY generated_at DESC
     LIMIT 1`,
    [patientId]
  )
  return result.rows[0] || null
}

export const insertHistorySummary = async ({ patientId, generatedBy, summaryText, dataRange }) => {
  const result = await pool.query(
    `INSERT INTO ai_history_summaries (patient_id, generated_by, summary_text, data_range)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [patientId, generatedBy, summaryText, dataRange || "12 months"]
  )
  return result.rows[0]
}

export const getPatientTwelveMonthHistory = async (patientId) => {
  const since = "NOW() - INTERVAL '12 months'"
  const [
    patient,
    allergies,
    conditions,
    vitals,
    appointments,
    consultations,
    prescriptions,
    labOrders,
    admissions
  ] = await Promise.all([
    pool.query(`SELECT full_name, mrn, gender, blood_group, date_of_birth FROM patients WHERE id = $1`, [patientId]),
    pool.query(
      `SELECT allergen, reaction, severity, created_at FROM patient_allergies
       WHERE patient_id = $1 AND created_at >= ${since}`,
      [patientId]
    ),
    pool.query(
      `SELECT condition_name, status, diagnosed_date, notes, created_at FROM patient_conditions
       WHERE patient_id = $1 AND created_at >= ${since}`,
      [patientId]
    ),
    pool.query(
      `SELECT bp_systolic, bp_diastolic, heart_rate, temperature, spo2, weight_kg, recorded_at
       FROM patient_vitals WHERE patient_id = $1 AND recorded_at >= ${since}
       ORDER BY recorded_at DESC LIMIT 30`,
      [patientId]
    ),
    pool.query(
      `SELECT appointment_date, slot_time, type, status, chief_complaint, no_show_probability, created_at
       FROM appointments WHERE patient_id = $1 AND created_at >= ${since}
       ORDER BY appointment_date DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT chief_complaint, diagnosis_text, management_plan, follow_up_date, created_at
       FROM consultations WHERE patient_id = $1 AND created_at >= ${since}
       ORDER BY created_at DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT pr.status, pr.created_at,
              json_agg(json_build_object('medicine_name', pi.medicine_name, 'dosage', pi.dosage, 'frequency', pi.frequency)) AS items
       FROM prescriptions pr
       LEFT JOIN prescription_items pi ON pi.prescription_id = pr.id
       WHERE pr.patient_id = $1 AND pr.created_at >= ${since}
       GROUP BY pr.id
       ORDER BY pr.created_at DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT lo.status, lo.priority, lo.ordered_at, lo.completed_at,
              json_agg(json_build_object('test', lt.name, 'result', loi.result_value, 'is_critical', loi.is_critical)) AS items
       FROM lab_orders lo
       LEFT JOIN lab_order_items loi ON loi.lab_order_id = lo.id
       LEFT JOIN lab_tests lt ON lt.id = loi.test_id
       WHERE lo.patient_id = $1 AND lo.ordered_at >= ${since}
       GROUP BY lo.id
       ORDER BY lo.ordered_at DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT admission_date, discharge_date, status, admission_reason
       FROM admissions WHERE patient_id = $1 AND created_at >= ${since}
       ORDER BY admission_date DESC`,
      [patientId]
    )
  ])

  return {
    patient: patient.rows[0] || null,
    allergies: allergies.rows,
    conditions: conditions.rows,
    vitals: vitals.rows,
    appointments: appointments.rows,
    consultations: consultations.rows,
    prescriptions: prescriptions.rows,
    labOrders: labOrders.rows,
    admissions: admissions.rows
  }
}

export const updateAppointmentNoShowProbability = async (appointmentId, probability) => {
  const result = await pool.query(
    `UPDATE appointments SET no_show_probability = $2 WHERE id = $1 RETURNING *`,
    [appointmentId, probability]
  )
  return result.rows[0] || null
}

export const listUpcomingAppointmentsForScoring = async ({ daysAhead = 14, limit = 200 }) => {
  const result = await pool.query(
    `SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.slot_time, a.type, a.status,
            a.chief_complaint, a.booking_source, a.no_show_probability,
            p.full_name AS patient_name
     FROM appointments a
     LEFT JOIN patients p ON p.id = a.patient_id
     WHERE a.status IN ('scheduled', 'confirmed')
       AND a.appointment_date BETWEEN CURRENT_DATE AND CURRENT_DATE + make_interval(days => $1)
     ORDER BY a.appointment_date ASC, a.slot_time ASC
     LIMIT $2`,
    [daysAhead, limit]
  )
  return result.rows
}

export const getPatientNoShowStats = async (patientId) => {
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'no_show')::int AS no_show_count,
       COUNT(*) FILTER (WHERE status IN ('completed','checked_in','in_consultation'))::int AS attended_count,
       COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_count,
       COUNT(*)::int AS total_count
     FROM appointments
     WHERE patient_id = $1
       AND appointment_date >= CURRENT_DATE - INTERVAL '24 months'`,
    [patientId]
  )
  return result.rows[0]
}
