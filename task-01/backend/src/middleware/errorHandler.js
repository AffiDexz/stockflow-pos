const { AppError } = require('../utils/errors');

// 404 for unknown routes.
function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Central error handler — turns known errors into clean JSON and hides the
// details of unexpected/database errors from the client.
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Prisma known errors we can map to friendly messages.
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Duplicate value violates a unique constraint.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' });
  }

  console.error('[unhandled error]', err);
  return res.status(500).json({ error: 'Internal server error.' });
}

module.exports = { notFoundHandler, errorHandler };
