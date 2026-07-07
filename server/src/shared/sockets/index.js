import { Server } from "socket.io"
import jwt from "jsonwebtoken"
import { env } from "../config/env.js"
import { logger } from "../utils/logger.js"

let io = null

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) {
    next(new Error("Authentication token missing"))
    return
  }
  try {
    const payload = jwt.verify(token, env.jwt.accessSecret)
    socket.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    next(new Error("Invalid or expired token"))
  }
}

export const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  })

  io.use(authenticateSocket)

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`)
    socket.join(`role:${socket.user.role}`)
    logger.info(`Socket connected ${socket.id} for user ${socket.user.id} (${socket.user.role})`)

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected ${socket.id}`)
    })
  })

  return io
}

export const getIo = () => io
