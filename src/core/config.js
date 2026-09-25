/**
 * @file Global configuration manager for Kite.
 * @module core/config
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Coordinates application-wide settings declared via `<kite-config>` or `Kite.config()`.
 * Controls attribute prefix, execution mode (dev vs prod), sanitization, logging, persistence, and selective directives (`only`).
 */

import { warn, info } from '../utils/log.js';

/**
 * Default Kite configuration options.
 */
export const config = {
  mode: 'development',
  prefix: 'kite-',
  routing: 'hash',
  adapter: 'rest',
  base: '',
  sanitize: 'strict',
  persistNamespace: 'kite',
  maxDepth: 32,
  devWarn: true,
  logLevel: 'warn',
  autoScan: true,
  mutationScan: true,
  shadow: false,
  theme: 'auto',
  strictAttrs: false,
  strict: false,
  allowCalls: true,
  only: null, // null means all directives allowed; array of strings trims registration
  api: {
    adapter: 'rest',
    base: '',
    timeout: 10000,
    retry: 0,
    credentials: 'same-origin',
    headers: {}
  },
  persist: {
    namespace: 'kite',
    storage: 'local',
    ttl: null
  },
  fetch: {
    credentials: 'same-origin',
    timeout: 10000,
    retry: 0
  }
};

/**
 * Updates Kite configuration settings or returns a single key value.
 *
 * @param {Object|string} [options] - Configuration overrides object or key name to read.
 * @returns {Object|*}
 */
export function setConfig(options = {}) {
  if (typeof options === 'string') {
    return config[options];
  }

  if (options.mode) {
    config.mode = options.mode;
    config.devWarn = options.mode !== 'production' && options.mode !== 'prod';
  }
  if (options.prefix) config.prefix = options.prefix.toLowerCase();
  if (options.routing) config.routing = options.routing;
  if (options.adapter) config.adapter = options.adapter;
  if (options.base !== undefined) config.base = options.base;
  if (options.sanitize) config.sanitize = options.sanitize;
  if (options['persist-namespace'] || options.persistNamespace) {
    config.persistNamespace = options['persist-namespace'] || options.persistNamespace;
    config.persist.namespace = config.persistNamespace;
  }
  if (options['max-depth'] !== undefined || options.maxDepth !== undefined) {
    config.maxDepth = Number(options['max-depth'] || options.maxDepth);
  }
  if (options['dev-warn'] !== undefined) config.devWarn = Boolean(options['dev-warn']);
  if (options['log-level'] || options.logLevel) config.logLevel = options['log-level'] || options.logLevel;
  if (options['auto-scan'] !== undefined || options.autoScan !== undefined) {
    config.autoScan = options['auto-scan'] === 'true' || options['auto-scan'] === true || options.autoScan === true;
  }
  if (options.mutationScan !== undefined) config.mutationScan = Boolean(options.mutationScan);
  if (options.shadow !== undefined) config.shadow = options.shadow === 'true' || options.shadow === true;
  if (options.theme) config.theme = options.theme;
  if (options.strict !== undefined) config.strict = Boolean(options.strict);
  if (options.allowCalls !== undefined) config.allowCalls = Boolean(options.allowCalls);
  if (Array.isArray(options.only)) {
    config.only = options.only.map(s => String(s).toLowerCase().replace(/^kite-/, ''));
  }

  if (options.api && typeof options.api === 'object') {
    Object.assign(config.api, options.api);
    if (options.api.base !== undefined) config.base = options.api.base;
    if (options.api.adapter) config.adapter = options.api.adapter;
  }

  if (options.persist && typeof options.persist === 'object') {
    Object.assign(config.persist, options.persist);
    if (options.persist.namespace) config.persistNamespace = options.persist.namespace;
  }

  if (options.fetch && typeof options.fetch === 'object') {
    Object.assign(config.fetch, options.fetch);
  }

  return config;
}

/**
 * Retrieves configuration or a specific property value.
 *
 * @param {string} [key] - Optional configuration key.
 * @returns {*}
 */
export function getConfig(key) {
  if (key && typeof key === 'string') {
    return config[key];
  }
  return config;
}

/**
 * Extracts per-element configuration overrides declared via `kite-config:*`.
 *
 * @param {Element} el - DOM element.
 * @param {Object} [baseConfig=config] - Enclosing config.
 * @returns {Object} Effective configuration for this element.
 */
export function getElementConfig(el, baseConfig = config) {
  if (!el || !el.attributes) return baseConfig;

  let localOverrides = null;
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    if (attr.name.startsWith('kite-config:')) {
      if (!localOverrides) localOverrides = Object.assign({}, baseConfig);
      const configKey = attr.name.slice(12);
      localOverrides[configKey] = attr.value;
    }
  }

  return localOverrides || baseConfig;
}

/**
 * Scans and parses a `<kite-config>` DOM element.
 *
 * @param {Element} el - The `<kite-config>` element.
 */
export function processConfigDefinition(el) {
  const options = {};
  const attrs = el.attributes;
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i];
    options[attr.name] = attr.value;
  }
  setConfig(options);
  el.style.display = 'none';
}
