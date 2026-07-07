import { asyncHandler } from "../../shared/utils/asyncHandler.js"
import { sendSuccess } from "../../shared/utils/apiResponse.js"
import { globalSearchPatients, countGlobalSearchPatients } from "./search.model.js"

export const searchPatientsGlobal = asyncHandler(async (req, res) => {
  const { q } = req.validated.query
  const page = req.validated.query.page || 1
  const limit = req.validated.query.limit || 20
  const offset = (page - 1) * limit

  const [patients, total] = await Promise.all([
    globalSearchPatients({ search: q, limit, offset }),
    countGlobalSearchPatients(q)
  ])

  return sendSuccess(res, {
    message: "Patient search completed successfully",
    data: { patients, query: q },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
})
