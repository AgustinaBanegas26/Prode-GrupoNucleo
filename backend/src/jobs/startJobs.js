'use strict';

/**
 * Punto de entrada de jobs/crons.
 * Este archivo puede ejecutarse como proceso separado:
 *   node backend/src/jobs/startJobs.js
 */

const { startSyncCron } = require('../services/matchSync');
const { startNotificationJobs } = require('../services/notificationJobs');

startSyncCron();

try {
  startNotificationJobs();
} catch (e) {
  console.warn('[startJobs] notification jobs:', e.message);
}
