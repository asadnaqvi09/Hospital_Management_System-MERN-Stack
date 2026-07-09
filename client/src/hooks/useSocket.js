import { useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { io } from "socket.io-client"
import { env } from "@/config/env"
import { baseApi } from "@/store/api"
import { store } from "@/store"
import { QUERY_TAGS } from "@/constants/queryKeys"
export function useSocket() {
  const token = useSelector((state) => state.auth.accessToken)
  const socketRef = useRef(null)
  useEffect(() => {
    if (!token) return
    const socket = io(env.socketUrl, { auth: { token } })
    socketRef.current = socket
    socket.on("notification:new", () => {
      store.dispatch(baseApi.util.invalidateTags([QUERY_TAGS.NOTIFICATIONS]))
    })
    socket.on("queue:update", () => {
      store.dispatch(baseApi.util.invalidateTags([QUERY_TAGS.APPOINTMENTS, QUERY_TAGS.DOCTORS, QUERY_TAGS.CONSULTATIONS]))
    })
    socket.on("appointment:booked", () => {
      store.dispatch(baseApi.util.invalidateTags([QUERY_TAGS.APPOINTMENTS, QUERY_TAGS.DOCTORS]))
    })
    socket.on("ai:symptom-complete", () => {
      store.dispatch(baseApi.util.invalidateTags([QUERY_TAGS.AI]))
    })
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [token])
  return socketRef
}
