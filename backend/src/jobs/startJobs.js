'use strict';

/**
 * Punto de entrada de jobs/crons.
 * Este archivo puede ejecutarse como proceso separado:
 *   node backend/src/jobs/startJobs.js
 */

const { startSyncCron } = require('../services/matchSync');

startSyncCron();
