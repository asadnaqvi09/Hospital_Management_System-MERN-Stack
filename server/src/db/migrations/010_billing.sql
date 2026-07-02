CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  consultation_id UUID REFERENCES consultations(id),
  admission_id UUID REFERENCES admissions(id),
  subtotal NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  discount_reason TEXT,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(25) DEFAULT 'draft' CHECK (status IN ('draft','finalized','partially_paid','fully_paid','cancelled')),
  insurance_provider VARCHAR(120),
  insurance_policy VARCHAR(80),
  insurance_covered NUMERIC(12,2) DEFAULT 0,
  pdf_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category VARCHAR(40),
  quantity NUMERIC(8,2) DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  amount NUMERIC(12,2) NOT NULL,
  method VARCHAR(30) CHECK (method IN ('cash','card','bank_transfer','insurance')),
  reference VARCHAR(120),
  received_by UUID REFERENCES users(id),
  paid_at TIMESTAMPTZ DEFAULT NOW()
);
