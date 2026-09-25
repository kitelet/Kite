/**
 * @file DOM scanner and directive binder for Kite.
 * @module core/scanner
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Traverses the DOM tree to locate `kite-*` attributes and custom tags,
 * wires up scopes, schedules reactions, and invokes directive handlers.
 */

import { parseElementDirectives } from './parser.js';
import { getDirective } from './registry.js';
import { createScope } from './scope.js';
import { parseObjectLiteral } from '../utils/expr.js';
import { processComponentDefinition } from '../components/component.js';
import { mountComponent } from '../components/use.js';
import { processModelDefinition, getModel } from '../mvcr/model.js';
import { processControllerDefinition } from '../mvcr/controller.js';
import { processView } from '../mvcr/view.js';
import { processRouteDefinition, setOutlet } from '../mvcr/route.js';
import { processInclude } from './include.js';
import { processApiDefinition } from '../api/api-element.js';
import { processStoreDefinition, globalStore } from './store.js';
import { processConfigDefinition, config, getElementConfig } from './config.js';
import { mountErrorBoundary } from '../components/try-catch.js';
import { processLinkElement } from '../mvcr/route.js';
import { triggerHook } from './hooks.js';
import { error, warn } from '../utils/log.js';

// WeakMap associating DOM elements with their bound cleanup unbinders
const elementUnbinders = new WeakMap();

/**
 * Scans and binds a single DOM element and optionally its child tree.
 *
 * @param {Element} el - DOM element to bind.
 * @param {Object} [parentScope=null] - Enclosing reactive scope.
 * @returns {Function} Cleanup function to tear down all registered listeners/reactors on this subtree.
 */
export function scanElement(el, parentScope = null) {
  if (!el || el.nodeType !== 1) return () => {};

  // Escape hatch: skip elements and subtrees marked with kite-skip
  if (el.hasAttribute && el.hasAttribute('kite-skip')) {
    return () => {};
  }

  const cleanups = [];
  let currentScope = parentScope;
  const tag = (el.tagName && el.tagName.toLowerCase()) || '';

  // Strip cloak attribute if present to reveal compiled DOM
  if (el.hasAttribute && el.hasAttribute('kite-cloak')) {
    el.removeAttribute('kite-cloak');
  }

  if (tag === 'kite-config') {
    processConfigDefinition(el);
    return () => {};
  }
  if (tag === 'kite-try') {
    const unbind = mountErrorBoundary(el, currentScope, scanElement);
    if (typeof unbind === 'function') cleanups.push(unbind);
    return () => {
      for (const u of cleanups) u();
    };
  }

  if (tag === 'kite-include') {
    processInclude(el, scanElement);
    return () => {};
  }
  if (tag === 'kite-api') {
    processApiDefinition(el);
    return () => {};
  }
  if (tag === 'kite-component') {
    processComponentDefinition(el);
    return () => {};
  }
  if (tag === 'kite-model') {
    processModelDefinition(el);
    return () => {};
  }
  if (tag === 'kite-controller') {
    processControllerDefinition(el);
    return () => {};
  }
  if (tag === 'kite-route') {
    processRouteDefinition(el);
    return () => {};
  }
  if (tag === 'kite-store') {
    processStoreDefinition(el);
    return () => {};
  }
  if (tag === 'kite-link') {
    processLinkElement(el);
  }
  if (tag === 'kite-fragment') {
    el.style.display = 'contents';
  }
  if (tag === 'kite-view') {
    const unbind = processView(el, scanElement);
    if (typeof unbind === 'function') cleanups.push(unbind);
    return () => {
      for (const u of cleanups) u();
    };
  }
  if (tag === 'kite-outlet') {
    setOutlet(el, scanElement);
    return () => {};
  }
  if (tag === 'kite-use') {
    // If element has structural directives like kite-for or kite-if, let directives execute first!
    if (!el.hasAttribute('kite-for') && !el.hasAttribute('kite-if')) {
      const unmount = mountComponent(el, parentScope, scanElement);
      if (typeof unmount === 'function') cleanups.push(unmount);
      return () => {
        for (const u of cleanups) u();
      };
    }
  }

  // 2. Handle `kite-view` and `kite-scope` attributes
  if (el.hasAttribute('kite-view')) {
    const viewAttr = el.getAttribute('kite-view');
    const modelName = viewAttr || el.getAttribute('model');
    if (modelName) {
      const modelScope = getModel(modelName);
      if (modelScope) {
        currentScope = modelScope;
      }
    }
  }

  if (el.hasAttribute('kite-scope')) {
    const rawScope = el.getAttribute('kite-scope');
    const initialData = parseObjectLiteral(rawScope);
    currentScope = createScope(initialData, currentScope || parentScope, globalStore);
  }

  // 3. Parse and sort all directives on this element by priority
  const directives = parseElementDirectives(el);

  directives.sort((a, b) => {
    const defA = getDirective(a.name);
    const defB = getDirective(b.name);
    const prioA = defA ? defA.priority : 0;
    const prioB = defB ? defB.priority : 0;
    return prioB - prioA;
  });

  let isTerminal = false;
  const elConfig = getElementConfig(el, config);

  for (const dir of directives) {
    if (dir.name === 'scope' || dir.name === 'else' || dir.name === 'view') {
      continue; // Handled specially
    }

    // Selective filtering via Kite.config({ only: [...] })
    if (elConfig.only && !elConfig.only.includes(dir.name)) {
      continue;
    }

    const def = getDirective(dir.name);
    if (def) {
      if (def.isTerminal) {
        isTerminal = true;
      }

      const ctx = {
        attr: dir.rawName,
        name: dir.name,
        config: elConfig,
        arg: dir.arg,
        modifiers: dir.modifiers,
        warn,
        error
      };

      const executeDirective = () => {
        try {
          return def.handler(
            el,
            dir.expression,
            currentScope,
            dir.arg,
            dir.modifiers,
            scanElement, // pass scanner for structural recursion
            ctx
          );
        } catch (err) {
          error(`Failed to execute directive 'kite-${dir.name}':`, err);
        }
      };

      const cleanup = executeDirective();
      if (typeof cleanup === 'function') {
        cleanups.push(cleanup);
      }

      // Re-run on specified DOM events if defined: opts.events = ['input']
      if (def.events && def.events.length > 0 && !def.once) {
        for (const evtName of def.events) {
          const eventListener = () => {
            executeDirective();
          };
          el.addEventListener(evtName, eventListener);
          cleanups.push(() => el.removeEventListener(evtName, eventListener));
        }
      }

      // If this directive takes over rendering children (e.g. if, for), stop processing remaining directives
      if (isTerminal) {
        break;
      }
    }
  }

  // 4. Unless a terminal directive took control, recursively scan child elements
  if (!isTerminal) {
    let child = el.firstElementChild;
    while (child) {
      const nextSibling = child.nextElementSibling;
      if (!child._kite) {
        const childCleanup = scanElement(child, currentScope);
        if (typeof childCleanup === 'function') {
          cleanups.push(childCleanup);
        }
      }
      child = nextSibling;
    }

    // Also scan open shadow DOM if present
    if (el.shadowRoot) {
      let shadowChild = el.shadowRoot.firstElementChild;
      while (shadowChild) {
        const nextSibling = shadowChild.nextElementSibling;
        const shadowCleanup = scanElement(shadowChild, currentScope);
        if (typeof shadowCleanup === 'function') {
          cleanups.push(shadowCleanup);
        }
        shadowChild = nextSibling;
      }
    }
  }

  const unbindAll = () => {
    for (const unbind of cleanups) {
      try {
        unbind();
      } catch (err) {
        error(`Error tearing down directive unbinder:`, err);
      }
    }
  };

  elementUnbinders.set(el, unbindAll);

  // Attach back-reference escape hatch for coexistence with external JS
  el._kite = {
    scope: currentScope,
    unbinder: unbindAll
  };

  return unbindAll;
}

