ALTER TABLE prescription_items
  ADD COLUMN IF NOT EXISTS medicine_id UUID REFERENCES medicines(id),
  ADD COLUMN IF NOT EXISTS dispensed_quantity SMALLINT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_prescription_items_medicine ON prescription_items(medicine_id);

CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_consultation ON invoices(consultation_id);
CREATE INDEX IF NOT EXISTS idx_invoices_admission ON invoices(admission_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
