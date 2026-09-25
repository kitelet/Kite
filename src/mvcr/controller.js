/**
 * @file Controller and Action primitives for Kite MVCR architecture.
 * @module mvcr/controller
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Names behavior so views can call actions cleanly without inlining logic.
 * Attaches action handlers directly to the target model scope.
 *
 * @example
 * <kite-controller model="todos">
 *   <kite-action name="add" run="add(draft); draft = ''"></kite-action>
 *   <kite-action name="clear" run="clear()"></kite-action>
 * </kite-controller>
 */

import { getModel } from './model.js';
import { evaluateExpression } from '../utils/expr.js';
import { createScope } from '../core/scope.js';
import { warn } from '../utils/log.js';

/**
 * Scans a `<kite-controller>` and attaches its `<kite-action>` definitions to the model.
 *
 * @param {Element} controllerEl - The `<kite-controller>` DOM element.
 */
export function processControllerDefinition(controllerEl) {
  const modelName = controllerEl.getAttribute('model');
  if (!modelName) {
    warn(`Found <kite-controller> without a 'model' attribute.`, controllerEl);
    return;
  }

  const modelScope = getModel(modelName);
  if (!modelScope) {
    warn(`Controller target model '${modelName}' not found. Ensure <kite-model name="${modelName}"> precedes controller.`, controllerEl);
    return;
  }

  const actions = controllerEl.querySelectorAll('kite-action');
  for (let i = 0; i < actions.length; i++) {
    const actionEl = actions[i];
    const actionName = actionEl.getAttribute('name');
    const runExpr = actionEl.getAttribute('run');

    if (actionName && runExpr) {
      // Define action method on the model scope
      modelScope[actionName] = (...args) => {
        // Pass positional arguments as arg0, arg1 or $args in a local scope
        const local = { $args: args };
        args.forEach((a, idx) => {
          local[`arg${idx}`] = a;
        });
        // Provide underlying model methods so action delegation (e.g. run="add()") calls the model method without recursion
        const methods = modelScope.$methods || {};
        const actionScope = createScope(Object.assign({}, methods, local), modelScope);
        return evaluateExpression(runExpr, actionScope);
      };
    }
  }

  controllerEl.style.display = 'none';
}
