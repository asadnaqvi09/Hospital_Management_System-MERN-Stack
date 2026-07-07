import { AppError } from "../../shared/utils/AppError.js"
import {
  findMedicineById,
  findMedicinesByNameMatch,
  listAvailableBatches,
  decrementBatchQuantity,
  decrementMedicineStock
} from "./medicines.model.js"

export const resolveMedicineForItem = async ({ medicineId, medicineName, genericName }) => {
  if (medicineId) {
    const medicine = await findMedicineById(medicineId)
    if (!medicine) {
      throw new AppError("Medicine not found", 404, "MEDICINE_NOT_FOUND")
    }
    return medicine
  }

  const matches = await findMedicinesByNameMatch({ medicineName, genericName })
  if (matches.length === 0) {
    throw new AppError(
      `No inventory match for medicine "${medicineName}"`,
      409,
      "MEDICINE_NOT_MATCHED"
    )
  }
  if (matches.length > 1) {
    throw new AppError(
      `Multiple inventory matches for "${medicineName}". Provide medicineId.`,
      409,
      "MEDICINE_AMBIGUOUS"
    )
  }
  return matches[0]
}

export const deductFifoStock = async (client, medicineId, quantity) => {
  const batches = await listAvailableBatches(medicineId, client)
  const totalAvailable = batches.reduce((sum, batch) => sum + batch.quantity, 0)
  if (totalAvailable < quantity) {
    const medicine = await findMedicineById(medicineId, client)
    throw new AppError(
      `Insufficient stock for ${medicine?.name || "medicine"}. Available: ${totalAvailable}, required: ${quantity}`,
      409,
      "INSUFFICIENT_STOCK"
    )
  }

  let remaining = quantity
  const deductions = []

  for (const batch of batches) {
    if (remaining <= 0) {
      break
    }
    const take = Math.min(batch.quantity, remaining)
    const updated = await decrementBatchQuantity(batch.id, take, client)
    if (!updated) {
      throw new AppError("Failed to deduct batch stock", 409, "STOCK_DEDUCTION_FAILED")
    }
    deductions.push({ batchId: batch.id, quantity: take })
    remaining -= take
  }

  const medicine = await decrementMedicineStock(medicineId, quantity, client)
  if (!medicine) {
    throw new AppError("Failed to decrement medicine stock", 409, "STOCK_DEDUCTION_FAILED")
  }

  return { medicine, deductions }
}
