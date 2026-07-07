CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_role ON audit_logs(user_role, created_at DESC);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_revenue AS
SELECT
  DATE(py.paid_at) AS report_date,
  py.method,
  COUNT(*)::int AS payment_count,
  COALESCE(SUM(py.amount), 0)::numeric(14,2) AS total_amount
FROM payments py
GROUP BY DATE(py.paid_at), py.method;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_revenue ON mv_daily_revenue(report_date, method);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_patient_registrations AS
SELECT
  DATE(created_at) AS report_date,
  COUNT(*)::int AS new_patients
FROM patients
GROUP BY DATE(created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_patient_registrations ON mv_patient_registrations(report_date);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_doctor_performance AS
SELECT
  d.id AS doctor_id,
  u.full_name AS doctor_name,
  d.department,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed')::int AS completed_appointments,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'no_show')::int AS no_show_count,
  COUNT(DISTINCT c.id)::int AS consultation_count,
  COALESCE(SUM(i.total) FILTER (WHERE i.status IN ('fully_paid','partially_paid')), 0)::numeric(14,2) AS revenue_generated
FROM doctors d
JOIN users u ON u.id = d.user_id
LEFT JOIN appointments a ON a.doctor_id = d.id
LEFT JOIN consultations c ON c.doctor_id = d.id
LEFT JOIN invoices i ON i.consultation_id = c.id
GROUP BY d.id, u.full_name, d.department;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_doctor_performance ON mv_doctor_performance(doctor_id);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_appointment_analytics AS
SELECT
  appointment_date AS report_date,
  status,
  type,
  COUNT(*)::int AS appointment_count,
  ROUND(AVG(no_show_probability) FILTER (WHERE no_show_probability IS NOT NULL))::int AS avg_no_show_probability
FROM appointments
GROUP BY appointment_date, status, type;

CREATE INDEX IF NOT EXISTS idx_mv_appointment_analytics ON mv_appointment_analytics(report_date, status);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_bed_occupancy AS
SELECT
  r.id AS room_id,
  r.room_number,
  r.ward,
  r.floor,
  r.capacity,
  r.daily_rate,
  r.status AS room_status,
  COALESCE(occ.active_admissions, 0)::int AS active_admissions,
  GREATEST(r.capacity - COALESCE(occ.active_admissions, 0), 0)::int AS available_beds,
  CASE
    WHEN r.capacity > 0 THEN ROUND((COALESCE(occ.active_admissions, 0)::numeric / r.capacity) * 100, 1)
    ELSE 0
  END AS occupancy_rate
FROM rooms r
LEFT JOIN (
  SELECT room_id, COUNT(*)::int AS active_admissions
  FROM admissions
  WHERE status = 'admitted'
  GROUP BY room_id
) occ ON occ.room_id = r.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_bed_occupancy ON mv_bed_occupancy(room_id);

CREATE TABLE IF NOT EXISTS report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) NOT NULL,
  format VARCHAR(10) NOT NULL CHECK (format IN ('pdf','csv')),
  file_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  params JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_report_exports_user ON report_exports(created_by, created_at DESC);

CREATE OR REPLACE FUNCTION refresh_report_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_patient_registrations;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_doctor_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_appointment_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_bed_occupancy;
END;
$$;

REFRESH MATERIALIZED VIEW mv_daily_revenue;
REFRESH MATERIALIZED VIEW mv_patient_registrations;
REFRESH MATERIALIZED VIEW mv_doctor_performance;
REFRESH MATERIALIZED VIEW mv_appointment_analytics;
REFRESH MATERIALIZED VIEW mv_bed_occupancy;
