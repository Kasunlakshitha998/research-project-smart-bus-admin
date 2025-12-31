/**
 * Centralized Error Handling Middleware
 * Catch all errors passed to next() and return a consistent JSON response.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
