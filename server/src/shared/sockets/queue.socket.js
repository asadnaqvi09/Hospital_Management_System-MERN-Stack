import { getIo } from "./index.js"
import { ROLES } from "../constants/roles.js"

export const emitQueueUpdate = (payload) => {
  const io = getIo()
  if (!io) {
    return
  }
  io.to(`role:${ROLES.RECEPTIONIST}`).emit("queue:update", payload)
  io.to(`role:${ROLES.NURSE}`).emit("queue:update", payload)
}

export const emitAppointmentBooked = ({ doctorUserId, appointment }) => {
  const io = getIo()
  if (!io) {
    return
  }
  if (doctorUserId) {
    io.to(`user:${doctorUserId}`).emit("appointment:booked", appointment)
  }
  io.to(`role:${ROLES.RECEPTIONIST}`).emit("queue:update", { type: "booked", appointment })
}
