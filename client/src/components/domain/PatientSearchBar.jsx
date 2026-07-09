import { useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { useLazySearchPatientsQuery } from "@/api/search.api"
import { useDebounce } from "@/hooks/useDebounce"
import { getPatientEmrPath } from "@/utils/patientPaths"
import SearchInput from "@/components/forms/SearchInput"
import { cn } from "@/utils/cn"

const ALLOWED = new Set(["admin", "receptionist", "doctor", "nurse", "pharmacist", "lab_technician"])

export function PatientSearchBar() {
  return <PatientSearch />
}
export default PatientSearchBar

function PatientSearch() {
  const role = useSelector((s) => s.auth.user?.role)
  const enabled = ALLOWED.has(role)
  const [q, setQ] = useState("")
  const debounced = useDebounce(q, 300)
  const [trigger, { data, isFetching }] = useLazySearchPatientsQuery()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const results = useMemo(() => {
    const list = data?.data?.patients || []
    return Array.isArray(list) ? list : []
  }, [data])
  useEffect(() => {
    if (!enabled) return
    if (!debounced || debounced.trim().length < 2) return
    trigger(debounced.trim())
    setOpen(true)
  }, [debounced, enabled, trigger])
  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])
  if (!enabled) return null
  return (
    <div ref={rootRef} className="relative hidden w-[360px] md:block">
      <SearchInput
        placeholder="Search patients..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q.trim().length >= 2 && setOpen(true)}
      />
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
            {isFetching ? "Searching..." : results.length ? `${results.length} results` : "No results"}
          </div>
          <div className={cn("max-h-[360px] overflow-y-auto", results.length ? "py-1" : "p-3")}>
            {results.length ? (
              results.map((p) => (
                <Link
                  key={p.id}
                  to={getPatientEmrPath(role, p.id)}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 hover:bg-slate-50"
                >
                  <p className="text-sm font-medium text-slate-900">{p.full_name || p.fullName || "Patient"}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    MRN {p.mrn || "-"}
                    {p.phone ? ` • ${p.phone}` : ""}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-600">Type at least 2 characters.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
