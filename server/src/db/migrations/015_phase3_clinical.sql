ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS sample_collected_at TIMESTAMPTZ;
ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS collected_by UUID REFERENCES users(id);

ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE patient_vitals ADD COLUMN IF NOT EXISTS admission_id UUID REFERENCES admissions(id);

CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_appointment ON consultations(appointment_id);

CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status, ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);

CREATE INDEX IF NOT EXISTS idx_admissions_patient ON admissions(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_admissions_room ON admissions(room_id, status);

CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

CREATE INDEX IF NOT EXISTS idx_patient_vitals_admission ON patient_vitals(admission_id);
