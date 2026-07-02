CREATE TABLE IF NOT EXISTS ai_symptom_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  symptoms_input TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  suggested_department VARCHAR(80),
  urgency_level VARCHAR(20) CHECK (urgency_level IN ('routine','urgent','emergency')),
  led_to_appointment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_history_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  generated_by UUID REFERENCES users(id),
  summary_text TEXT NOT NULL,
  data_range VARCHAR(50),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_summary_patient_day ON ai_history_summaries(patient_id, DATE(generated_at));
