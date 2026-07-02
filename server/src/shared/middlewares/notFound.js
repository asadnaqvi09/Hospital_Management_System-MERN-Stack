import { sendError } from "../utils/apiResponse.js"

export const notFound = (req, res) => {
  return sendError(res, {
    code: "ROUTE_NOT_FOUND",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404
  })
}
