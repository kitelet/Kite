# Testing & Debugging Guide
> Best practices for automated testing, headless unit assertions, browser DOM verification, and DevTools debugging in Kite.

---

## Testing Philosophy: Fast & Dependency-Free

Kite is built to be **testable without heavy test runners or mock environments**:
- **Headless Unit Tests**: The core evaluator, scope proxies, and parser run directly in Node.js with zero dependencies (`node tests/run-tests.js`).
- **In-Browser Tests**: Live DOM assertions run in any real web browser (`tests/index.html`).

---

## 1. Headless Unit Testing (`tests/run-tests.js`)

You can run Kite's 48-assertion unit test suite directly in your terminal:

```bash
node tests/run-tests.js
```

### Output Preview:
```text
--- Safe Expression Evaluator ---
  ✔ Evaluates number literals
  ✔ Evaluates string literals
  ✔ Obeys standard operator precedence
  ✔ Resolves scope identifiers
  ✔ Evaluates semicolon statement sequences
  ✔ Invokes safe standard global Number()
  ✔ Evaluates string.includes on string primitive
  ✔ Rejects access to window
  ✔ Rejects access to eval

--- Scope Reactivity & Hierarchy ---
  ✔ Reads property from child scope
  ✔ Falls back to parent scope property
  ✔ Writing existing parent property updates parent
  ✔ Subscriber triggered on property mutation

--- MVCR Subsystem ---
  ✔ Parses model state properties
  ✔ Registers and retrieves model by name
  ✔ Model methods mutate reactive scope through `this`

========================================
Tests Completed: 48
Passed: 48
Failed: 0
========================================
```

---

## 2. Writing Unit Tests for Your Code

You can test Kite expressions and reactive scopes in any test file:

```javascript
import { evaluateExpression } from './src/utils/expr.js';
import { createScope } from './src/core/scope.js';

// 1. Create a reactive scope
const scope = createScope({ count: 10, items: ['apples', 'bananas'] });

// 2. Test expression evaluation
const doubleCount = evaluateExpression('count * 2', scope);
console.assert(doubleCount === 20, 'Count should double');

// 3. Test state mutations
evaluateExpression('count++', scope);
console.assert(scope.count === 11, 'Count should increment to 11');

// 4. Test array methods
const hasApples = evaluateExpression('items.includes("apples")', scope);
console.assert(hasApples === true, 'Array includes check should pass');
```

---

## 3. In-Browser DOM Testing (`tests/index.html`)

To test directives, DOM bindings, and event handlers in real browser engines:

1. Serve the repository:
   ```bash
   npx serve .
   ```
2. Open `http://localhost:3000/tests/index.html` in your browser.

The browser test suite automatically:
- Mounts reactive elements into the DOM.
- Dispatches click and input events.
- Verifies two-way binding synchronization.
- Instantiates components and resolves `<slot>` content.
- Navigates hash routes and asserts view mounting in `<kite-outlet>`.
- Displays an interactive pass/fail summary badge.

---

## 4. Debugging & Console Diagnostics

Kite provides clear, actionable diagnostics formatted with the signature `[Kite 🪁]` badge:

### Common Console Messages & Fixes

#### 1. Unknown Attribute Warning
```text
[Kite 🪁] Unknown attribute 'kite-clk' on <button>. Did you make a typo or forget to register this directive?
```
- **Cause**: Typo in an attribute name (e.g. `kite-clk` instead of `kite-on-click`).
- **Fix**: Check spelling against the [Directives Reference](../1-basics/directives.md).

---

#### 2. Access to Forbidden Identifier
```text
[Kite 🪁] Access to forbidden identifier 'window' was rejected.
```
- **Cause**: Attempting to access browser globals (`window`, `document`, `eval`) inside an attribute expression.
- **Fix**: Move platform logic into an expression helper via `Kite.helper()` or into a model method.

---

#### 3. Model Not Found
```text
[Kite 🪁] View references model 'todos', but it was not found.
```
- **Cause**: A `<kite-view model="todos">` references a model that has not been defined.
- **Fix**: Ensure a `<kite-model name="todos">` tag is present in your HTML before the view.

---

#### 4. Route Not Found
```text
[Kite 🪁] Route "/profile" points to view "profile-view", but view was not found.
```
- **Cause**: A `<kite-route>` points to a `<kite-view>` name that does not exist in the DOM.
- **Fix**: Ensure `<kite-view name="profile-view">` is declared on the page.

---

## Pro-Tips for Fast Debugging

1. **Inspect Global State in DevTools**:
   Open your browser console and type:
   ```javascript
   console.log(Kite.state);
   ```
2. **Evaluate Expressions Interactively**:
   Test how Kite resolves expressions against any scope:
   ```javascript
   Kite.evaluate('items.length > 0', Kite.state);
   ```

---

## Related Documentation
- [JavaScript API Reference](./api.md)
- [Safe Expressions & Security Engine](./expressions.md)
- [Scope & Reactivity Model](../2-architecture/scope.md)
