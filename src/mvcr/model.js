/**
 * @file Model primitive for Kite MVCR architecture.
 * @module mvcr/model
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Defines named reactive data models via `<kite-model name="...">`.
 * Models hold state and methods, accessible by views across the page.
 *
 * @example
 * <kite-model name="todos">
 *   {
 *     items: [],
 *     draft: "",
 *     add() { if (!this.draft) return; this.items.push({ text: this.draft, done: false }); this.draft = ""; },
 *     clear() { this.items = this.items.filter(t => !t.done); }
 *   }
 * </kite-model>
 */

import { createScope } from '../core/scope.js';
import { parseObjectLiteral } from '../utils/expr.js';
import { getApi } from '../api/api-element.js';
import { ApiClient } from '../api/client.js';
import { warn, error } from '../utils/log.js';

/**
 * Global model registry mapping model names to reactive Scope instances.
 * @type {Map<string, Proxy>}
 */
const modelRegistry = new Map();

/**
 * Registers a model scope under a unique name.
 *
 * @param {string} name - Model identifier (e.g. 'todos').
 * @param {Object} state - State object or initial scope.
 * @returns {Proxy} The reactive model scope.
 */
export function registerModel(name, state, apiOption = null) {
  if (!name || typeof name !== 'string') {
    error(`Model name must be a non-empty string.`);
    return null;
  }

  const normalized = name.toLowerCase();

  // If already a scope proxy
  let scope;
  if (state && state.$subscribe) {
    scope = state;
    modelRegistry.set(normalized, scope);
  } else if (modelRegistry.has(normalized)) {
    scope = modelRegistry.get(normalized);
    if (state && typeof state === 'object') {
      const rawMethods = scope.$methods || {};
      for (const key of Object.keys(state)) {
        if (typeof state[key] === 'function') {
          rawMethods[key] = state[key].bind(scope);
          scope[key] = rawMethods[key];
        } else {
          scope[key] = state[key];
        }
      }
      scope.$methods = rawMethods;
    }
  } else {
    const rawData = Object.assign({
      loading: false,
      error: null,
      empty: false
    }, state || {});
    scope = createScope(rawData);

    // Bind methods to scope so `this` references the reactive proxy
    const rawMethods = {};
    for (const key of Object.keys(rawData)) {
      if (typeof rawData[key] === 'function') {
        rawMethods[key] = rawData[key].bind(scope);
        rawData[key] = rawMethods[key];
      }
    }
    scope.$methods = rawMethods;
    modelRegistry.set(normalized, scope);
  }

  // If API option is configured, bind the API client to the scope
  if (apiOption) {
    const client = typeof apiOption === 'string'
      ? (getApi(apiOption) || new ApiClient({ base: apiOption }))
      : apiOption;

    if (client && typeof client.createBoundApi === 'function') {
      scope.api = client.createBoundApi(scope);
    }
  }

  return scope;
}

/**
 * Retrieves a registered model by name.
 *
 * @param {string} name - Model identifier.
 * @returns {Proxy|undefined}
 */
export function getModel(name) {
  if (!name) return undefined;
  return modelRegistry.get(name.toLowerCase());
}

/**
 * Returns all registered models as a plain object.
 * @returns {Object}
 */
export function getAllModels() {
  const result = {};
  for (const [name, scope] of modelRegistry.entries()) {
    result[name] = scope;
  }
  return result;
}

/**
 * Safely parses the text body of a `<kite-model>` element into an object.
 *
 * @param {string} raw - Raw text content of the model tag.
 * @returns {Object} Parsed state object.
 */
export function parseModelBody(raw) {
  if (!raw || !raw.trim()) return {};
  const trimmed = raw.trim();

  try {
    return parseObjectLiteral(trimmed);
  } catch (err) {
    warn(`Failed to parse <kite-model> body:`, err);
    return {};
  }
}

/**
 * Scans a `<kite-model>` element, initializes its reactive scope, and hides it.
 *
 * @param {Element} el - The `<kite-model>` DOM element.
 */
export function processModelDefinition(el) {
  const name = el.getAttribute('name');
  if (!name) {
    warn(`Found <kite-model> without a 'name' attribute.`, el);
    return;
  }

  const apiName = el.getAttribute('api');
  const raw = el.textContent || '';
  const stateObj = parseModelBody(raw);
  registerModel(name, stateObj, apiName);

  // Hide definition element from layout
  el.style.display = 'none';
}
