/**
 * @file Directive registration and registry management for Kite.
 * @module core/registry
 * @author Kite Contributors
 * @license MIT
 */

import { error, warn } from '../utils/log.js';

/**
 * @typedef {Object} DirectiveDefinition
 * @property {string} name - Directive identifier (e.g. 'text', 'bind', 'if').
 * @property {Function} handler - Invoked with `(el, expr, scope, arg, modifiers, scanElement, ctx)`.
 * @property {number} priority - Execution priority (higher executes earlier).
 * @property {boolean} isTerminal - If true, scanner stops recursing into child nodes (e.g. `kite-if`, `kite-for`).
 * @property {boolean} [once=false] - Run only on mount.
 * @property {string[]} [events=[]] - Re-run when these DOM events fire.
 * @property {boolean} [watch=true] - Auto-watch the expression.
 * @property {boolean} [scopeOnly=false] - Skip global directive chain.
 */

/**
 * Active registry mapping directive names to their definitions.
 * @type {Map<string, DirectiveDefinition>}
 */
const directives = new Map();

/**
 * Snapshot of original built-in directives for Kite.original().
 * @type {Map<string, DirectiveDefinition>}
 */
const originalDirectives = new Map();

/**
 * Set of temporarily disabled directive names.
 * @type {Set<string>}
 */
const disabledDirectives = new Set();

/**
 * Registers a directive into the global Kite registry.
 *
 * @param {string}   name      - Directive name without `kite-` prefix (e.g. 'text', 'model').
 * @param {Function} handler   - Directive execution callback.
 * @param {Object}   [options] - Optional settings.
 * @param {number}   [options.priority=0] - Higher priority directives run earlier.
 * @param {boolean}  [options.isTerminal=false] - Whether this directive manages its own child DOM.
 * @param {boolean}  [options.once=false] - Run only once on mount.
 * @param {string[]} [options.events=[]] - Event names that trigger re-execution.
 * @param {boolean}  [options.watch=true] - Auto-watch expression dependencies.
 * @param {boolean}  [options.scopeOnly=false] - Skip global directive chain.
 * @returns {Function} Unregister function.
 */
export function registerDirective(name, handler, options = {}) {
  if (!name || typeof name !== 'string') {
    error(`Directive name must be a non-empty string.`);
    return () => {};
  }
  if (typeof handler !== 'function') {
    error(`Directive handler for 'kite-${name}' must be a function.`);
    return () => {};
  }

  const def = {
    name,
    handler,
    priority: options.priority || 0,
    isTerminal: Boolean(options.isTerminal),
    once: Boolean(options.once),
    events: Array.isArray(options.events) ? options.events : [],
    watch: options.watch !== false,
    scopeOnly: Boolean(options.scopeOnly)
  };

  // Capture original definition on first registration
  if (!originalDirectives.has(name)) {
    originalDirectives.set(name, { ...def });
  }

  directives.set(name, def);

  return () => unregisterDirective(name);
}

/**
 * Unregisters a directive from the registry.
 *
 * @param {string} name - Directive identifier without prefix.
 * @returns {boolean} True if directive was found and removed.
 */
export function unregisterDirective(name) {
  return directives.delete(name);
}

/**
 * Retrieves a registered directive by its name.
 * Returns undefined if the directive is disabled or not found.
 *
 * @param {string} name - Directive name without `kite-` prefix.
 * @returns {DirectiveDefinition|undefined}
 */
export function getDirective(name) {
  if (disabledDirectives.has(name)) return undefined;
  return directives.get(name);
}

/**
 * Retrieves the unmodified original built-in directive definition.
 *
 * @param {string} name - Directive name.
 * @returns {DirectiveDefinition|undefined}
 */
export function getOriginalDirective(name) {
  return originalDirectives.get(name);
}

/**
 * Checks if a directive name is registered and not disabled.
 *
 * @param {string} name - Directive name without prefix.
 * @returns {boolean}
 */
export function hasDirective(name) {
  if (disabledDirectives.has(name)) return false;
  return directives.has(name);
}

/**
 * Returns all active registered directives sorted by descending priority.
 *
 * @returns {Array<DirectiveDefinition>}
 */
export function getAllDirectives() {
  return Array.from(directives.values())
    .filter(d => !disabledDirectives.has(d.name))
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Temporarily disables one or more directives.
 *
 * @param {string|string[]} names - Directive name(s) to disable.
 */
export function disableDirective(names) {
  const list = Array.isArray(names) ? names : [names];
  for (const n of list) {
    if (n) disabledDirectives.add(n);
  }
}

/**
 * Re-enables one or more previously disabled directives.
 *
 * @param {string|string[]} names - Directive name(s) to re-enable.
 */
export function enableDirective(names) {
  const list = Array.isArray(names) ? names : [names];
  for (const n of list) {
    if (n) disabledDirectives.delete(n);
  }
}

/**
 * Returns the raw Map of directives.
 * @returns {Map<string, DirectiveDefinition>}
 */
export function getDirectivesMap() {
  return directives;
}
