# Keeping Your Apps Safe (Zero `eval` & Strict CSP)

> **HTML is enough for small things.** Safe by default: zero `eval()`, zero `new Function()`, 100% strict Content Security Policy (CSP) compatibility, and zero tracking.

When building interactive pages with HTML attributes, security shouldn't be an afterthought or a complex chore. Kite is designed so that you get full interactivity without opening up security holes.

---

## 1. Why Safe Evaluation Matters

Most reactive attribute libraries evaluate expressions inside HTML attributes by compiling strings into raw JavaScript functions using `new Function('return ' + expr)`.

While easy to build, `new Function()` has two major downsides:
1. **Security risks**: If user-submitted data ever ends up inside an HTML attribute, `new Function()` can accidentally run unintended JavaScript (Cross-Site Scripting or XSS).
2. **CSP headaches**: Modern security-conscious websites use a **Content Security Policy (CSP)**. A policy with `script-src 'self'` will completely block libraries that rely on `new Function()` unless you enable `'unsafe-eval'`.

**Kite takes a safer approach with an absolute Zero-`eval` guarantee**:
- **Zero** use of `eval()`
- **Zero** use of `new Function()`
- **100%** compatible with strict CSP (`script-src 'self'`)
- Built-in HTML sanitization for dynamic content
- Zero telemetry, zero analytics, zero cookies, zero tracking

---

## 2. Setting Up a Content Security Policy (CSP)

Because Kite never uses `eval()` or `new Function()`, your website can use the safest, most restrictive Content Security Policy headers without issue:

### Standard Secure Header (Using CDN):
```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://esm.sh; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;
```

### Self-Hosted / Offline Header:
If you download or bundle Kite locally with your site:
```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self';
```

Notice that **`'unsafe-eval'` is never needed**. Your browser console stays clean and your site stays safe.

---

## 3. How the Safe Expression Engine Works

Instead of passing your attribute expressions to the browser's JavaScript compiler, Kite uses a small, hand-crafted parser located in `src/utils/expr.js`:

```
HTML Attribute: kite-on-click="count++; notify(user.name)"
                         │
                         ▼
             1. Tokenizer (breaks into words & symbols)
             [IDENTIFIER('count'), OPERATOR('++'), PUNCTUATION(';'),
              IDENTIFIER('notify'), PUNCTUATION('('), IDENTIFIER('user'),
              PUNCTUATION('.'), IDENTIFIER('name'), PUNCTUATION(')')]
                         │
                         ▼
             2. Safe Interpreter
             - Resolves variables only within your active scope
             - Executes safe operations (+, -, *, /, &&, ||, !)
             - Calls safe helper functions without touching window or document
```

### What is Blocked?
To keep your page secure, the expression engine refuses to touch hazardous global variables:
- ❌ `window`, `document`, `globalThis`
- ❌ `eval`, `Function`, `setTimeout`, `setInterval`
- ❌ `__proto__`, `prototype`, `constructor` (prototype pollution protection)

If an expression tries to reference any of these, Kite safely ignores it and logs a helpful warning in your console.

---

## 4. Defending Against Prototype Pollution

JavaScript objects inherit properties from prototypes. If untrusted input can overwrite `__proto__`, it can compromise the entire page.

Kite guards against this across all layers:
- Property assignments via `kite-model` block keys named `__proto__`, `prototype`, or `constructor`.
- Scope proxies block prototype lookups, returning `undefined`.
- Nested object watchers wrap objects cleanly without exposing base prototypes.

---

## 5. Safe HTML Rendering (`kite-html`)

When rendering text, always prefer `kite-text`, which safely sets `textContent` and prevents HTML injection:

```html
<!-- Safe by default: automatically escapes all special characters -->
<span kite-text="userComment"></span>
```

If you truly need to render HTML markup, use `kite-html`:

```html
<div kite-html="trustedBio"></div>
```

Kite automatically strips `<script>` tags and dangerous attributes (`onerror`, `onload`, `javascript:`) before inserting HTML into the page.

---

## 6. Privacy First: Zero Telemetry

Kite is software that respects you and your users:
- **No phone-home network calls**: Kite will never ping a remote server.
- **No tracking or analytics**: We do not collect metrics, IP addresses, or browser data.
- **Local storage isolation**: When using `kite-persist`, data is saved strictly in the user's browser under your configured prefix.
