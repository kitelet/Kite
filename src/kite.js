/**
 * @file Main entry point and global Kite runtime coordinator.
 * @module kite
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Kite — HTML is enough for small things.
 * Zero-boilerplate, CDN-loaded teaching toolkit turning HTML attributes into reactivity.
 * Built with Components, MVCR, explicit scale limits, and zero external runtime dependencies.
 */

import {
  registerDirective,
  getDirective,
  getAllDirectives,
  unregisterDirective,
  disableDirective,
  enableDirective,
  getOriginalDirective,
  getDirectivesMap
} from './core/registry.js';
import { createScope } from './core/scope.js';
import { scan, scanElement } from './core/scanner.js';
import { registerBuiltinDirectives } from './directives/index.js';
import { evaluateExpression, parseObjectLiteral, registerGlobalHelper, globalHelpers } from './utils/expr.js';
import {
  registerComponent,
  getComponent,
  unregisterComponent,
  getOriginalComponent,
  getComponentsMap
} from './components/component.js';
import { registerModel, getModel, getAllModels } from './mvcr/model.js';
import { registerRoute, initRouter } from './mvcr/route.js';
import {
  ApiClient,
  registerApi,
  getApi,
  registerAdapter,
  getAdapter,
  unregisterAdapter,
  getOriginalAdapter,
  getAllAdapters
} from './api/index.js';
import { registerStore, getStore, getAllStores, globalStore } from './core/store.js';
import {
  registerValidationRule,
  unregisterValidationRule,
  getAllValidationRules
} from './directives/validate.js';
import { config, setConfig, getConfig } from './core/config.js';
import { clearPersistedStorage } from './directives/persist.js';
import { registerPlugin, usePlugin, unregisterPlugin, getAllPlugins } from './core/plugins.js';
import { registerHook, triggerHook, getAllHooks } from './core/hooks.js';
import { registerMiddleware, getAllMiddlewares } from './core/middleware.js';
import { setActiveSanitizer, getOriginalSanitizer, sanitizeHtml } from './utils/sanitize.js';
import { enableMutationObserver, disableMutationObserver } from './core/scanner.js';
import { warn, info, error } from './utils/log.js';

// Global state object serving as fallback root in the scope lookup chain
const globalState = {};

// Helper functions accessible within attribute expressions (e.g. `uppercase(user.name)`)
const helpers = {
  uppercase: (str) => String(str).toUpperCase(),
  lowercase: (str) => String(str).toLowerCase(),
  capitalize: (str) => {
    const s = String(str);
    return s.charAt(0).toUpperCase() + s.slice(1);
  },
  currency: (num) => '$' + Number(num || 0).toFixed(2),
  json: (obj) => JSON.stringify(obj, null, 2),
  navigate: (path) => {
    if (typeof window !== 'undefined' && path) {
      const clean = path.startsWith('#') ? path : `#${path.startsWith('/') ? path : '/' + path}`;
      window.location.hash = clean;
    }
  }
};

// Sync built-in helpers with global expression evaluator
Object.assign(globalHelpers, helpers);

/**
 * Public Kite API facade.
 */
