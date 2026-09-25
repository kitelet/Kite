/**
 * @file Form validation directives for Kite.
 * @module directives/validate
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Provides declarative form validation rules (`kite-validate`, `kite-required`,
 * `kite-pattern`, `kite-min`, `kite-max`, `kite-rule`, `kite-error`) and manages reactive
 * `form.valid`, `form.dirty`, `form.validating`, and `form.errors` state.
 * Supports sync and async custom validation rules via `Kite.rule()`.
 */

import { registerDirective } from '../core/registry.js';
import { createReaction } from '../core/reactor.js';

// Custom validation rule registry
const customRules = new Map();

/**
 * Registers a named custom validation rule.
 *
 * @param {string} name - Rule name.
 * @param {Function} validator - (value, arg, ctx) => true | string | Promise<true | string>.
 * @returns {Function} Unregister function.
 */
export function registerValidationRule(name, validator) {
  if (name && typeof validator === 'function') {
    const key = name.toLowerCase();
    customRules.set(key, validator);
    return () => unregisterValidationRule(key);
  }
  return () => {};
}

/**
 * Unregisters a custom validation rule.
 *
 * @param {string} name - Rule name.
 * @returns {boolean}
 */
export function unregisterValidationRule(name) {
  if (!name) return false;
  return customRules.delete(name.toLowerCase());
}

/**
 * Retrieves a registered validation rule by name.
 *
 * @param {string} name
 * @returns {Function|undefined}
 */
export function getValidationRule(name) {
  if (!name) return undefined;
  return customRules.get(name.toLowerCase());
}

/**
 * Retrieves all registered validation rules.
 * @returns {Map<string, Function>}
 */
export function getAllValidationRules() {
  return customRules;
}

registerDirective('validate', (el, expr, scope) => {
  if (!scope) return () => {};

  if (!scope.form) {
    scope.form = {
      valid: true,
      dirty: false,
      validating: false,
      errors: {}
    };
  }

  let activeValidationId = 0;

  const validateAll = () => {
    const inputs = el.querySelectorAll ? el.querySelectorAll('input, select, textarea') : [];
    let allValid = true;
    const errors = {};
    const asyncValidations = [];
    const currentValidationId = ++activeValidationId;

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const name = input.getAttribute('name') || input.getAttribute('kite-model') || `field_${i}`;
      const val = input.value;
      let fieldError = null;

      if (input.hasAttribute('kite-required') && (!val || !String(val).trim())) {
        fieldError = `${name} is required.`;
      } else if (input.hasAttribute('kite-pattern')) {
        const pattern = new RegExp(input.getAttribute('kite-pattern'));
        if (val && !pattern.test(val)) {
          fieldError = `${name} is invalid.`;
        }
      } else if (input.hasAttribute('kite-min')) {
        const min = Number(input.getAttribute('kite-min'));
        if (Number(val) < min) fieldError = `${name} must be at least ${min}.`;
      } else if (input.hasAttribute('kite-max')) {
        const max = Number(input.getAttribute('kite-max'));
        if (Number(val) > max) fieldError = `${name} must be at most ${max}.`;
      }

      // Check custom rules: kite-rule="ruleName" or kite-rule="ruleName:argument"
      if (!fieldError && input.hasAttribute('kite-rule')) {
        const ruleAttr = input.getAttribute('kite-rule');
        const [ruleName, ruleArg] = ruleAttr.split(':');
        const ruleFn = customRules.get(ruleName.toLowerCase());

        if (ruleFn) {
          const ctx = {
            scope,
            el: input,
            api: scope.api || null
          };
          try {
            const ruleRes = ruleFn(val, ruleArg, ctx);
            if (ruleRes && typeof ruleRes.then === 'function') {
              // Async rule
              asyncValidations.push(
                ruleRes.then((asyncRes) => {
                  if (asyncRes !== true) {
                    return { name, error: typeof asyncRes === 'string' ? asyncRes : `${name} is invalid.` };
                  }
                  return null;
                }).catch((err) => ({ name, error: err.message || `${name} validation failed.` }))
              );
            } else if (ruleRes !== true) {
              fieldError = typeof ruleRes === 'string' ? ruleRes : `${name} is invalid.`;
            }
          } catch (err) {
            fieldError = err.message || `${name} validation failed.`;
          }
        }
      }

      if (fieldError) {
        allValid = false;
        errors[name] = fieldError;
      }
    }

    scope.form.valid = allValid && asyncValidations.length === 0;
    scope.form.errors = { ...errors };

    if (asyncValidations.length > 0) {
      scope.form.validating = true;
      Promise.all(asyncValidations).then((results) => {
        if (currentValidationId !== activeValidationId) return; // Stale check
        let stillValid = allValid;
        for (const res of results) {
          if (res && res.error) {
            stillValid = false;
            scope.form.errors[res.name] = res.error;
          }
        }
        scope.form.valid = stillValid;
        scope.form.validating = false;
      });
    } else {
      scope.form.validating = false;
    }
  };

  const onInput = () => {
    scope.form.dirty = true;
    validateAll();
  };

  el.addEventListener('input', onInput);
  el.addEventListener('change', onInput);

  // Initial validation
  validateAll();

  return () => {
    el.removeEventListener('input', onInput);
    el.removeEventListener('change', onInput);
  };
}, { priority: 960 });

// Directive to display error message for a specific field: <span kite-error="email"></span>
registerDirective('error', (el, expr, scope, arg) => {
  const fieldName = arg || expr;
  return createReaction(() => {
    if (scope && scope.form && scope.form.errors) {
      const err = scope.form.errors[fieldName];
      el.textContent = err || '';
      el.style.display = err ? '' : 'none';
    }
  });
}, { priority: 400 });
