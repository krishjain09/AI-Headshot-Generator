const { logger } = require("./logger");

/**
 * Central Express error handler.
 * Must be registered last in the middleware chain.
 */
function errorHandler(err, req, res, _next) {
  logger.error(`${req.method} ${req.path} — ${err.message}`);

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: `File too large. Max size is ${process.env.MAX_UPLOAD_SIZE_MB || 10}MB per image.`,
    });
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      error: `Too many files. Maximum is ${process.env.MAX_FILES || 10} images.`,
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      error: `Unexpected field: ${err.field}. Use "images" as the field name.`,
    });
  }

  // Generic
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    error: err.message || "An unexpected error occurred.",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
