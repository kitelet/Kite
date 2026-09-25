/**
 * @file View primitive for Kite MVCR architecture.
 * @module mvcr/view
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Defines views that render data from models.
 * Named views (<kite-view name="...">) serve as templates for routing.
 * Inline views (<kite-view model="...">) bind their children to the specified model scope.
 *
 * @example
 * <kite-view name="todos-view" model="todos">
 *   <h1 kite-text="title"></h1>
 * </kite-view>
 */

import { getModel } from './model.js';
import { warn } from '../utils/log.js';

/**
 * Global registry of named views for routing.
 * @type {Map<string, Element>}
 */
const viewRegistry = new Map();

/**
 * Registers a named view element for routing.
 *
 * @param {string} name - View identifier (e.g. 'home-view').
 * @param {Element} viewEl - The `<kite-view>` DOM element.
 */
export function registerView(name, viewEl) {
  viewRegistry.set(name.toLowerCase(), viewEl);
}

/**
 * Retrieves a registered view element by name.
 *
 * @param {string} name - View identifier.
 * @returns {Element|undefined}
 */
export function getView(name) {
  if (!name) return undefined;
  return viewRegistry.get(name.toLowerCase());
}

/**
 * Processes a `<kite-view>` element during DOM scanning.
 *
 * @param {Element} el - The `<kite-view>` DOM element.
 * @param {Function} scanElement - Scanner callback to bind children.
 * @returns {Function|undefined} Cleanup unbinder if bound inline.
 */
export function processView(el, scanElement) {
  const name = el.getAttribute('name');
  const modelName = el.getAttribute('model');

  // If view is named, it is a routed template: register and hide it
  if (name) {
    registerView(name, el);
    el.style.display = 'none';
    return;
  }

  // Standalone inline view: bind children to model scope
  if (modelName) {
    const modelScope = getModel(modelName);
    if (!modelScope) {
      warn(`View references model '${modelName}', but it was not found.`, el);
      return;
    }
    if (typeof scanElement === 'function') {
      const cleanups = [];
      const children = Array.from(el.children);
      for (const child of children) {
        const unbind = scanElement(child, modelScope);
        if (typeof unbind === 'function') cleanups.push(unbind);
      }
      return () => {
        for (const u of cleanups) u();
      };
    }
  }
}
