import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { z, ZodError } from 'zod';
import { HttpError } from '../utils/http-error';

export const notFoundHandler: RequestHandler = (req, _res, next) =>
  next(new HttpError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`));

/** Single place that turns any thrown error into `{ error: { code, message, details? } }`. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const { fieldErrors, formErrors } = z.flattenError(err);
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: formErrors[0] ?? 'Invalid request', details: fieldErrors },
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: `Invalid ${err.path}` } });
    return;
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'value';
    res.status(409).json({ error: { code: 'CONFLICT', message: `That ${field} is already in use` } });
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Malformed JSON body' } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
};
