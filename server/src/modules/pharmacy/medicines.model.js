import { pool } from "../../shared/config/db.js"

const MEDICINE_COLUMNS = `id, name, generic_name, category, unit, stock_quantity, reorder_level,
  purchase_price, sale_price, supplier, created_at`

export const insertMedicine = async ({
  name,
  genericName,
  category,
  unit,
  stockQuantity,
  reorderLevel,
  purchasePrice,
  salePrice,
  supplier
}) => {
  const result = await pool.query(
    `INSERT INTO medicines (name, generic_name, category, unit, stock_quantity, reorder_level, purchase_price, sale_price, supplier)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${MEDICINE_COLUMNS}`,
    [
      name,
      genericName || null,
      category || null,
      unit || null,
      stockQuantity ?? 0,
      reorderLevel ?? 50,
      purchasePrice ?? null,
      salePrice ?? null,
      supplier || null
    ]
  )
  return result.rows[0]
}

export const findMedicineById = async (medicineId, client = pool) => {
  const result = await client.query(`SELECT ${MEDICINE_COLUMNS} FROM medicines WHERE id = $1`, [medicineId])
  return result.rows[0] || null
}

export const listMedicines = async ({ search, category, lowStockOnly, limit, offset }) => {
  const values = []
  const conditions = []

  if (search) {
    values.push(`%${search}%`)
    conditions.push(`(name ILIKE $${values.length} OR generic_name ILIKE $${values.length})`)
  }
  if (category) {
    values.push(category)
    conditions.push(`category ILIKE $${values.length}`)
  }
  if (lowStockOnly) {
    conditions.push(`stock_quantity <= reorder_level`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  values.push(limit)
  const limitPlaceholder = `$${values.length}`
  values.push(offset)
  const offsetPlaceholder = `$${values.length}`

  const result = await pool.query(
    `SELECT ${MEDICINE_COLUMNS} FROM medicines ${whereClause} ORDER BY name ASC LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values
  )
  return result.rows
}

export const countMedicines = async ({ search, category, lowStockOnly }) => {
  const values = []
  const conditions = []

  if (search) {
    values.push(`%${search}%`)
    conditions.push(`(name ILIKE $${values.length} OR generic_name ILIKE $${values.length})`)
  }
  if (category) {
    values.push(category)
    conditions.push(`category ILIKE $${values.length}`)
  }
  if (lowStockOnly) {
    conditions.push(`stock_quantity <= reorder_level`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const result = await pool.query(`SELECT COUNT(*)::int AS total FROM medicines ${whereClause}`, values)
  return result.rows[0].total
}

export const updateMedicine = async (medicineId, fields) => {
  const mapping = {
    name: "name",
    genericName: "generic_name",
    category: "category",
    unit: "unit",
    reorderLevel: "reorder_level",
    purchasePrice: "purchase_price",
    salePrice: "sale_price",
    supplier: "supplier"
  }
  const setClauses = []
  const values = [medicineId]

  for (const [key, column] of Object.entries(mapping)) {
    if (fields[key] !== undefined) {
      values.push(fields[key])
      setClauses.push(`${column} = $${values.length}`)
    }
  }

  if (setClauses.length === 0) {
    return findMedicineById(medicineId)
  }

  const result = await pool.query(
    `UPDATE medicines SET ${setClauses.join(", ")} WHERE id = $1 RETURNING ${MEDICINE_COLUMNS}`,
    values
  )
  return result.rows[0] || null
}

export const findMedicinesByNameMatch = async ({ medicineName, genericName }) => {
  const result = await pool.query(
    `SELECT ${MEDICINE_COLUMNS}
     FROM medicines
     WHERE LOWER(name) = LOWER($1)
        OR LOWER(generic_name) = LOWER($1)
        OR ($2::text IS NOT NULL AND (LOWER(name) = LOWER($2) OR LOWER(generic_name) = LOWER($2)))`,
    [medicineName, genericName || null]
  )
  return result.rows
}

export const listAvailableBatches = async (medicineId, client = pool) => {
  const result = await client.query(
    `SELECT id, medicine_id, batch_number, quantity, expiry_date, received_at
     FROM medicine_batches
     WHERE medicine_id = $1 AND quantity > 0 AND expiry_date >= CURRENT_DATE
     ORDER BY expiry_date ASC, received_at ASC`,
    [medicineId]
  )
  return result.rows
}

export const insertMedicineBatch = async (
  { medicineId, batchNumber, quantity, expiryDate },
  client = pool
) => {
  const result = await client.query(
    `INSERT INTO medicine_batches (medicine_id, batch_number, quantity, expiry_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [medicineId, batchNumber, quantity, expiryDate]
  )
  return result.rows[0]
}

export const incrementMedicineStock = async (medicineId, quantity, client = pool) => {
  const result = await client.query(
    `UPDATE medicines SET stock_quantity = stock_quantity + $2 WHERE id = $1 RETURNING ${MEDICINE_COLUMNS}`,
    [medicineId, quantity]
  )
  return result.rows[0] || null
}

export const decrementMedicineStock = async (medicineId, quantity, client = pool) => {
  const result = await client.query(
    `UPDATE medicines
     SET stock_quantity = stock_quantity - $2
     WHERE id = $1 AND stock_quantity >= $2
     RETURNING ${MEDICINE_COLUMNS}`,
    [medicineId, quantity]
  )
  return result.rows[0] || null
}

export const decrementBatchQuantity = async (batchId, quantity, client = pool) => {
  const result = await client.query(
    `UPDATE medicine_batches
     SET quantity = quantity - $2
     WHERE id = $1 AND quantity >= $2
     RETURNING *`,
    [batchId, quantity]
  )
  return result.rows[0] || null
}

export const listLowStockMedicines = async () => {
  const result = await pool.query(
    `SELECT ${MEDICINE_COLUMNS} FROM medicines WHERE stock_quantity <= reorder_level ORDER BY stock_quantity ASC`
  )
  return result.rows
}

export const listExpiringBatches = async (daysAhead) => {
  const result = await pool.query(
    `SELECT mb.*, m.name AS medicine_name, m.generic_name
     FROM medicine_batches mb
     JOIN medicines m ON m.id = mb.medicine_id
     WHERE mb.quantity > 0
       AND mb.expiry_date <= CURRENT_DATE + make_interval(days => $1)
       AND mb.expiry_date >= CURRENT_DATE
     ORDER BY mb.expiry_date ASC`,
    [daysAhead]
  )
  return result.rows
}

export const listMedicineBatches = async (medicineId) => {
  const result = await pool.query(
    `SELECT * FROM medicine_batches WHERE medicine_id = $1 ORDER BY expiry_date ASC, received_at ASC`,
    [medicineId]
  )
  return result.rows
}

export const findActiveUserIdsByRoles = async (roles) => {
  const result = await pool.query(
    `SELECT id FROM users WHERE role = ANY($1::text[]) AND is_active = TRUE`,
    [roles]
  )
  return result.rows.map((row) => row.id)
}
