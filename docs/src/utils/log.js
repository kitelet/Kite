/**
 * @file Friendly developer logging system & diagnostics overlay for Kite.
 * @module utils/log
 * @author Kite Contributors
 * @license MIT
 */

const PREFIX = '[Kite 🪁]';

/**
 * Calculates Levenshtein distance between two strings to generate typo hints.
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Finds closest matching candidate string for typo suggestions.
 * @param {string} target - The mistyped identifier.
 * @param {Iterable<string>} candidates - List of valid identifiers.
 * @returns {string|null}
 */
export function findClosest(target, candidates) {
  if (!target || !candidates) return null;
  let best = null, minScore = 3;
  for (const c of candidates) {
    if (typeof c !== 'string') continue;
    const dist = levenshtein(target.toLowerCase(), c.toLowerCase());
    if (dist < minScore && dist > 0) {
      minScore = dist;
      best = c;
    }
  }
  return best;
}

/**
 * Logs a helpful friendly warning to the console without throwing.
 *
 * @param {string} message - Warning message to output.
 * @param {...any} details - Additional contextual objects or elements.
 */
export function warn(message, ...details) {
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(`${PREFIX} ${message}`, ...details);
  }
}

/**
 * Logs an informational tip or diagnostic message.
 *
 * @param {string} message - Message text.
 * @param {...any} details - Additional details.
 */
export function info(message, ...details) {
  if (typeof console !== 'undefined' && console.info) {
    console.info(`${PREFIX} ${message}`, ...details);
  }
}

/**
 * Logs an error in a helpful, non-crashing format.
 *
 * @param {string} message - Error explanation.
 * @param {Error|any} [err] - Underlying error object.
 */
export function error(message, err) {
  if (typeof console !== 'undefined' && console.error) {
    console.error(`${PREFIX} ${message}`, err || '');
  }
}

let activeIssuesCount = 0;

/**
 * Emits a structured, source-aware diagnostic error conforming to Kite v1.0.0 resolution.
 *
 * @param {object} opts
 * @param {string} [opts.title] - Category title (e.g., 'Expression failed').
 * @param {string} opts.expr - Failed expression or attribute value.
 * @param {Element} [opts.element] - The DOM element where failure occurred.
 * @param {string} [opts.scopeName] - The active scope or model name.
 * @param {string} [opts.reason] - Human-readable reason for the failure.
 * @param {string} [opts.hint] - Smart recommendation ("Did you mean...?").
 * @param {string} [opts.file] - Source file path.
 * @param {number|string} [opts.line] - Source file line number.
 * @param {string} [opts.docs] - Documentation link.
 */
export function sourceError(opts) {
  const {
    expr,
    element,
    scopeName,
    reason,
    hint,
    file,
    line,
    docs
  } = opts;

  let elDesc = '';
  if (element && element.outerHTML) {
    elDesc = element.outerHTML.split('>')[0] + '>';
  }

  const lines = [
    `[Kite] ${opts.title || 'Expression failed'}: "${expr || ''}"`,
    file ? `  File:    ${file}` : null,
    line ? `  Line:    ${line}` : null,
    elDesc ? `  Element: ${elDesc}` : null,
    scopeName ? `  Scope:   ${scopeName}` : null,
    reason ? `  Reason:  ${reason}` : null,
    hint ? `  Hint:    ${hint}` : null,
    `  Docs:    ${docs || 'https://getkite.netlify.app/docs/directives'}`
  ].filter(Boolean);

  if (typeof console !== 'undefined' && console.error) {
    console.error(lines.join('\n'));
  }

  // Dev overlay in browser if active
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    const isProd = window.__KITE_PROD__ || 
      (document.querySelector && document.querySelector('kite-config[mode="prod"], kite-config[mode="production"]'));
    if (!isProd) {
      renderDevOverlay({
        title: opts.title || 'Expression failed',
        file: file || (element && element.getAttribute && element.getAttribute('data-source-file')) || 'index.html',
        line: line || (element && element.getAttribute && element.getAttribute('data-source-line')) || '',
        expr: expr || '',
        hint: hint || '',
        reason: reason || '',
        docs: docs || 'https://getkite.netlify.app/docs/directives'
      });
    }
  }
}

/**
 * Renders or updates the lightweight floating dev overlay in browser environments.
 * @param {object} item
 */
function renderDevOverlay(item) {
  if (typeof document === 'undefined' || !document.body) return;
  activeIssuesCount++;

  let overlay = document.querySelector('kite-dev-overlay');
  if (!overlay) {
    overlay = document.createElement('kite-dev-overlay');
    document.body.appendChild(overlay);
  }

  const loc = item.file ? (item.line ? `${item.file}:${item.line}` : item.file) : 'index.html';
  const hintMarkup = item.hint ? `<div style="color: #6ee7b7; margin-top: 4px;">💡 ${item.hint}</div>` : '';
  const reasonMarkup = item.reason ? `<div style="color: #f87171; margin-top: 2px;">${item.reason}</div>` : '';

  overlay.innerHTML = `
    <div class="kite-overlay-header">
      <span>🪁 Kite — ${activeIssuesCount} issue${activeIssuesCount > 1 ? 's' : ''}</span>
      <button style="background: none; border: none; color: #a1a1aa; cursor: pointer; font-size: 14px;" onclick="this.closest('kite-dev-overlay').remove()">✕</button>
    </div>
    <div class="kite-overlay-content">
      <div style="font-weight: 500; color: #e4e4e7;">${loc}</div>
      <div style="margin-top: 2px;">${item.title}: <code style="background: #27272a; padding: 1px 4px; border-radius: 3px;">${item.expr}</code></div>
      ${reasonMarkup}
      ${hintMarkup}
    </div>
    <div class="kite-overlay-actions">
      <a href="${item.docs}" target="_blank" rel="noopener">See docs</a>
      <button onclick="this.closest('kite-dev-overlay').remove()">Dismiss</button>
    </div>
  `;
}
