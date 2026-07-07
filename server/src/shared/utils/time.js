export const timeStringToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(":").map(Number)
  return hours * 60 + minutes
}

export const minutesToTimeString = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const paddedHours = String(hours).padStart(2, "0")
  const paddedMinutes = String(minutes).padStart(2, "0")
  return `${paddedHours}:${paddedMinutes}:00`
}

export const generateTimeSlots = (startTime, endTime, slotDurationMinutes) => {
  const startMinutes = timeStringToMinutes(startTime)
  const endMinutes = timeStringToMinutes(endTime)
  const slots = []

  for (let current = startMinutes; current + slotDurationMinutes <= endMinutes; current += slotDurationMinutes) {
    slots.push(minutesToTimeString(current))
  }

  return slots
}

export const getDayOfWeek = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`)
  return date.getDay()
}
