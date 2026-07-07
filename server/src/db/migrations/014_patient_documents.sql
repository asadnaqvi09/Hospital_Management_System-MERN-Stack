CREATE SEQUENCE IF NOT EXISTS patient_mrn_seq START 1000;

CREATE TABLE IF NOT EXISTS patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  title VARCHAR(160),
  file_key TEXT NOT NULL,
  file_url TEXT,
  content_type VARCHAR(100),
  size_bytes INT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_documents_patient ON patient_documents(patient_id);
