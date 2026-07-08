import { Worker } from "bullmq"
// import { jobConnection, QUEUE_NAMES } from "./queues.js"
import { QUEUE_NAMES } from "./queues.js"
import { logger } from "../utils/logger.js"
import { env } from "../config/env.js"
import { notifyUsers } from "../utils/notifications.js"
import { listLowStockMedicines, listExpiringBatches, findActiveUserIdsByRoles } from "../../modules/pharmacy/medicines.model.js"
import { ROLES } from "../constants/roles.js"

const notifyPharmacyStaff = async ({ type, title, message }) => {
  const userIds = await findActiveUserIdsByRoles([ROLES.PHARMACIST, ROLES.ADMIN])
  if (userIds.length === 0) {
    return
  }
  await notifyUsers({ userIds, type, title, message, entityType: "medicine", entityId: null })
}

export const createAlertsWorker = () => {
  // Redis/BullMQ disabled — uncomment when Redis is available
  // const worker = new Worker(
  //   QUEUE_NAMES.ALERTS,
  //   async (job) => {
  //     if (job.name === "stock-expiry-check") {
  //       const lowStock = await listLowStockMedicines()
  //       const expiring = await listExpiringBatches(env.pharmacy.expiryAlertDays)

  //       if (lowStock.length > 0) {
  //         await notifyPharmacyStaff({
  //           type: "low_stock",
  //           title: "Low Stock Alert",
  //           message: `${lowStock.length} medicine(s) are at or below reorder level.`
  //         })
  //       }

  //       if (expiring.length > 0) {
  //         await notifyPharmacyStaff({
  //           type: "expiry_alert",
  //           title: "Batch Expiry Alert",
  //           message: `${expiring.length} batch(es) expire within ${env.pharmacy.expiryAlertDays} days.`
  //         })
  //       }

  //       return { lowStockCount: lowStock.length, expiringCount: expiring.length }
  //     }
  //     return null
  //   },
  //   { connection: jobConnection }
  // )

  // worker.on("failed", (job, error) => {
  //   logger.error(`Alerts job ${job?.id} failed: ${error.message}`)
  // })

  // return worker
  logger.warn("Alerts worker disabled — Redis is not available")
  return null
}

// Suppress unused import warnings while worker is disabled
void Worker
void QUEUE_NAMES
void env
void notifyPharmacyStaff
void listLowStockMedicines
void listExpiringBatches
void findActiveUserIdsByRoles
void ROLES
void notifyUsers
