/**
 * @file Reactive state container for Kite.
 * @module core/scope
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Scope is the core teaching moment of Kite: a simple, transparent reactivity model
 * using JavaScript's native Proxy API without virtual DOM diffing or bytecode compilers.
 *
 * How it works:
 * 1. Reads: When a DOM reactor computes an expression, it registers itself as the active listener.
 * 2. Writes: When state changes (e.g. `count++`), the proxy intercepts `set` and schedules reactors.
 * 3. Inheritance: Child scopes look up values in their parent before falling back to global state.
 */

// Active reactive computation tracking during expression evaluation
let activeReactor = null;

/**
 * Sets or clears the currently executing reactor function for dependency tracking.
 *
 * @param {Function|null} reactor - The reactor function or null to stop tracking.
 */
export function setActiveReactor(reactor) {
  activeReactor = reactor;
}

/**
 * Gets the currently executing reactor.
 * @returns {Function|null}
 */
export function getActiveReactor() {
  return activeReactor;
}

/**
 * Creates a reactive scope from a plain JavaScript object.
 *
 * @param {Object}  [initial={}] - Initial state properties.
 * @param {Object}  [parent=null] - Optional parent scope for prototype-style lookup chain.
 * @param {Object}  [globalState={}] - Optional reference to global Kite.state.
 * @returns {Proxy} A reactive proxy that notifies registered reactors on write.
 *
 * @example
 * const scope = createScope({ count: 0 });
 * scope.count++; // triggers registered subscribers
 */
export function createScope(initial = {}, parent = null, globalState = {}) {
  const target = Object.assign({}, initial);

  // Map of property key -> Set of subscriber reactor functions
  const subscribers = new Map();

  /**
   * Helper to notify subscribers for a specific key.
   * @param {string} prop - The changed property name.
   */
  function notify(prop) {
    // Notify property-specific subscribers
    if (subscribers.has(prop)) {
      const set = subscribers.get(prop);
      for (const reactor of Array.from(set)) {
        reactor();
      }
    }
    // Notify wildcard subscribers (e.g. array mutations, structural changes)
    if (subscribers.has('*')) {
      const allSet = subscribers.get('*');
      for (const reactor of Array.from(allSet)) {
        reactor();
      }
    }
  }

  /**
   * Wraps nested objects and arrays in reactive proxies so deep mutations notify subscribers.
   */
  function wrapNested(val, propKey) {
    const isDomNode = typeof Node !== 'undefined' && val instanceof Node;
    if (val !== null && typeof val === 'object' && !isDomNode) {
      return new Proxy(val, {
        get(t, k, r) {
          if (k === '__proto__' || k === 'prototype' || k === 'constructor') {
            return undefined;
          }
          if (activeReactor) {
            if (!subscribers.has(propKey)) {
              subscribers.set(propKey, new Set());
            }
            subscribers.get(propKey).add(activeReactor);
          }
          const nested = Reflect.get(t, k, r);
          if (Array.isArray(t) && typeof nested === 'function') {
            if (['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].includes(k)) {
              return function(...args) {
                const res = Array.prototype[k].apply(t, args);
                notify(propKey);
                notify('*');
                return res;
              };
            }
          }
          return wrapNested(nested, propKey);
        },
        set(t, k, v, r) {
          if (k === '__proto__' || k === 'prototype' || k === 'constructor') {
            return false;
          }
          const res = Reflect.set(t, k, v, r);
          notify(propKey);
          notify('*');
          return res;
        }
      });
    }
    return val;
  }

  const handler = {
    get(t, prop, receiver) {
      // Forbidden prototype pollution identifiers
      if (prop === '__proto__' || prop === 'prototype' || prop === 'constructor') {
        return undefined;
      }

      // Reserved scope utility properties
      if (prop === '$parent') return parent;
      if (prop === '$raw') return target;
      if (prop === '$notify') return notify;
      if (prop === '$subscribe') {
        return (key, fn) => {
          if (!subscribers.has(key)) subscribers.set(key, new Set());
          subscribers.get(key).add(fn);
          return () => subscribers.get(key)?.delete(fn);
        };
      }

      // 1. Dependency tracking: register active reactor if one is currently running
      if (activeReactor && typeof prop === 'string') {
        if (!subscribers.has(prop)) {
          subscribers.set(prop, new Set());
        }
        subscribers.get(prop).add(activeReactor);
      }

      // 2. Lookup chain: local target -> parent scope -> globalState
      if (prop in t) {
        return wrapNested(Reflect.get(t, prop, receiver), prop);
      }
      if (parent && prop in parent) {
        return parent[prop];
      }
      if (globalState && prop in globalState) {
        return globalState[prop];
      }

      return undefined;
    },

    set(t, prop, value, receiver) {
      // Block prototype pollution
      if (prop === '__proto__' || prop === 'prototype' || prop === 'constructor') {
        return false;
      }

      // 1. If property exists in parent (and not in local target), write to parent
      if (!(prop in t) && parent && prop in parent) {
        parent[prop] = value;
        return true;
      }

      // 2. Otherwise write to local scope
      const oldValue = t[prop];
      const success = Reflect.set(t, prop, value, receiver);

      // 3. Notify reactors if value changed or if it's an object/array
      if (oldValue !== value || typeof value === 'object') {
        notify(prop);
      }

      return success;
    },

    has(t, prop) {
      if (prop === '__proto__' || prop === 'prototype' || prop === 'constructor') {
        return false;
      }
      if (prop in t) return true;
      if (parent && prop in parent) return true;
      if (globalState && prop in globalState) return true;
      return false;
    }
  };

  return new Proxy(target, handler);
}
