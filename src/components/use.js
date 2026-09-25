/**
 * @file Component instantiation for `<kite-use>`.
 * @module components/use
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Instantiates a registered component into the DOM.
 * Attributes are passed as props, slots are resolved, and an isolated reactive scope is created.
 * Supports both HTML-declared components and JS components with `props`, `setup()`, and `style`.
 */

import { getComponent } from './component.js';
import { resolveSlots } from './slot.js';
import { createScope } from '../core/scope.js';
import { evaluateExpression, parseObjectLiteral } from '../utils/expr.js';
import { triggerHook } from '../core/hooks.js';
import { warn } from '../utils/log.js';

const MAX_COMPONENT_DEPTH = 32;
const activeMountStack = [];

/**
 * Instantiates a component at a `<kite-use>` element site.
 *
 * @param {Element} hostEl - The `<kite-use>` DOM element.
 * @param {Object} [parentScope=null] - Enclosing reactive scope.
 * @param {Function} scanElement - Scanner callback to bind directives on rendered nodes.
 * @returns {Function} Cleanup function when unmounting.
 */
export function mountComponent(hostEl, parentScope = null, scanElement = null) {
  if (!hostEl || typeof hostEl.getAttribute !== 'function') return () => {};
  const componentName = hostEl.getAttribute('name');
  if (!componentName) {
    warn(`Found <kite-use> without a 'name' attribute.`, hostEl);
    return () => {};
  }

  const comp = getComponent(componentName);
  if (!comp) {
    warn(`Component '${componentName}' not found. Make sure <kite-component name="${componentName}"> is defined.`, hostEl);
    return () => {};
  }

  if (activeMountStack.length >= MAX_COMPONENT_DEPTH || activeMountStack.filter(n => n === componentName).length >= 5) {
    warn(`[Kite] Circular component detected for '${componentName}' (depth: ${activeMountStack.length}). Aborting component mount to avoid infinite recursion.`, hostEl);
    hostEl.innerHTML = `<!-- circular component prevented: ${componentName} -->`;
    return () => {};
  }

  activeMountStack.push(componentName);

  try {
    triggerHook('before:mount', hostEl, componentName);

    const isDescriptor = Boolean(comp && comp.template && typeof comp === 'object' && !(typeof Node !== 'undefined' && comp instanceof Node));
    const template = isDescriptor ? comp.template : comp;

    // 1. Extract props from hostEl attributes
    const props = {};
    const attrs = hostEl.attributes || [];
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
    const name = attr.name;
    const value = attr.value;

    if (name === 'name' || name.startsWith('kite-for') || name === 'kite-if') {
      continue; // Handled at outer level
    }

    // Dynamic prop binding: kite-bind:title="expr"
    if (name.startsWith('kite-bind:')) {
      const propKey = name.slice(10);
      props[propKey] = evaluateExpression(value, parentScope);
    } else if (!name.startsWith('kite-')) {
      // Check if value is an object or array expression: user="{ name: 'Ada' }"
      if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
        try {
          props[name] = evaluateExpression(value, parentScope);
        } catch {
          props[name] = value;
        }
      } else {
        // Static string prop: title="Hello"
        props[name] = value;
      }
    }
  }

  // 2. Validate descriptor props if declared
  if (isDescriptor && comp.props) {
    for (const [propKey, propDef] of Object.entries(comp.props)) {
      if (props[propKey] === undefined && propDef.default !== undefined) {
        props[propKey] = typeof propDef.default === 'function' ? propDef.default() : propDef.default;
      }
      if (propDef.required && props[propKey] === undefined) {
        warn(`Component '${componentName}' requires prop '${propKey}', but it was not provided.`);
      }
    }
  }

  // 3. Create isolated scope inheriting from parent
  const componentScope = createScope(props, parentScope);

  // 4. Inject scoped CSS if defined
  let styleEl = null;
  if (isDescriptor && comp.style && typeof document !== 'undefined') {
    const styleId = `kite-style-${componentName.toLowerCase()}`;
    if (!document.getElementById(styleId)) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = comp.style;
      document.head.appendChild(styleEl);
    }
  }

  // 5. Run JS setup() if defined
  const emit = (event, detail) => {
    const customEvt = new CustomEvent(event, { detail, bubbles: true, cancelable: true });
    hostEl.dispatchEvent(customEvt);
    return customEvt;
  };

  if (isDescriptor && typeof comp.setup === 'function') {
    try {
      const setupResult = comp.setup(props, { emit, scope: componentScope });
      if (setupResult && typeof setupResult === 'object') {
        for (const [k, v] of Object.entries(setupResult)) {
          componentScope[k] = v;
        }
      }
    } catch (err) {
      warn(`Error executing setup() in component '${componentName}':`, err);
    }
  }

  // 6. Clone template content
  let clone;
  if (template.content && typeof template.content.cloneNode === 'function') {
    clone = template.content.cloneNode(true);
  } else if (typeof document !== 'undefined' && typeof document.createDocumentFragment === 'function') {
    clone = document.createDocumentFragment();
    const children = Array.from(template.childNodes || []);
    for (const c of children) {
      if (typeof c.cloneNode === 'function') {
        clone.appendChild(c.cloneNode(true));
      }
    }
  } else {
    clone = { childNodes: [] };
  }

  // 7. Resolve slots
  resolveSlots(clone, hostEl);

  // 8. Mount inside hostEl
  hostEl.innerHTML = '';
  if (clone.nodeType === 11 || (clone.childNodes && !clone.tagName)) {
    const fragChildren = Array.from(clone.childNodes || clone.children || []);
    for (const c of fragChildren) {
      if (typeof hostEl.appendChild === 'function') hostEl.appendChild(c);
    }
  } else if (typeof hostEl.appendChild === 'function') {
    hostEl.appendChild(clone);
  }

  // 9. Scan children with component scope
  let cleanupChildren = () => {};
  if (typeof scanElement === 'function') {
    const cleanups = [];
    let child = hostEl.firstElementChild;
    while (child) {
      const unbind = scanElement(child, componentScope);
      if (typeof unbind === 'function') cleanups.push(unbind);
      child = child.nextElementSibling;
    }
    cleanupChildren = () => {
      for (const unbind of cleanups) unbind();
    };
  }

  triggerHook('after:mount', hostEl, componentName);

  return () => {
    triggerHook('before:unmount', hostEl, componentName);
    cleanupChildren();
    triggerHook('after:unmount', hostEl, componentName);
  };
} catch (err) {
  warn(`[Kite] Error mounting component '${componentName}': ${err.message}`, hostEl);
  hostEl.innerHTML = `<!-- component mount error: ${componentName} -->`;
  return () => {};
} finally {
  activeMountStack.pop();
}
}
