/**
 * @file Data formatting and truncation directives for Kite.
 * @module directives/format
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Formats text contents as dates, numbers, currency, relative time, or truncated strings.
 *
 * @example
 * <span kite-text="createdAt" kite-format="date"></span>
 * <span kite-text="price" kite-format="currency"></span>
 * <span kite-text="bio" kite-truncate="60"></span>
 */

import { registerDirective } from '../core/registry.js';
import { createReaction } from '../core/reactor.js';

registerDirective('format', (el, expr) => {
  const type = (expr || '').toLowerCase().trim();

  return createReaction(() => {
    const raw = el.textContent ? el.textContent.trim() : '';
    if (!raw) return;

    if (type === 'date') {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        el.textContent = d.toLocaleDateString();
      }
    } else if (type === 'number') {
      const n = Number(raw);
      if (!isNaN(n)) {
        el.textContent = n.toLocaleString();
      }
    } else if (type === 'currency') {
      const n = Number(raw);
      if (!isNaN(n)) {
        el.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
      }
    } else if (type === 'ago') {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
        if (diffSec < 60) el.textContent = 'just now';
        else if (diffSec < 3600) el.textContent = `${Math.floor(diffSec / 60)}m ago`;
        else if (diffSec < 86400) el.textContent = `${Math.floor(diffSec / 3600)}h ago`;
        else el.textContent = `${Math.floor(diffSec / 86400)}d ago`;
      }
    }
  });
}, { priority: 200 });

registerDirective('truncate', (el, expr) => {
  const maxLen = parseInt(expr || '50', 10);

  return createReaction(() => {
    const text = el.textContent || '';
    if (text.length > maxLen) {
      el.textContent = text.slice(0, maxLen) + '…';
    }
  });
}, { priority: 190 });
