/**
 * @file Local and session storage persistence directive for Kite.
 * @module directives/persist
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Automatically syncs the enclosing scope's state to localStorage or sessionStorage.
 * Supports namespacing (`kite:`), custom keys, TTL expiration, and field exclusions.
 *
 * @example
 * <div kite-scope="{ theme: 'dark' }" kite-persist="local">
 * <div kite-scope="{ token: '' }"
 *      kite-persist="session"
 *      kite-persist-key="app.token"
 *      kite-persist-ttl="1h"
 *      kite-persist-exclude="token">
 */

import { registerDirective } from '../core/registry.js';
import { createReaction } from '../core/reactor.js';
import { config } from '../core/config.js';

/**
 * Parses a TTL string like "30s", "15m", "1h", "7d" into milliseconds.
 *
 * @param {string} ttlStr
 * @returns {number|null}
 */
export function parseTtl(ttlStr) {
  if (!ttlStr) return null;
  const str = String(ttlStr).trim().toLowerCase();
  const match = str.match(/^(\d+)(ms|s|m|h|d)?$/);
  if (!match) return null;

  const count = parseInt(match[1], 10);
  const unit = match[2] || 'ms';

  switch (unit) {
    case 'ms': return count;
    case 's': return count * 1000;
    case 'm': return count * 60 * 1000;
    case 'h': return count * 60 * 60 * 1000;
    case 'd': return count * 24 * 60 * 60 * 1000;
    default: return count;
  }
}

/**
 * Clears all storage keys managed by Kite across localStorage and sessionStorage.
 */
export function clearPersistedStorage() {
  const ns = config.persistNamespace || 'kite';
  const prefix = `${ns}:`;

  const clearStorage = (storage) => {
    if (!storage) return;
    const keysToRemove = [];
    if (typeof storage.length === 'number' && typeof storage.key === 'function') {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && (key.startsWith(prefix) || key.startsWith('kite_persist_') || key.startsWith('kite:'))) {
          keysToRemove.push(key);
        }
      }
    } else if (typeof storage.keys === 'function') {
      for (const key of storage.keys()) {
        if (key && (key.startsWith(prefix) || key.startsWith('kite_persist_') || key.startsWith('kite:'))) {
          keysToRemove.push(key);
        }
      }
    } else {
      for (const key of Object.keys(storage)) {
        if (key && (key.startsWith(prefix) || key.startsWith('kite_persist_') || key.startsWith('kite:'))) {
          keysToRemove.push(key);
        }
      }
    }
    for (const key of keysToRemove) {
      storage.removeItem(key);
    }
  };

  if (typeof localStorage !== 'undefined') clearStorage(localStorage);
  if (typeof sessionStorage !== 'undefined') clearStorage(sessionStorage);
}

registerDirective('persist', (el, expr, scope, arg) => {
  if (!scope) return () => {};

  const mode = (expr || 'local').toLowerCase();
  const storage = mode === 'session'
    ? (typeof sessionStorage !== 'undefined' ? sessionStorage : null)
    : (typeof localStorage !== 'undefined' ? localStorage : null);

  if (!storage) return () => {};

  // Custom key override: kite-persist-key="app.token" or arg or el.id or 'default'
  const customKey = (typeof el.getAttribute === 'function' && el.getAttribute('kite-persist-key')) || arg || el.id || 'default';
  const ns = config.persistNamespace || 'kite';
  const storageKey = `${ns}:${customKey}`;

  // TTL: kite-persist-ttl="1h"
  const ttlMs = parseTtl(typeof el.getAttribute === 'function' ? el.getAttribute('kite-persist-ttl') : null);

  // Excluded keys: kite-persist-exclude="token,password"
  const rawExclude = (typeof el.getAttribute === 'function' && el.getAttribute('kite-persist-exclude')) || '';
  const excludedKeys = new Set(rawExclude.split(',').map(s => s.trim()).filter(Boolean));

  // 1. Restore previously saved state if available and not expired
  try {
    const raw = storage.getItem(storageKey);
    if (raw) {
      const envelope = JSON.parse(raw);
      if (envelope && typeof envelope === 'object') {
        const isExpired = envelope.expiresAt && Date.now() > envelope.expiresAt;
        if (isExpired) {
          storage.removeItem(storageKey);
        } else {
          const payload = envelope.data !== undefined ? envelope.data : envelope;
          if (payload && typeof payload === 'object') {
            for (const [k, v] of Object.entries(payload)) {
              if (!excludedKeys.has(k)) {
                scope[k] = v;
              }
            }
          }
        }
      }
    }
  } catch {}

  // 2. Reactively save state updates
  return createReaction(() => {
    try {
      const snapshot = {};
      for (const key of Object.keys(scope)) {
        if (key.startsWith('$') || typeof scope[key] === 'function' || excludedKeys.has(key)) continue;
        snapshot[key] = scope[key];
      }

      const envelope = {
        data: snapshot,
        expiresAt: ttlMs ? Date.now() + ttlMs : null
      };

      storage.setItem(storageKey, JSON.stringify(envelope));
    } catch {}
  });
}, { priority: 940 });
