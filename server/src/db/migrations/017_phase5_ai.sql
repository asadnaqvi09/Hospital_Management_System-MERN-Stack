ALTER TABLE ai_symptom_sessions
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed'));

CREATE INDEX IF NOT EXISTS idx_ai_symptom_patient ON ai_symptom_sessions(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_symptom_status ON ai_symptom_sessions(status);
