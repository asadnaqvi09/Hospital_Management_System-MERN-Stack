CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  generic_name VARCHAR(120),
  category VARCHAR(60),
  unit VARCHAR(20),
  stock_quantity INT DEFAULT 0,
  reorder_level INT DEFAULT 50,
  purchase_price NUMERIC(10,2),
  sale_price NUMERIC(10,2),
  supplier VARCHAR(120),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medicine_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  batch_number VARCHAR(50),
  quantity INT NOT NULL,
  expiry_date DATE NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_expiry ON medicine_batches(expiry_date);

CREATE TABLE IF NOT EXISTS medicine_dispensing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id),
  dispensed_by UUID REFERENCES users(id),
  notes TEXT,
  dispensed_at TIMESTAMPTZ DEFAULT NOW()
);
