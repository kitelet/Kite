/**
 * @file Periodic polling directive for Kite.
 * @module directives/poll
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Automatically triggers an action or method periodically (e.g. `kite-poll="5s"`).
 *
 * @example
 * <div kite-poll="5s" kite-on-poll="loadData()"></div>
 * <div kite-poll="1000" kite-action="refresh()"></div>
 */

import { registerDirective } from '../core/registry.js';
import { evaluateExpression } from '../utils/expr.js';

registerDirective('poll', (el, expr, scope) => {
  let intervalMs = 5000;
  const raw = (expr || '').toLowerCase().trim();

  if (raw.endsWith('ms')) {
    intervalMs = parseInt(raw, 10);
  } else if (raw.endsWith('s')) {
    intervalMs = parseFloat(raw) * 1000;
  } else if (raw && !isNaN(Number(raw))) {
    intervalMs = parseInt(raw, 10);
  }

  const pollAction = el.getAttribute('kite-on-poll') || el.getAttribute('kite-action');

  const executePoll = () => {
    if (pollAction) {
      evaluateExpression(pollAction, scope);
    }
    el.dispatchEvent(new CustomEvent('poll', { bubbles: false }));
  };

  const timerId = setInterval(executePoll, intervalMs);

  return () => {
    clearInterval(timerId);
  };
}, { priority: 400 });
