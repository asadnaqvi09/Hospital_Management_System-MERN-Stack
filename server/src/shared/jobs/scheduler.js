import cron from "node-cron"
import { emailQueue, smsQueue, alertsQueue, aiQueue } from "./queues.js"
import { logger } from "../utils/logger.js"
import { isSmsConfigured } from "../utils/sms.js"
import { refreshMaterializedViews } from "../../modules/reports/reports.model.js"
import {
  findAppointmentsNeedingReminder,
  markAppointmentReminderSent
} from "../../modules/appointments/appointments.model.js"

const REMINDER_COLUMNS = {
  24: "reminder_24h_sent",
  2: "reminder_2h_sent"
}

const enqueueReminders = async (hoursAhead) => {
  const column = REMINDER_COLUMNS[hoursAhead]
  const appointments = await findAppointmentsNeedingReminder(hoursAhead, column)

  for (const appointment of appointments) {
    const reminderText = `Reminder: you have an appointment with Dr. ${appointment.doctor_name || "your doctor"} on ${appointment.appointment_date} at ${appointment.slot_time}.`

    if (appointment.email) {
      await emailQueue.add("appointment-reminder", {
        to: appointment.email,
        subject: "Appointment Reminder",
        text: reminderText
      })
    }

    if (appointment.phone && isSmsConfigured()) {
      await smsQueue.add("appointment-reminder", {
        to: appointment.phone,
        body: `CareCore HMS — ${reminderText}`
      })
    }

    await markAppointmentReminderSent(appointment.id, column)
  }
}

export const startAppointmentReminderScheduler = () => {
  cron.schedule("*/15 * * * *", async () => {
    try {
      await enqueueReminders(24)
      await enqueueReminders(2)
    } catch (error) {
      logger.error(`Appointment reminder scheduler failed: ${error.message}`)
    }
  })
}

export const startStockExpiryScheduler = () => {
  cron.schedule("0 2 * * *", async () => {
    try {
      await alertsQueue.add("stock-expiry-check", {})
    } catch (error) {
      logger.error(`Stock/expiry scheduler failed: ${error.message}`)
    }
  })
}

export const startNoShowPredictionScheduler = () => {
  cron.schedule("0 3 * * *", async () => {
    try {
      await aiQueue.add("no-show-batch", { daysAhead: 14 })
    } catch (error) {
      logger.error(`No-show prediction scheduler failed: ${error.message}`)
    }
  })
}

export const startReportRefreshScheduler = () => {
  cron.schedule("0 1 * * *", async () => {
    try {
      await refreshMaterializedViews()
      logger.info("Report materialized views refreshed")
    } catch (error) {
      logger.error(`Report materialized view refresh failed: ${error.message}`)
    }
  })
}
