CREATE TABLE IF NOT EXISTS lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  category VARCHAR(60),
  unit VARCHAR(30),
  normal_range VARCHAR(80),
  critical_low NUMERIC,
  critical_high NUMERIC,
  price NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  consultation_id UUID REFERENCES consultations(id),
  status VARCHAR(25) DEFAULT 'ordered' CHECK (status IN ('ordered','sample_collected','processing','completed')),
  priority VARCHAR(20) DEFAULT 'routine' CHECK (priority IN ('routine','urgent','critical')),
  ordered_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS lab_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_order_id UUID REFERENCES lab_orders(id) ON DELETE CASCADE,
  test_id UUID REFERENCES lab_tests(id),
  result_value VARCHAR(100),
  result_numeric NUMERIC,
  is_abnormal BOOLEAN DEFAULT FALSE,
  is_critical BOOLEAN DEFAULT FALSE,
  notes TEXT,
  result_file_url TEXT,
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMPTZ
);
