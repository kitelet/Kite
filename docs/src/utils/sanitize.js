/**
 * @file HTML and Attribute sanitizer for Kite security layer.
 * @module utils/sanitize
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Zero-dependency sanitizer that neutralizes XSS vectors:
 * - Strips dangerous tags: <script>, <iframe>, <object>, <embed>, <link>, <meta>, <base>
 * - Strips inline event handlers (`onclick`, `onerror`, etc.)
 * - Strips `javascript:` and `data:text/html` URLs
 * - Neutralizes CSS `expression()`, `-moz-binding`, and `behavior:`
 */

/**
 * Forbidden tag names in untrusted HTML strings.
 */
const FORBIDDEN_TAGS = [
  'script', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'applet', 'form'
];

/**
 * Sanitizes an untrusted HTML string.
 *
 * @param {string} input - Raw HTML string.
 * @returns {string} Safe HTML string.
 */
export function sanitizeHtml(input) {
  if (!input || typeof input !== 'string') return '';

  let output = input;

  // 1. Remove dangerous tag blocks including their content
  for (const tag of FORBIDDEN_TAGS) {
    const tagRegex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    output = output.replace(tagRegex, '');
    // Also remove self-closing or lone opening instances
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    output = output.replace(selfClosingRegex, '');
  }

  // 2. Strip inline event attributes: on*="..." or on*='...' or on*=...
  output = output.replace(/\s+on[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // 3. Strip dangerous protocol schemes: javascript: and data:text/html
  output = output.replace(/(href|src|action|data)\s*=\s*["']?\s*(javascript|data:text\/html):/gi, '$1="#blocked:');

  // 4. Neutralize CSS expressions or behavior in style attributes
  output = output.replace(/style\s*=\s*("[^"]*"|'[^']*')/gi, (match) => {
    return match
      .replace(/expression\s*\([^)]*\)/gi, '')
      .replace(/behavior\s*:/gi, '')
      .replace(/-moz-binding\s*:/gi, '')
      .replace(/javascript\s*:/gi, '');
  });

  return output;
}

const originalSanitizer = sanitizeHtml;
let customSanitizer = null;

export function setActiveSanitizer(fn) {
  customSanitizer = typeof fn === 'function' ? fn : null;
}

export function getOriginalSanitizer() {
  return originalSanitizer;
}

export function sanitize(input) {
  return customSanitizer ? customSanitizer(input) : sanitizeHtml(input);
}

/**
 * Validates whether an attribute name is safe to bind dynamically.
 *
 * @param {string} attrName
 * @returns {boolean} True if safe, false if dangerous.
 */
export function isSafeAttribute(attrName) {
  if (!attrName || typeof attrName !== 'string') return false;
  const lower = attrName.toLowerCase().trim();
  if (lower.startsWith('on')) return false;
  if (lower === 'srcdoc') return false;
  return true;
}

/**
 * Validates whether an attribute value (like href or src) contains dangerous scripts.
 *
 * @param {string} val
 * @returns {string} Sanitized attribute value.
 */
export function sanitizeAttributeValue(val) {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:text/html')) {
    return '#blocked';
  }
  return val;
}
