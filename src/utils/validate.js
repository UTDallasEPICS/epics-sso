// middleware/validate.js
import { z } from "zod"

export const validateQuery = (schema) => (req, res, next) => {
	// safeParse prevents throwing unexpected errors globally
	const result = schema.safeParse(req.query)

	if (!result.success) {
		return res.status(400).json({
			status: "fail",
			errors: result.error.errors, // Returns array of missing/invalid fields
		})
	}
	req.validatedQuery = result.data
	next()
}
