/**
 * @file Plugin and extension bundle manager for Kite.
 * @module core/plugins
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Coordinates plugins that bundle custom directives, helpers, rules, and components.
 *
 * @example
 * Kite.plugin('ui-kit', (kite) => {
 *   kite.directive('badge', ...);
 *   kite.helper('money', ...);
 * });
 * Kite.use('ui-kit');
 */

import { warn, info } from '../utils/log.js';

/**
 * Global plugin registry: name -> setup function.
 * @type {Map<string, Function>}
 */
const pluginRegistry = new Map();

/**
 * Set of installed plugin names.
 * @type {Set<string>}
 */
const installedPlugins = new Set();

/**
 * Defines a named plugin.
 *
 * @param {string} name - Plugin identifier.
 * @param {Function} setupFn - Function receiving the Kite API object.
 */
export function registerPlugin(name, setupFn) {
  if (name && typeof setupFn === 'function') {
    const key = name.toLowerCase();
    pluginRegistry.set(key, setupFn);
    return () => unregisterPlugin(key);
  } else {
    warn(`Failed to register plugin "${name}". Expected a setup function.`);
    return () => {};
  }
}

/**
 * Unregisters a plugin.
 *
 * @param {string} name - Plugin name.
 * @returns {boolean}
 */
export function unregisterPlugin(name) {
  if (!name) return false;
  const key = name.toLowerCase();
  installedPlugins.delete(key);
  return pluginRegistry.delete(key);
}

/**
 * Retrieves all registered plugins as a Map.
 * @returns {Map<string, Function>}
 */
export function getAllPlugins() {
  return pluginRegistry;
}

/**
 * Installs and executes a registered plugin.
 *
 * @param {string|Function} plugin - Plugin name or setup function.
 * @param {Object} kiteInstance - The Kite static facade.
 */
export function usePlugin(plugin, kiteInstance) {
  if (typeof plugin === 'function') {
    try {
      plugin(kiteInstance);
    } catch (err) {
      warn(`Error executing inline plugin:`, err);
    }
    return;
  }

  if (plugin && typeof plugin === 'object' && typeof plugin.install === 'function') {
    const name = (plugin.name || 'anonymous').toLowerCase();
    if (installedPlugins.has(name) && name !== 'anonymous') return;
    try {
      plugin.install(kiteInstance);
      if (name !== 'anonymous') installedPlugins.add(name);
    } catch (err) {
      warn(`Error installing plugin "${name}":`, err);
    }
    return;
  }

  const name = String(plugin).toLowerCase();
  if (installedPlugins.has(name)) return;

  const setup = pluginRegistry.get(name);
  if (!setup) {
    warn(`Plugin "${name}" was not found in registry.`);
    return;
  }

  try {
    setup(kiteInstance);
    installedPlugins.add(name);
  } catch (err) {
    warn(`Error installing plugin "${name}":`, err);
  }
}

/**
 * Scans a `<kite-plugin src="...">` DOM element and dynamically loads the script.
 *
 * @param {Element} el - The `<kite-plugin>` DOM element.
 * @param {Object} kiteInstance - The Kite static facade.
 */
export function processPluginDefinition(el, kiteInstance) {
  const src = el.getAttribute('src');
  if (src && typeof importShim !== 'undefined') {
    // Dynamic import if environment supports it
    import(src).then((mod) => {
      if (mod && mod.default && typeof mod.default === 'function') {
        usePlugin(mod.default, kiteInstance);
      }
    }).catch((err) => {
      warn(`Failed to load <kite-plugin src="${src}">:`, err);
    });
  }
  el.style.display = 'none';
}
