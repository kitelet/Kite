/**
 * @file Built-in directives registration entry point for Kite.
 * @module directives/index
 * @author Kite Contributors
 * @license MIT
 */

import { registerDirective } from '../core/registry.js';
import { textDirective } from './text.js';
import { bindDirective } from './bind.js';
import { modelDirective } from './model.js';
import { ifDirective } from './if.js';
import { forDirective } from './for.js';
import { onDirective } from './on.js';
import { showDirective } from './show.js';
import { classDirective } from './class.js';
import { initDirective } from './init.js';

// Additional capability directives
import './html.js';
import './style.js';
import './computed.js';
import './watch.js';
import './persist.js';
import './reset.js';
import './shortcut.js';
import './emit.js';
import './validate.js';
import './format.js';
import './copy.js';
import './poll.js';

/**
 * Registers all core built-in directives in order of execution priority.
 */
export function registerBuiltinDirectives() {
  // 1. Structural / Flow Directives (Highest priority, control mounting)
  registerDirective('if', ifDirective, { priority: 100, isTerminal: true });
  registerDirective('for', forDirective, { priority: 90, isTerminal: true });

  // 2. Data Binding & Form Directives
  registerDirective('model', modelDirective, { priority: 20 });

  // 3. Content, Attribute, and Event Directives
  registerDirective('text', textDirective, { priority: 10 });
  registerDirective('bind', bindDirective, { priority: 10 });
  registerDirective('on', onDirective, { priority: 10 });
  registerDirective('show', showDirective, { priority: 10 });
  registerDirective('class', classDirective, { priority: 10 });

  // 4. Mount lifecycle
  registerDirective('init', initDirective, { priority: 5 });
}