/**
 * Scans a root DOM node (or document.body by default) and initializes all Kite reactive regions.
 *
 * Runs a pre-discovery pass for declarations (<kite-component>, <kite-model>, <kite-route>)
 * before instantiating active components and routes.
 *
 * @param {Element|Document} [root=document.body] - Root element to start scanning from.
 * @returns {Function} Teardown function for the entire scanned tree.
 */
export function scan(root = null) {
  const targetRoot = root || (typeof document !== 'undefined' ? document.body : null);
  if (!targetRoot) return () => {};

  triggerHook('before:scan', targetRoot);

  // Pre-discovery pass: Register definitions regardless of layout order
  const definitions = targetRoot.querySelectorAll(
    'kite-config, kite-store, kite-include, kite-api, kite-component, kite-model, kite-controller, kite-route, kite-view[name]'
  );
  for (let i = 0; i < definitions.length; i++) {
    const node = definitions[i];
    const tag = node.tagName.toLowerCase();
    if (tag === 'kite-config') processConfigDefinition(node);
    else if (tag === 'kite-store') processStoreDefinition(node);
    else if (tag === 'kite-include') processInclude(node, scanElement);
    else if (tag === 'kite-api') processApiDefinition(node);
    else if (tag === 'kite-component') processComponentDefinition(node);
    else if (tag === 'kite-model') processModelDefinition(node);
    else if (tag === 'kite-controller') processControllerDefinition(node);
    else if (tag === 'kite-route') processRouteDefinition(node);
    else if (tag === 'kite-view') processView(node, scanElement);
  }

  const cleanup = scanElement(targetRoot, null);
  triggerHook('after:scan', targetRoot);
  return cleanup;
}

let mutationObserver = null;

/**
 * Automatically observes and scans dynamically inserted HTML subtrees.
 */
export function enableMutationObserver() {
  if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return;
  if (mutationObserver) return;

  mutationObserver = new MutationObserver((mutations) => {
    for (let i = 0; i < mutations.length; i++) {
      const added = mutations[i].addedNodes;
      for (let j = 0; j < added.length; j++) {
        const node = added[j];
        if (node.nodeType === 1 && !node.hasAttribute('kite-skip') && !node._kite) {
          scanElement(node, null);
        }
      }
    }
  });

  mutationObserver.observe(document.body, { childList: true, subtree: true });
}

/**
 * Disables the automatic mutation observer.
 */
export function disableMutationObserver() {
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
}
