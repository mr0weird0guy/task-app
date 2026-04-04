import { ZodSchema } from "zod";
import { RequestHandler } from "express";

/**
 * validate(schema)
 * Zod schema validation factory – returns a middleware.
 * Replaces req.body with the coerced, validated value on success.
 */
function validate(schema: ZodSchema): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export { validate };
