/**
 * @file Built-in `kite-model` directive.
 * @module directives/model
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Two-way data binding for input, textarea, and select elements.
 * Supports `.number`, `.trim`, and `.lazy` modifiers.
 *
 * Supported element types:
 * - `<input type="text">`, `<textarea>`: Binds `value` with `input` (or `change` if `.lazy`).
 * - `<input type="number">`, `<input type="range">`: Casts value to numeric.
 * - `<input type="checkbox">`: Binds boolean `checked` or array of values.
 * - `<input type="radio">`: Binds matching selected value.
 * - `<select>` & `<select multiple>`: Binds selected value or array of values.
 * - `<input type="file">`: Binds File or FileList.
 */

import { evaluateExpression, BANNED_IDENTIFIERS } from '../utils/expr.js';
import { createReaction } from '../core/reactor.js';
import { warn } from '../utils/log.js';

/**
 * Handles `kite-model` directive.
 *
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} el - Form element.
 * @param {string} propName - State property identifier to bind.
 * @param {Object} scope - Current reactive scope.
 * @param {string|null} [arg=null] - Optional argument.
 * @param {Array<string>} [modifiers=[]] - Modifiers (e.g. ['number', 'trim', 'lazy']).
 * @returns {Function} Cleanup unbinder.
 */
export function modelDirective(el, propName, scope, arg, modifiers = []) {
  if (!scope) {
    warn(`[Kite] kite-model="${propName}" bound to element without an active scope or model.`);
    return () => {};
  }

  const tagName = el.tagName.toLowerCase();
  const type = (el.type || 'text').toLowerCase();

  const isNumber = modifiers.includes('number') || type === 'number' || type === 'range';
  const isTrim = modifiers.includes('trim');
  const isLazy = modifiers.includes('lazy');

  // Flag to avoid feedback loops when typing
  let isComposing = false;

  const getPropVal = () => {
    if (!scope) return undefined;
    if (!propName.includes('.')) {
      if (BANNED_IDENTIFIERS.has(propName)) return undefined;
      return scope[propName];
    }
    const parts = propName.split('.');
    let cur = scope;
    for (const p of parts) {
      if (BANNED_IDENTIFIERS.has(p)) return undefined;
      if (cur === null || cur === undefined) return undefined;
      cur = cur[p];
    }
    return cur;
  };

  const setPropVal = (val) => {
    if (!scope) return;
    if (!propName.includes('.')) {
      if (BANNED_IDENTIFIERS.has(propName)) {
        warn(`Access to forbidden property '${propName}' in kite-model was blocked.`);
        return;
      }
      scope[propName] = val;
      return;
    }
    const parts = propName.split('.');
    for (const p of parts) {
      if (BANNED_IDENTIFIERS.has(p)) {
        warn(`Access to forbidden property '${p}' in kite-model was blocked.`);
        return;
      }
    }
    let cur = scope;
    for (let i = 0; i < parts.length - 1; i++) {
      if (cur[parts[i]] === null || cur[parts[i]] === undefined) {
        cur[parts[i]] = {};
      }
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  };

  // 1. Checkbox element
  if (tagName === 'input' && type === 'checkbox') {
    const onCheckboxChange = () => {
      const currentVal = getPropVal();
      if (Array.isArray(currentVal)) {
        const itemVal = isNumber ? Number(el.value) : el.value;
        const set = new Set(currentVal);
        if (el.checked) {
          set.add(itemVal);
        } else {
          set.delete(itemVal);
        }
        setPropVal(Array.from(set));
      } else {
        setPropVal(el.checked);
      }
    };

    el.addEventListener('change', onCheckboxChange);

    const cleanupReaction = createReaction(() => {
      const val = getPropVal();
      if (Array.isArray(val)) {
        const itemVal = isNumber ? Number(el.value) : el.value;
        el.checked = val.includes(itemVal) || val.includes(String(itemVal));
      } else {
        el.checked = Boolean(val);
      }
    });

    return () => {
      el.removeEventListener('change', onCheckboxChange);
      cleanupReaction();
    };
  }

  // 2. Radio element
  if (tagName === 'input' && type === 'radio') {
    const onRadioChange = () => {
      if (el.checked) {
        setPropVal(isNumber ? Number(el.value) : el.value);
      }
    };

    el.addEventListener('change', onRadioChange);

    const cleanupReaction = createReaction(() => {
      const current = getPropVal();
      el.checked = String(current) === String(el.value);
    });

    return () => {
      el.removeEventListener('change', onRadioChange);
      cleanupReaction();
    };
  }

  // 3. File input element
  if (tagName === 'input' && type === 'file') {
    const onFileChange = () => {
      setPropVal(el.multiple ? Array.from(el.files || []) : (el.files ? el.files[0] : null));
    };

    el.addEventListener('change', onFileChange);
    return () => el.removeEventListener('change', onFileChange);
  }

  // 4. Multi-select element
  if (tagName === 'select' && el.multiple) {
    const onMultiSelectChange = () => {
      const selected = [];
      for (let i = 0; i < el.options.length; i++) {
        const opt = el.options[i];
        if (opt.selected) {
          selected.push(isNumber ? Number(opt.value) : opt.value);
        }
      }
      setPropVal(selected);
    };

    el.addEventListener('change', onMultiSelectChange);

    const cleanupReaction = createReaction(() => {
      const val = getPropVal() || [];
      for (let i = 0; i < el.options.length; i++) {
        const opt = el.options[i];
        opt.selected = Array.isArray(val) && val.some(v => String(v) === String(opt.value));
      }
    });

    return () => {
      el.removeEventListener('change', onMultiSelectChange);
      cleanupReaction();
    };
  }

  // 5. Standard text, textarea, single select
  const eventType = (tagName === 'select' || isLazy) ? 'change' : 'input';

  const onInput = () => {
    isComposing = true;
    let nextVal = el.value;

    if (isTrim && typeof nextVal === 'string') {
      nextVal = nextVal.trim();
    }
    if (isNumber) {
      nextVal = nextVal === '' ? '' : Number(nextVal);
    }

    setPropVal(nextVal);
    isComposing = false;
  };

  el.addEventListener(eventType, onInput);

  const cleanupReaction = createReaction(() => {
    const val = getPropVal();
    if (!isComposing) {
      const formatted = val === null || val === undefined ? '' : String(val);
      if (el.value !== formatted) {
        el.value = formatted;
      }
    }
  });

  return () => {
    el.removeEventListener(eventType, onInput);
    cleanupReaction();
  };
}
