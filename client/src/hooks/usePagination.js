import { useState, useCallback } from "react"
export function usePagination(initial = { page: 1, limit: 10 }) {
  const [pagination, setPagination] = useState(initial)
  const setPage = useCallback((page) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])
  const setLimit = useCallback((limit) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }))
  }, [])
  const reset = useCallback(() => {
    setPagination(initial)
  }, [initial])
  return { ...pagination, setPage, setLimit, reset, setPagination }
}
