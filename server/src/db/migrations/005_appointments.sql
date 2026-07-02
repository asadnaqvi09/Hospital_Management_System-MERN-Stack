CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  appointment_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  type VARCHAR(20) DEFAULT 'booked' CHECK (type IN ('booked','walk_in','follow_up','emergency')),
  status VARCHAR(25) DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','checked_in','in_consultation','completed','cancelled','no_show')),
  chief_complaint TEXT,
  booking_source VARCHAR(20) DEFAULT 'patient' CHECK (booking_source IN ('patient','receptionist','doctor')),
  no_show_probability SMALLINT,
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_2h_sent BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, appointment_date, slot_time)
);

CREATE INDEX IF NOT EXISTS idx_apt_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_apt_patient ON appointments(patient_id);
