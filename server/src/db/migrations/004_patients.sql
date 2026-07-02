CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  mrn VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  cnic VARCHAR(15) UNIQUE,
  date_of_birth DATE,
  gender VARCHAR(10) CHECK (gender IN ('male','female','other')),
  blood_group VARCHAR(5),
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  emergency_contact_name VARCHAR(80),
  emergency_contact_phone VARCHAR(20),
  registered_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(full_name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

CREATE TABLE IF NOT EXISTS patient_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES users(id),
  appointment_id UUID,
  bp_systolic SMALLINT,
  bp_diastolic SMALLINT,
  heart_rate SMALLINT,
  temperature NUMERIC(4,1),
  weight_kg NUMERIC(5,1),
  height_cm NUMERIC(5,1),
  spo2 SMALLINT,
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  allergen VARCHAR(120) NOT NULL,
  reaction TEXT,
  severity VARCHAR(20) CHECK (severity IN ('mild','moderate','severe')),
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  condition_name VARCHAR(120) NOT NULL,
  icd_code VARCHAR(20),
  diagnosed_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','resolved','chronic')),
  notes TEXT,
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
