import Button from "@/components/ui/Button"
export function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null
  const canPrev = page > 1
  const canNext = page < totalPages
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-slate-600">
        Page <span className="font-medium text-slate-900">{page}</span> of{" "}
        <span className="font-medium text-slate-900">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={!canPrev} onClick={() => onPageChange(page - 1)}>
          Prev
        </Button>
        <Button variant="secondary" size="sm" disabled={!canNext} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}
export default Pagination
