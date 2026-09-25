/**
 * @file Component definition and registry for Kite.
 * @module components/component
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Manages the definition and registration of reusable `<kite-component>` and programmatic components.
 * Supports both HTML templates and JavaScript component definitions `{ props, template, setup, style }`.
 */

import { warn, error } from '../utils/log.js';

/**
 * Global component registry mapping lowercase name to component definition.
 * @type {Map<string, Object|HTMLTemplateElement>}
 */
const componentRegistry = new Map();

/**
 * Snapshot of original built-in components for Kite.original().
 * @type {Map<string, Object|HTMLTemplateElement>}
 */
const originalComponents = new Map();

/**
 * Registers a component template or JS definition under a unique name.
 *
 * @param {string} name - Name of the component (e.g. 'greeting-card').
 * @param {HTMLTemplateElement|Element|string|Object} def - Template element, HTML string, or JS component descriptor.
 * @returns {Function} Unregister function.
 */
export function registerComponent(name, def) {
  if (!name || typeof name !== 'string') {
    error(`Component name must be a non-empty string.`);
    return () => {};
  }
  if (!def) {
    error(`Component '${name}' must provide a valid template or definition.`);
    return () => {};
  }

  const key = name.toLowerCase();
  let normalized = def;

  // Case A: JS Component descriptor { props, template, setup, style }
  if (typeof def === 'object' && !(def instanceof (typeof Node !== 'undefined' ? Node : Object))) {
    let tEl = def.template;
    if (typeof tEl === 'string' && typeof document !== 'undefined') {
      const tmpl = document.createElement('template');
      tmpl.innerHTML = tEl;
      tEl = tmpl;
    }
    normalized = {
      ...def,
      template: tEl
    };
  } else if (typeof def === 'string' && typeof document !== 'undefined') {
    // Case B: HTML string
    const tmpl = document.createElement('template');
    tmpl.innerHTML = def;
    normalized = tmpl;
  } else if (def.tagName) {
    // Case C: DOM Element / Template
    normalized = def.tagName.toLowerCase() === 'template'
      ? def
      : def.querySelector('template') || def;
  }

  if (!originalComponents.has(key)) {
    originalComponents.set(key, normalized);
  }

  componentRegistry.set(key, normalized);

  return () => unregisterComponent(key);
}

/**
 * Unregisters a component.
 *
 * @param {string} name - Component name.
 * @returns {boolean}
 */
export function unregisterComponent(name) {
  if (!name) return false;
  return componentRegistry.delete(name.toLowerCase());
}

/**
 * Retrieves a registered component definition by name.
 *
 * @param {string} name - Component name.
 * @returns {Object|HTMLTemplateElement|undefined}
 */
export function getComponent(name) {
  if (!name) return undefined;
  return componentRegistry.get(name.toLowerCase());
}

/**
 * Retrieves the original component definition before any overrides.
 *
 * @param {string} name
 * @returns {Object|HTMLTemplateElement|undefined}
 */
export function getOriginalComponent(name) {
  if (!name) return undefined;
  return originalComponents.get(name.toLowerCase());
}

/**
 * Scans a `<kite-component>` element from the DOM, registers it, and removes it from display.
 *
 * @param {Element} el - The `<kite-component>` DOM element.
 */
export function processComponentDefinition(el) {
  const name = el.getAttribute('name');
  if (!name) {
    warn(`Found <kite-component> without a 'name' attribute.`, el);
    return;
  }

  const template = el.querySelector('template');
  if (!template) {
    warn(`<kite-component name="${name}"> must contain a <template> child element.`, el);
    return;
  }

  registerComponent(name, template);

  // Hide the definition element so it doesn't occupy visible layout space
  el.style.display = 'none';
}

/**
 * Returns the raw component registry Map.
 * @returns {Map<string, Object|HTMLTemplateElement>}
 */
export function getComponentsMap() {
  return componentRegistry;
}
