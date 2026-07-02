CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID UNIQUE REFERENCES appointments(id),
  doctor_id UUID REFERENCES doctors(id),
  patient_id UUID REFERENCES patients(id),
  chief_complaint TEXT,
  hopi TEXT,
  examination TEXT,
  diagnosis_text TEXT,
  management_plan TEXT,
  follow_up_date DATE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  locked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  icd_code VARCHAR(20),
  description TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'primary' CHECK (type IN ('primary','secondary','differential'))
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id),
  doctor_id UUID REFERENCES doctors(id),
  patient_id UUID REFERENCES patients(id),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','dispensed','partially_dispensed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_name VARCHAR(120) NOT NULL,
  generic_name VARCHAR(120),
  dosage VARCHAR(50),
  frequency VARCHAR(50),
  duration VARCHAR(50),
  instructions TEXT,
  quantity SMALLINT
);
