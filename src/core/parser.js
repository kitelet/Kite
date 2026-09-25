/**
 * @file Attribute grammar parser for Kite.
 * @module core/parser
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Parses DOM attributes following the Kite grammar:
 * `kite-<verb>` or `kite-on-<event>` with optional arguments and modifiers.
 *
 * Examples:
 * - `kite-text="count"`
 * - `kite-bind:src="avatar"`
 * - `kite-class:active="isActive"`
 * - `kite-on-click.prevent="count++"`
 * - `kite-for="item in items"`
 */

import { warn, findClosest } from '../utils/log.js';
import { hasDirective } from './registry.js';

/**
 * @typedef {Object} ParsedDirective
 * @property {string} rawName - The full attribute name (e.g. "kite-on-click.prevent").
 * @property {string} name - Base directive verb (e.g. "on", "bind", "text").
 * @property {string|null} arg - Directive argument (e.g. "click" in kite-on-click, "src" in kite-bind:src).
 * @property {Array<string>} modifiers - Dot modifiers (e.g. ["prevent", "stop"]).
 * @property {string} expression - The attribute string value.
 */

/**
 * Parses a single HTML attribute name into its Kite grammatical components.
 *
 * @param {string} attrName - Full attribute name (must start with 'kite-').
 * @param {string} attrValue - Attribute value expression.
 * @returns {ParsedDirective|null} Parsed record, or null if invalid.
 *
 * @example
 * parseAttribute("kite-on-click.prevent", "count++");
 * // => { rawName: "kite-on-click.prevent", name: "on", arg: "click", modifiers: ["prevent"], expression: "count++" }
 */
export function parseAttribute(attrName, attrValue) {
  if (!attrName.startsWith('kite-')) return null;

  const withoutPrefix = attrName.slice(5); // Remove 'kite-'

  // Check for modifiers separated by dots (e.g. `kite-on-click.prevent.stop`)
  const parts = withoutPrefix.split('.');
  const basePart = parts[0];
  const modifiers = parts.slice(1);

  let name = basePart;
  let arg = null;

  // 1. Check for colon syntax (e.g. `kite-bind:src`, `kite-class:active`)
  if (basePart.includes(':')) {
    const colonSplit = basePart.split(':');
    name = colonSplit[0];
    arg = colonSplit.slice(1).join(':');
  }
  // 2. Check for event syntax: `kite-on-<event>`
  else if (basePart.startsWith('on-')) {
    name = 'on';
    arg = basePart.slice(3); // e.g. 'click', 'submit'
  }

  return {
    rawName: attrName,
    name,
    arg,
    modifiers,
    expression: attrValue.trim()
  };
}

/**
 * Inspects an element and returns all valid, recognized Kite directives sorted by priority.
 * Unrecognized `kite-*` attributes emit a friendly hint and are skipped.
 *
 * @param {Element} el - DOM element to inspect.
 * @returns {Array<ParsedDirective>} List of parsed directives.
 */
export function parseElementDirectives(el) {
  if (!el || !el.attributes) return [];

  const parsed = [];

  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    if (attr.name === 'kite-cloak') {
      continue;
    }
    if (attr.name.startsWith('kite-')) {
      const record = parseAttribute(attr.name, attr.value);
      if (record) {
        // Special case: `kite-scope`, `kite-else`, and `kite-view` are core primitives
        if (record.name === 'scope' || record.name === 'else' || record.name === 'view' || hasDirective(record.name)) {
          parsed.push(record);
        } else {
          // Rule 10: Unknown kite-* attributes are ignored with a friendly console hint, never an error
          const knownDirectives = [
            'text', 'bind', 'model', 'if', 'elif', 'else', 'for', 'on', 'show', 'class',
            'style', 'html', 'computed', 'watch', 'persist', 'reset', 'shortcut', 'emit',
            'copy', 'poll', 'validate', 'required', 'pattern', 'min', 'max', 'rule', 'error',
            'scope', 'view'
          ];
          const guess = findClosest(record.name, knownDirectives);
          const hint = guess ? ` Did you mean 'kite-${guess}'?` : ' Did you make a typo or forget to register this directive?';
          warn(
            `Unknown attribute '${attr.name}' on <${el.tagName.toLowerCase()}>.${hint}`,
            el
          );
        }
      }
    }
  }

  return parsed;
}
