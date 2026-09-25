/**
 * @file bin/lib/format.js
 * @description Formats HTML template files and applies the 9-slot Kite markup convention.
 */

import fs from 'fs';
import path from 'path';

/**
 * Maps an attribute name to its recommended slot number (1 to 9).
 *
 * 1. Identity: id, class, name, native HTML attributes, data-*
 * 2. State: kite-scope, kite-persist*
 * 3. Data-in: kite-model, kite-bind:*
 * 4. Render: kite-text, kite-html, kite-show, kite-class:*, kite-style:*, kite-number, kite-date, kite-money, kite-timeago
 * 5. Control: kite-if, kite-elif, kite-else, kite-for, kite-when, kite-each
 * 6. Events: kite-on-*
 * 7. Lifecycle: kite-on-mount, kite-on-unmount, kite-on-update, kite-lazy
 * 8. Escape: kite-skip
 * 9. Config: kite-config:*
 *
 * @param {string} attrName
 * @returns {number}
 */
export function getAttrSlot(attrName) {
  const name = attrName.toLowerCase();

  // Slot 8: Escape
  if (name === 'kite-skip') return 8;

  // Slot 9: Config
  if (name.startsWith('kite-config:')) return 9;

  // Slot 7: Lifecycle
  if (['kite-on-mount', 'kite-on-unmount', 'kite-on-update', 'kite-lazy'].includes(name)) return 7;

  // Slot 6: Events
  if (name.startsWith('kite-on-')) return 6;

  // Slot 5: Control
  if (['kite-if', 'kite-elif', 'kite-else', 'kite-for', 'kite-when', 'kite-each'].includes(name)) return 5;

  // Slot 4: Render
  if (
    ['kite-text', 'kite-html', 'kite-show', 'kite-number', 'kite-date', 'kite-money', 'kite-timeago'].includes(name) ||
    name.startsWith('kite-class:') ||
    name.startsWith('kite-style:')
  ) {
    return 4;
  }

  // Slot 3: Data-in
  if (name === 'kite-model' || name.startsWith('kite-bind:')) return 3;

  // Slot 2: State
  if (name === 'kite-scope' || name.startsWith('kite-persist')) return 2;

  // Slot 1: Identity & Native HTML
  return 1;
}

/**
 * Reorders attributes on an opening HTML tag string according to the 9-slot convention.
 *
 * @param {string} tag - e.g. `<div kite-on-click="run()" id="main" kite-text="msg">`
 * @returns {string} Reordered tag.
 */
export function sortAttributesInTag(tag) {
  const match = tag.match(/^<([a-zA-Z0-9_\-]+)(\s+[^>]*?)?(\s*\/?>)$/s);
  if (!match) return tag;

  const tagName = match[1];
  const attrString = match[2];
  const closing = match[3];

  if (!attrString || !attrString.trim()) return tag;

  const attrRegex = /([a-zA-Z0-9_\-:@]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  const attrs = [];
  let m;
  while ((m = attrRegex.exec(attrString)) !== null) {
    attrs.push({
      raw: m[0],
      name: m[1],
      slot: getAttrSlot(m[1])
    });
  }

  if (attrs.length <= 1) return tag;

  // Stable sort by slot number
  attrs.sort((a, b) => a.slot - b.slot);

  const isSelfClosing = closing.includes('/');
  return `<${tagName} ${attrs.map(a => a.raw).join(' ')}${isSelfClosing ? ' /' : ''}>`;
}

/**
 * Formats markup content in a string.
 *
 * @param {string} content
 * @param {{ sortAttrs?: boolean }} options
 * @returns {string}
 */
export function formatMarkup(content, { sortAttrs = false } = {}) {
  if (!sortAttrs) return content;

  // Match HTML opening tags that contain attributes
  return content.replace(/<[a-zA-Z0-9_\-]+(?:\s+[^>]*?)?>/g, (tag) => {
    // Avoid doctypes, comments, or close tags
    if (tag.startsWith('<!') || tag.startsWith('</')) return tag;
    return sortAttributesInTag(tag);
  });
}

/**
 * Formats target HTML file or directory.
 *
 * @param {{ target: string, sortAttrs: boolean }} opts
 */
export function formatFiles({ target, sortAttrs = false }) {
  if (!fs.existsSync(target)) {
    console.error(`Target not found: ${target}`);
    return;
  }

  const stat = fs.statSync(target);
  const filesToFormat = [];

  if (stat.isFile()) {
    filesToFormat.push(target);
  } else {
    function collect(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          collect(full);
        } else if (entry.name.endsWith('.html')) {
          filesToFormat.push(full);
        }
      }
    }
    collect(target);
  }

  let formattedCount = 0;
  for (const file of filesToFormat) {
    const raw = fs.readFileSync(file, 'utf8');
    const formatted = formatMarkup(raw, { sortAttrs });
    if (formatted !== raw) {
      fs.writeFileSync(file, formatted, 'utf8');
      formattedCount++;
      console.log(`  \x1b[32m✔\x1b[0m Formatted ${path.relative(process.cwd(), file)}`);
    }
  }

  console.log(`\nDone. Formatted ${formattedCount} of ${filesToFormat.length} file(s).`);
}
