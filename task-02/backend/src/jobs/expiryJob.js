const { expireDueReservations } = require('../services/reservationService');

// A lightweight in-process scheduler. Every INTERVAL it sweeps for reservations
// whose 5-minute window has elapsed, expires them, and returns their stock.
// No external job system needed for this assessment.
const INTERVAL_MS = 30 * 1000; // check every 30 seconds

let timer = null;

function startExpiryJob() {
  if (timer) return timer;
  timer = setInterval(async () => {
    try {
      const { expiredOrders } = await expireDueReservations();
      if (expiredOrders > 0) {
        console.log(`[expiry-job] expired ${expiredOrders} order(s)`);
      }
    } catch (err) {
      console.error('[expiry-job] error:', err.message);
    }
  }, INTERVAL_MS);
  // Don't keep the process alive just for this timer.
  if (timer.unref) timer.unref();
  console.log(`[expiry-job] started (every ${INTERVAL_MS / 1000}s)`);
  return timer;
}

function stopExpiryJob() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = { startExpiryJob, stopExpiryJob };
