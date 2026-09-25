/**
 * @file Declarative <kite-api> parser and registry for Kite.
 * @module api/api-element
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Parses `<kite-api>` and `<kite-header>` tags and registers configured
 * API clients into a global registry for automatic injection into models.
 *
 * @example
 * <kite-api name="main" base="https://api.example.com" adapter="rest">
 *   <kite-header name="Authorization" value="Bearer 12345"></kite-header>
 * </kite-api>
 */

import { ApiClient } from './client.js';
import { warn } from '../utils/log.js';

/**
 * Global registry of named API clients.
 * @type {Map<string, ApiClient>}
 */
const apiRegistry = new Map();

/**
 * Registers an ApiClient instance under a unique name.
 *
 * @param {string} name - Client name (e.g. 'main').
 * @param {ApiClient} client - ApiClient instance.
 */
export function registerApi(name, client) {
  if (name && client) {
    apiRegistry.set(name.toLowerCase(), client);
  }
}

/**
 * Retrieves a registered ApiClient by name.
 *
 * @param {string} [name='main'] - Client name.
 * @returns {ApiClient|undefined}
 */
export function getApi(name = 'main') {
  return apiRegistry.get(String(name).toLowerCase());
}

/**
 * Scans a `<kite-api>` DOM element, extracts configuration and headers,
 * and registers the resulting ApiClient globally.
 *
 * @param {Element} el - The `<kite-api>` DOM element.
 * @returns {ApiClient} The configured ApiClient instance.
 */
export function processApiDefinition(el) {
  if (!el) return undefined;

  const name = el.getAttribute('name') || 'main';
  const base = el.getAttribute('base') || '';
  const adapter = el.getAttribute('adapter') || 'rest';

  // Extract custom headers declared via <kite-header name="..." value="...">
  const headers = {};
  const headerElements = el.querySelectorAll('kite-header');
  for (let i = 0; i < headerElements.length; i++) {
    const hEl = headerElements[i];
    const hName = hEl.getAttribute('name');
    const hVal = hEl.getAttribute('value');
    if (hName && hVal !== null) {
      headers[hName] = hVal;
    }
  }

  const client = new ApiClient({ base, adapter, headers });
  registerApi(name, client);

  // Hide the configuration tag from visual layout
  el.style.display = 'none';

  return client;
}
