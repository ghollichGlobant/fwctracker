/**
 * Central error handler — catches all thrown/next(err) errors.
 */
export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const message = err.message || "Internal server error";

  console.error(`[${status}] ${message}`, status === 500 ? err.stack : "");

  res.status(status).json({ error: message });
}

/**
 * Wrap async route handlers so rejected promises reach errorHandler.
 */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