export const Kite = {
  version: '1.0.0',

  /**
   * Registers a custom directive.
   *
   * @param {string}   name       - Directive name without `kite-` prefix.
   * @param {Function} handler    - Callback `(el, expr, scope, arg, modifiers, scanElement, ctx)`.
   * @param {Object}   [options]  - Optional configuration `{ priority, isTerminal, once, events, watch, scopeOnly }`.
   * @returns {Function} Unregister function.
   *
   * @example
   * const off = Kite.directive('tooltip', (el, expr, scope) => {
   *   el.title = scope[expr];
   * });
   * off(); // unregister
   */
  directive(name, handler, options = {}) {
    return registerDirective(name, handler, options);
  },

  /**
   * Registers a custom component programmatically.
   *
   * @param {string} name - Component name.
   * @param {HTMLTemplateElement|Element|string|Object} templateOrDef - Template element, HTML string, or JS descriptor { props, template, setup, style }.
   * @returns {Function} Unregister function.
   */
  component(name, templateOrDef) {
    return registerComponent(name, templateOrDef);
  },

  /**
   * Registers a named reactive data model programmatically.
   *
   * @param {string} name - Model identifier.
   * @param {Object} state - Plain state object or methods.
   * @returns {Proxy} The reactive model scope.
   */
  model(name, state) {
    return registerModel(name, state);
  },

  /**
   * Registers a route mapping a URL path to a view name.
   *
   * @param {string} path - URL path (e.g. '/' or '/todos').
   * @param {string} viewName - Named view to render.
   */
  route(path, viewName) {
    return registerRoute(path, viewName);
  },

  /**
   * Configures and registers a named API client programmatically.
   *
   * @param {string} name - API client name.
   * @param {Object} config - { base, adapter, headers }.
   * @returns {ApiClient}
   */
  api(name, config) {
    const client = new ApiClient(config);
    registerApi(name, client);
    return client;
  },

  /**
   * Registers a custom network protocol adapter.
   *
   * @param {string} name - Adapter name.
   * @param {Object|Function} adapterImpl - Implementation with request(config) or direct handler function.
   * @returns {Function} Unregister function.
   */
  adapter(name, adapterImpl) {
    return registerAdapter(name, adapterImpl);
  },

  /**
   * Registers network adapter middleware.
   *
   * @param {string} name - Middleware identifier.
   * @param {Function} fn - Handler `(opts, ctx, next) => Promise<Response>`.
   * @returns {Function} Unregister function.
   */
  middleware(name, fn) {
    return registerMiddleware(name, fn);
  },

  /**
   * Registers a lifecycle hook.
   *
   * @param {string} name - Hook identifier (e.g. 'before:scan', 'before:fetch').
   * @param {Function} fn - Hook callback.
   * @returns {Function} Unregister function.
   */
  hook(name, fn) {
    return registerHook(name, fn);
  },

  /**
   * Retrieves a registered API client by name.
   *
   * @param {string} [name='main'] - API client identifier.
   * @returns {ApiClient|undefined}
   */
  getApi(name) {
    return getApi(name);
  },

  /**
   * Programmatically navigates to a router path.
   *
   * @param {string} path - Target path (e.g. '/about' or 'about').
   */
  navigate(path) {
    helpers.navigate(path);
  },

  /**
   * Registers a custom expression helper function.
   * Supports dot-namespacing (e.g. 'date.format') and scoping.
   *
   * @param {string} name - Helper name.
   * @param {Function} fn - Helper implementation.
   * @param {Object} [options] - Optional settings { scope }.
   * @returns {Function} Unregister function.
   */
  helper(name, fn, options = {}) {
    if (typeof fn !== 'function') return () => {};

    const wrapped = (options && options.scope)
      ? (...args) => fn(...args)
      : fn;

    if (name.includes('.')) {
      const parts = name.split('.');
      let curr = helpers;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!curr[parts[i]]) curr[parts[i]] = {};
        curr = curr[parts[i]];
      }
      curr[parts[parts.length - 1]] = wrapped;
    }
    helpers[name] = wrapped;
    registerGlobalHelper(name, wrapped);

    return () => {
      delete helpers[name];
      delete globalHelpers[name];
      if (name.includes('.')) {
        const parts = name.split('.');
        let curr = helpers;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!curr[parts[i]]) return;
          curr = curr[parts[i]];
        }
        delete curr[parts[parts.length - 1]];
      }
    };
  },

  /**
   * Registers or retrieves a global reactive store.
   *
   * @param {string} name - Store name.
   * @param {Object} [data] - Store state.
   * @returns {Proxy} Store scope proxy.
   */
  store(name, data) {
    if (data !== undefined) {
      return registerStore(name, data);
    }
    return getStore(name);
  },

  /**
   * Registers a custom form validation rule.
   *
   * @param {string} name - Rule name.
   * @param {Function} validator - (value, arg, ctx) => true | string | Promise<true | string>.
   * @returns {Function} Unregister function.
   */
  rule(name, validator) {
    return registerValidationRule(name, validator);
  },

  /**
   * Registers a Kite plugin bundle.
   *
   * @param {string} name - Plugin identifier.
   * @param {Function} fn - Plugin installer function receiving `(Kite)`.
   * @returns {Function} Unregister function.
   */
  plugin(name, fn) {
    if (typeof name === 'function' || (name && typeof name === 'object')) {
      this.use(name);
      return () => {};
    }
    const unregister = registerPlugin(name, fn);
    if (typeof fn === 'function') {
      usePlugin(name, this);
    }
    return unregister;
  },

  /**
   * Installs a Kite plugin function or object.
   *
   * @param {Function|Object} plugin - Plugin module or installer.
   */
  use(plugin) {
    usePlugin(plugin, this);
  },

  /**
   * Configures global Kite runtime settings or reads a specific setting.
   *
   * @param {Object|string} [options] - Configuration overrides or setting key to read.
   * @returns {Object|*} Active configuration object or single setting value.
   */
  config(options) {
    if (typeof options === 'string') {
      return getConfig(options);
    }
    if (options && typeof options === 'object') {
      return setConfig(options);
    }
    return config;
  },

  /**
   * Replaces a built-in subsystem, directive, or adapter.
   *
   * @param {string} name - Subsystem or directive identifier (e.g. 'directives.text', 'sanitize').
   * @param {Function} fn - Replacement implementation.
   */
  override(name, fn) {
    if (!name) return () => {};
    const key = String(name).toLowerCase();
    if (key.startsWith('directives.')) {
      return registerDirective(key.slice(11), fn);
    }
    if (key === 'sanitize') {
      setActiveSanitizer(fn);
      return () => setActiveSanitizer(null);
    }
    if (key.startsWith('adapters.') || key.startsWith('api.')) {
      const adapterName = key.includes('.') ? key.split('.')[1] : 'rest';
      return registerAdapter(adapterName, fn);
    }
    return registerDirective(key, fn);
  },

  /**
   * Retrieves the original built-in implementation before any overrides.
   *
   * @param {string} name - Identifier (e.g. 'directives.text', 'sanitize').
   * @returns {Function|Object|undefined}
   */
  original(name) {
    if (!name) return undefined;
    const key = String(name).toLowerCase();
    if (key.startsWith('directives.')) {
      const def = getOriginalDirective(key.slice(11));
      return def ? def.handler : undefined;
    }
    if (key === 'sanitize') {
      return getOriginalSanitizer();
    }
    if (key.startsWith('adapters.')) {
      return getOriginalAdapter(key.split('.')[1]);
    }
    const def = getOriginalDirective(key);
    return def ? def.handler : undefined;
  },

  /**
   * Disables one or more built-in directives or subsystems.
   *
   * @param {string|string[]} names - Subsystems to disable.
   */
  disable(names) {
    const list = Array.isArray(names) ? names : [names];
    for (const item of list) {
      const key = String(item).toLowerCase();
      if (key.startsWith('directives.')) {
        disableDirective(key.slice(11));
      } else if (key === 'routing') {
        config.routing = 'off';
      } else {
        disableDirective(key);
      }
    }
  },

  /**
   * Re-enables one or more previously disabled directives or subsystems.
   *
   * @param {string|string[]} names - Subsystems to re-enable.
   */
  enable(names) {
    const list = Array.isArray(names) ? names : [names];
    for (const item of list) {
      const key = String(item).toLowerCase();
      if (key.startsWith('directives.')) {
        enableDirective(key.slice(11));
      } else if (key === 'routing') {
        config.routing = 'hash';
      } else {
        enableDirective(key);
      }
    }
  },

  /**
   * Inspects the registry, a directive, or a DOM element.
   *
   * @param {string|Element} [target] - Target to inspect.
   * @returns {Object|null}
   */
  inspect(target) {
    if (!target) {
      return {
        directives: Array.from(getDirectivesMap().keys()),
        helpers: Object.keys(helpers),
        rules: Array.from(getAllValidationRules().keys()),
        adapters: Array.from(getAllAdapters().keys()),
        components: Array.from(getComponentsMap().keys()),
        plugins: Array.from(getAllPlugins().keys()),
        hooks: Array.from(getAllHooks().keys()),
        middlewares: getAllMiddlewares().map(m => m.name)
      };
    }
    if (target === 'directives') {
      return getAllDirectives();
    }
    if (typeof target === 'string') {
      const lower = target.toLowerCase();
      const dir = getDirective(lower) || getDirective(target) || getDirective(lower.replace(/^directives\./, ''));
      if (dir) return dir;
      const comp = getComponent(lower) || getComponent(target);
      if (comp) return comp;
      const adapter = getAdapter(lower);
      if (adapter) return adapter;
      return null;
    }
    if (target && (target.nodeType === 1 || typeof target.getAttributeNames === 'function')) {
      return {
        element: target,
        directives: target.getAttributeNames ? target.getAttributeNames().filter(a => a.startsWith('kite-')) : [],
        scope: target._kite?.scope || null,
        unbinder: target._kite?.unbinder || null
      };
    }
    return null;
  },

  /**
   * Inspects application state across stores, models, and global store.
   *
   * @param {string} [path] - Dot-separated path (e.g. 'todos' or 'todos.items').
   * @returns {*}
   */
  state(path) {
    const rootState = {
      global: globalStore,
      stores: getAllStores(),
      models: getAllModels()
    };
    if (!path) return rootState;

    const parts = String(path).split('.');
    const key = parts[0];
    const lowerKey = key.toLowerCase();

    let current = rootState.stores[key] !== undefined ? rootState.stores[key] :
                  (rootState.stores[lowerKey] !== undefined ? rootState.stores[lowerKey] :
                  (rootState.models[key] !== undefined ? rootState.models[key] :
                  (rootState.models[lowerKey] !== undefined ? rootState.models[lowerKey] :
                  rootState.global[key])));

    if (parts.length === 1) return current;

    for (let i = 1; i < parts.length; i++) {
      if (current === undefined || current === null) return undefined;
      current = current[parts[i]];
    }
    return current;
  },

  /**
   * Read-only reflection of all active framework registries.
   */
  get registry() {
    return {
      directives: getDirectivesMap(),
      helpers,
      rules: getAllValidationRules(),
      adapters: getAllAdapters(),
      components: getComponentsMap(),
      plugins: getAllPlugins(),
      hooks: getAllHooks(),
      middlewares: getAllMiddlewares()
    };
  },

  /**
   * Purges all Kite-namespaced persisted keys from localStorage and sessionStorage.
   */
  clear() {
    clearPersistedStorage();
  },

  /**
   * Reads reactive state or a property from a model name, element, or scope.
   *
   * @param {string|Element|Object} target - Target model name, element, or scope.
   * @param {string} [key] - Property key to retrieve.
   * @returns {*}
   */
  get(target, key) {
    let scope = null;
    if (typeof target === 'string') {
      scope = getModel(target) || getStore(target);
    } else if (target && target._kite) {
      scope = target._kite.scope;
    } else if (target && typeof target === 'object') {
      scope = target;
    }
    if (!scope) return undefined;
    if (key === undefined) return scope;

    if (typeof key === 'string' && key.includes('.')) {
      const parts = key.split('.');
      let cur = scope;
      for (const p of parts) {
        if (cur === null || cur === undefined) return undefined;
        cur = cur[p];
      }
      return cur;
    }

    return scope[key];
  },

  /**
   * Updates a reactive property on a model name, element, or scope.
   *
   * @param {string|Element|Object} target - Target model name, element, or scope.
   * @param {string} key - Property key to set.
   * @param {*} val - Value to assign.
   */
  set(target, key, val) {
    let scope = null;
    if (typeof target === 'string') {
      scope = getModel(target) || getStore(target);
    } else if (target && target._kite) {
      scope = target._kite.scope;
    } else if (target && typeof target === 'object') {
      scope = target;
    }
    if (scope && key !== undefined) {
      if (typeof key === 'string' && key.includes('.')) {
        const parts = key.split('.');
        let cur = scope;
        for (let i = 0; i < parts.length - 1; i++) {
          if (cur[parts[i]] === undefined || cur[parts[i]] === null) {
            cur[parts[i]] = {};
          }
          cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = val;
      } else {
        scope[key] = val;
      }
    }
  },

  /**
   * Invokes an action method on a named model or store.
   *
   * @param {string} modelName - Registered model or store name.
   * @param {string} methodName - Name of the method.
   * @param {...*} args - Arguments to pass.
   * @returns {*}
   */
  call(modelName, methodName, ...args) {
    const scope = getModel(modelName) || getStore(modelName);
    if (scope && typeof scope[methodName] === 'function') {
      return scope[methodName](...args);
    }
    warn(`Kite.call: method '${methodName}' not found on model/store '${modelName}'`);
  },

  /**
   * Subscribes to a Kite lifecycle or custom event.
   *
   * @param {string} event - Event name (e.g. 'error', 'route:change').
   * @param {Function} fn - Listener callback.
   */
  on(event, fn) {
    if (typeof window !== 'undefined') {
      const evtName = event.startsWith('kite:') ? event : `kite:${event}`;
      window.addEventListener(evtName, fn);
    }
  },

  /**
   * Unsubscribes from a Kite lifecycle or custom event.
   *
   * @param {string} event - Event name.
   * @param {Function} fn - Listener callback.
   */
  off(event, fn) {
    if (typeof window !== 'undefined') {
      const evtName = event.startsWith('kite:') ? event : `kite:${event}`;
      window.removeEventListener(evtName, fn);
    }
  },

  /**
   * Dispatches a custom Kite event on the window object.
   *
   * @param {string} event - Event name.
   * @param {*} [detail] - Event detail payload.
   * @returns {CustomEvent|undefined}
   */
  emit(event, detail) {
    if (typeof window !== 'undefined') {
      const evtName = event.startsWith('kite:') ? event : `kite:${event}`;
      const customEvent = new CustomEvent(evtName, { detail, bubbles: true, cancelable: true });
      window.dispatchEvent(customEvent);
      return customEvent;
    }
  },

  /**
   * Pauses the automatic DOM MutationObserver.
   */
  pause() {
    disableMutationObserver();
  },

  /**
   * Resumes the automatic DOM MutationObserver.
   */
  resume() {
    enableMutationObserver();
  },

  /**
   * Tears down Kite reactions and directive bindings on a DOM element.
   *
   * @param {Element} el - DOM element to unmount.
   */
  unmount(el) {
    if (el && el._kite && typeof el._kite.unbinder === 'function') {
      el._kite.unbinder();
      delete el._kite;
    }
  },

  /**
   * Teardown entire Kite runtime observers.
   */
  destroy() {
    disableMutationObserver();
    if (typeof document !== 'undefined' && document.body && document.body._kite) {
      document.body._kite.unbinder();
      delete document.body._kite;
    }
  },

  /**
   * Returns a debug snapshot of all active stores and global state.
   * @returns {Object}
   */
  dumpState() {
    return {
      global: globalStore,
      stores: getAllStores(),
      models: getAllModels()
    };
  },

  /**
   * Factory function to instantiate a reactive Scope.
   *
   * @param {Object} [initial={}] - Initial state object.
   * @param {Object} [parent=null] - Optional parent scope.
   * @returns {Proxy} A reactive scope proxy.
   */
  createScope(initial = {}, parent = null) {
    return createScope(initial, parent, globalState);
  },

  /**
   * Scans the document or a container element to bind all Kite directives and components.
   *
   * @param {Element|Document} [root] - Container element to scan.
   * @returns {Function} Teardown unbinder.
   */
  scan(root) {
    const cleanup = scan(root);

    // Remove any kite-cloak attributes to reveal initialized content
    if (typeof document !== 'undefined') {
      const cloaked = document.querySelectorAll('[kite-cloak]');
      for (let i = 0; i < cloaked.length; i++) {
        cloaked[i].removeAttribute('kite-cloak');
      }
    }

    return cleanup;
  },

  /**
   * Global state object. Values set here are accessible across all scopes.
   */
  stateObj: globalState,

  /**
   * Extensible dictionary of helper functions callable inside expressions.
   */
  helpers,

  /**
   * Evaluates an expression string against a scope and helpers.
   */
  evaluate(expr, scope) {
    return evaluateExpression(expr, scope, helpers);
  }
};

// 1. Register all built-in directives
registerBuiltinDirectives();

// 2. Attach Kite to global window in browser environments
if (typeof window !== 'undefined') {
  window.Kite = Kite;

  // Auto-scan on DOM ready
  const autoScan = () => {
    initRouter();
    Kite.scan();
    if (config.autoScan) {
      enableMutationObserver();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoScan, { once: true });
  } else {
    // Document already parsed
    autoScan();
  }
}

export default Kite;
