import { generateTimeSlots, getDayOfWeek } from "../../shared/utils/time.js"
import { findScheduleForDay, isDoctorOnLeave } from "./doctors.model.js"
import { getBookedSlotTimes } from "../appointments/appointments.model.js"

export const computeAvailableSlots = async (doctorId, dateString) => {
  const dayOfWeek = getDayOfWeek(dateString)
  const schedule = await findScheduleForDay(doctorId, dayOfWeek)

  if (!schedule) {
    return []
  }

  const onLeave = await isDoctorOnLeave(doctorId, dateString)
  if (onLeave) {
    return []
  }

  const allSlots = generateTimeSlots(schedule.start_time, schedule.end_time, schedule.slot_duration)
  const bookedSlots = await getBookedSlotTimes(doctorId, dateString)
  const bookedSet = new Set(bookedSlots)

  return allSlots.filter((slot) => !bookedSet.has(slot))
}

export const isSlotAvailable = async (doctorId, dateString, slotTime) => {
  const availableSlots = await computeAvailableSlots(doctorId, dateString)
  return availableSlots.includes(slotTime)
}
