CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(20) UNIQUE NOT NULL,
  ward VARCHAR(50) NOT NULL,
  floor SMALLINT,
  capacity SMALLINT DEFAULT 1,
  daily_rate NUMERIC(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available','occupied','maintenance')),
  version INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  admitting_doctor UUID REFERENCES doctors(id),
  room_id UUID REFERENCES rooms(id),
  admission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_days SMALLINT,
  admission_reason TEXT,
  status VARCHAR(20) DEFAULT 'admitted' CHECK (status IN ('admitted','discharged','transferred')),
  discharge_date TIMESTAMPTZ,
  discharge_summary TEXT,
  discharge_meds TEXT,
  follow_up_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nursing_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID REFERENCES admissions(id) ON DELETE CASCADE,
  nurse_id UUID REFERENCES users(id),
  shift VARCHAR(20) CHECK (shift IN ('morning','afternoon','night')),
  note TEXT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
