import { getIo } from "./index.js"

export const emitToUser = (userId, event, payload) => {
  const io = getIo()
  if (!io || !userId) {
    return
  }
  io.to(`user:${userId}`).emit(event, payload)
}

export const emitToRole = (role, event, payload) => {
  const io = getIo()
  if (!io) {
    return
  }
  io.to(`role:${role}`).emit(event, payload)
}
