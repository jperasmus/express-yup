import { NextFunction, Request, Response } from 'express'
import { Schema, ValidateOptions } from 'yup'

export function validate<S extends any, C = object>(
  schema: Schema<S, C>,
  validateOptions?: ValidateOptions<C>
) {
  return async function expressYupMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      await schema.validate(req, validateOptions)
      next()
    } catch (error) {
      res.statusCode = 400
      next(error)
    }
  }
}
