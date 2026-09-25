/**
 * @file Reactive effect scheduler and DOM updater for Kite.
 * @module core/reactor
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Coordinates reactive dependency tracking and schedules batched DOM updates.
 * When scope state changes, reactors are queued and flushed asynchronously in
 * a single microtask to prevent layout thrashing and redundant DOM operations.
 */

import { setActiveReactor } from './scope.js';
import { error } from '../utils/log.js';

// Set of pending reactor jobs queued for the next microtask flush
const pendingJobs = new Set();
let isFlushScheduled = false;

/**
 * Flushes all queued reactive updates in a single tick.
 */
function flushJobs() {
  isFlushScheduled = false;
  const jobsToRun = Array.from(pendingJobs);
  pendingJobs.clear();

  for (const job of jobsToRun) {
    try {
      job();
    } catch (err) {
      error(`Error executing reactive DOM update:`, err);
    }
  }
}

/**
 * Schedules a reactor to run in the next microtask.
 *
 * @param {Function} job - The reactor function to schedule.
 */
export function queueJob(job) {
  pendingJobs.add(job);
  if (!isFlushScheduled) {
    isFlushScheduled = true;
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(flushJobs);
    } else {
      Promise.resolve().then(flushJobs);
    }
  }
}

/**
 * Creates an auto-running reactive effect.
 *
 * The callback is executed immediately to collect reactive dependencies, and
 * automatically re-queued whenever any observed property changes.
 *
 * @param {Function} effectFn - The reactive function to execute and re-run.
 * @returns {Function} Teardown function to deactivate the reactor.
 *
 * @example
 * const cleanup = createReaction(() => {
 *   el.textContent = evaluateExpression('count', scope);
 * });
 */
export function createReaction(effectFn) {
  let isCleanedUp = false;

  const job = () => {
    if (isCleanedUp) return;
    try {
      setActiveReactor(job);
      effectFn();
    } finally {
      setActiveReactor(null);
    }
  };

  const scheduleJob = () => {
    if (!isCleanedUp) {
      queueJob(job);
    }
  };

  // Run immediately synchronously on mount to initialize DOM
  job();

  // Return teardown callback
  return () => {
    isCleanedUp = true;
    pendingJobs.delete(job);
  };
}
