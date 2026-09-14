// A single error type the whole app throws. The error middleware turns it
// into a clean JSON response with the right HTTP status code.
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const badRequest = (msg) => new AppError(400, msg);
const notFound = (msg) => new AppError(404, msg);
const conflict = (msg) => new AppError(409, msg); // e.g. insufficient stock, duplicate

module.exports = { AppError, badRequest, notFound, conflict };
