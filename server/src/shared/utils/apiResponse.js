export const sendSuccess = (res, { data = null, message = "Success", statusCode = 200, pagination } = {}) => {
  const body = { success: true, message, data }
  if (pagination) {
    body.pagination = pagination
  }
  return res.status(statusCode).json(body)
}

export const sendError = (res, { code = "INTERNAL_ERROR", message = "Something went wrong", statusCode = 500 } = {}) => {
  return res.status(statusCode).json({ success: false, code, message })
}
