import { AppError } from "../utils/AppError.js"

export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    })

    if (!result.success) {
      const firstIssue = result.error.issues[0]
      const fieldPath = firstIssue.path.join(".")
      throw new AppError(`Validation failed at ${fieldPath}: ${firstIssue.message}`, 422, "VALIDATION_ERROR")
    }

    req.validated = result.data
    next()
  }
}
