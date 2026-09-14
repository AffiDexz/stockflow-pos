const crypto = require('crypto');

// Reservation window required by the assessment.
const RESERVATION_MINUTES = 5;
const RESERVATION_MS = RESERVATION_MINUTES * 60 * 1000;

// Human-friendly, collision-proof order reference (safe under concurrency),
// e.g. ORD-LZ4K9P-3F7A
function generateOrderReference() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${ts}-${rand}`;
}

// Positive integer check used for quantities.
function isPositiveInt(value) {
  return Number.isInteger(value) && value > 0;
}

module.exports = {
  RESERVATION_MINUTES,
  RESERVATION_MS,
  generateOrderReference,
  isPositiveInt,
};
