# Safe Expressions & Security Engine
> Deep dive into Kite's zero-`eval` recursive-descent expression evaluator, operator precedence, supported syntax, and strict sandbox boundaries.

---

## The Philosophy: Zero `eval()`, Zero Compromises

Most lightweight front-end libraries rely on JavaScript's dynamic evaluation:
```javascript
// How other libraries evaluate expressions:
const fn = new Function('scope', 'with(scope) { return ' + expr + ' }');
```

While convenient, `new Function()` and `eval()` introduce critical security liabilities:
1. **Content Security Policy (CSP) Incompatibility**: Production environments with strict CSP (`script-src 'self'`) disallow `unsafe-eval`. Frameworks using `new Function` will crash or be blocked by modern browsers.
2. **Cross-Site Scripting (XSS)**: If user-generated strings are injected into HTML attributes, arbitrary malicious JavaScript can execute in the victim's session.
3. **Black Box Execution**: Developers cannot inspect or control the parsing process.

Kite solves this by shipping a **hand-written, zero-dependency recursive-descent expression parser and tokenizer** in `src/utils/expr.js`.

---

## Grammar & Operator Precedence

Kite parses expressions with mathematical rigor, following standard ECMAScript operator precedence:

| Precedence | Level | Operators | Associativity | Example |
| :---: | :--- | :--- | :---: | :--- |
| **12 (Highest)** | Member & Call | `.`, `[]`, `()` | Left-to-right | `user.address['city']()`, `text.trim()` |
| **11** | Postfix | `++`, `--` | N/A | `count++`, `index--` |
| **10** | Unary | `!`, `+`, `-` | Right-to-left | `!isActive`, `-amount` |
| **9** | Multiplicative | `*`, `/`, `%` | Left-to-right | `price * quantity % 2` |
| **8** | Additive | `+`, `-` | Left-to-right | `total + shipping - discount` |
| **7** | Relational | `<`, `<=`, `>`, `>=` | Left-to-right | `age >= 18`, `count < max` |
| **6** | Equality | `==`, `!=`, `===`, `!==` | Left-to-right | `status === 'active'` |
| **5** | Logical AND | `&&` | Left-to-right | `isLoggedIn && hasPermission` |
| **4** | Logical OR | `\|\|` | Left-to-right | `customTitle \|\| defaultTitle` |
| **3** | Ternary | `? :` | Right-to-left | `isOpen ? 'Close' : 'Open'` |
| **2** | Assignment / Arrow | `=`, `+=`, `-=`, `*=`, `/=`, `=>` | Right-to-left | `count += 1`, `t => !t.done` |
| **1 (Lowest)** | Statement Sequence | `;` | Left-to-right | `a = 1; b = 2; c = 3;` |

---

## Supported Syntax Features

### 1. Literals
- **Numbers**: Integers and floats (`42`, `3.14`, `0.5`).
- **Strings**: Single or double-quoted with escape support (`'hello'`, `"Kite \"v2\""`).
- **Booleans**: `true` and `false`.
- **Null & Undefined**: `null`, `undefined`.
- **Arrays**: `[1, 2, 'three', true]`.
- **Objects**: `{ id: 1, title: 'Item', active: true }`.

---

### 2. Multi-Statement Sequences (Semicolons)
In event listeners (`kite-on-click`, `kite-on-submit`), multiple assignments and expressions can be sequenced with semicolons. They evaluate in left-to-right order:

```html
<button kite-on-click="display = '0'; op = null; prev = 0; clearOnNext = false">
  Reset Calculator
</button>
```

---

### 3. Native Methods with Context Preservation
Kite preserves object and primitive `this` context when calling methods. You can call standard prototype methods on strings, arrays, and objects:

```html
<!-- String methods on primitives -->
<span kite-text="email.trim().toLowerCase()"></span>
<span kite-if="query && title.includes(query)">Matched</span>

<!-- Array methods -->
<span kite-text="items.slice(0, 3).join(', ')"></span>
```

---

### 4. Arrow Functions in Collections
Higher-order array methods (`filter`, `map`, `some`, `every`, `find`) support inline arrow functions:

```html
<!-- Filter active todos -->
<li kite-for="todo in todos.filter(t => !t.done)">
  <span kite-text="todo.text"></span>
</li>

<!-- Check if any item matches -->
<p kite-if="items.some(i => i.price > 100)">Includes Premium Items</p>
```

---

## Security: The Safe Globals Whitelist & Blocklist

To prevent malicious code execution while remaining practical, Kite implements strict security boundaries:

### 1. Whitelisted Safe Globals
These standard JavaScript utilities are available inside expressions without exposing dangerous platform APIs:

| Category | Available Globals |
| :--- | :--- |
| **Type Converters** | `Number()`, `String()`, `Boolean()` |
| **Math & Numbers** | `Math` (`Math.round`, `Math.max`, `Math.min`, `Math.abs`, etc.), `parseInt()`, `parseFloat()`, `isNaN()`, `isFinite()` |
| **Data & Time** | `Date`, `JSON` (`JSON.stringify`, `JSON.parse`) |
| **Collections** | `Array`, `Object` |

```html
<p kite-text="'Total: $' + Number(amount).toFixed(2)"></p>
<p kite-text="'Max Score: ' + Math.max(scoreA, scoreB)"></p>
```

---

### 2. Forbidden Identifiers (Sandbox Escape Defense)
The following identifiers and prototype accessors are **strictly blocked**. Attempting to access them emits a friendly warning and returns `undefined`:

- `window`
- `document`
- `globalThis`
- `global`
- `eval`
- `Function`
- `constructor`
- `__proto__`
- `prototype`

If an expression contains `window.alert('xss')` or `user.constructor.constructor('...')()`, Kite rejects the lookup cleanly:
```text
[Kite 🪁] Access to forbidden identifier 'window' was rejected.
```

---

## Gotchas & Syntax Rules

> [!IMPORTANT]
> **No Variable Declarations**: You cannot write `const x = 1;` or `let y = 2;` inside attributes. Assign directly to scope variables: `x = 1; y = 2;`.

> [!TIP]
> **Use Expression Helpers for Complex Logic**: If an expression exceeds one or two lines of logic, register a helper with `Kite.helper()` or a model action with `<kite-action>`. Keep HTML clean and semantic.

---

## Related Documentation
- [Directives Reference](../1-basics/directives.md)
- [Scope & Reactivity Model](../2-architecture/scope.md)
- [JavaScript API Reference](./api.md)
