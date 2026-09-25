# API Stability & Versioning Policy (Kite v1.0)

> **Specification of backwards-compatibility guarantees, frozen public interfaces, and deprecation lifecycle under Semantic Versioning 2.0.0.**

---

## 1. Versioning Commitment

Kite adheres strictly to [Semantic Versioning 2.0.0](https://semver.org/):

- **Patch Releases (`1.0.x`)**: Bug fixes, performance optimizations, documentation improvements, and internal refactors. Zero backwards-incompatible API changes.
- **Minor Releases (`1.x.0`)**: Backwards-compatible feature additions (such as new optional utilities or helpers). Existing templates and scripts continue to function without modification.
- **Major Releases (`2.0.0`)**: Reserved for intentional breaking changes or architectural redesigns. Any breaking change will be preceded by deprecation warnings in prior minor releases.

---

## 2. Public API Surface

The following programmatic JavaScript methods exposed on the `Kite` namespace are considered stable public interfaces for the entirety of the `1.x` release line:

| API Method | Function |
| :--- | :--- |
| `Kite.mount(root, initialData)` | Compiles and initializes Kite reactivity on the specified DOM element. |
| `Kite.scan(root)` | Performs an incremental scan of newly inserted DOM subtrees. |
| `Kite.directive(name, handler, opts)` | Registers a custom declarative directive. |
| `Kite.model(name, definition)` | Defines or retrieves a reactive data model. |
| `Kite.controller(name, fn)` | Registers a controller logic container. |
| `Kite.route(path, viewOrConfig)` | Defines a client-side route mapping. |
| `Kite.component(name, spec)` | Registers a reusable component specification. |
| `Kite.helper(name, fn)` | Registers a custom helper function for expression evaluation. |
| `Kite.evaluate(expr, scope)` | Evaluates an expression string safely against the provided scope. |
| `Kite.config` | Global configuration access and mutation. |

---

## 3. Declarative Custom Elements

The following declarative custom tags are permanent structural interfaces in v1.x:

- `<kite-model>`: Declarative state and method container.
- `<kite-controller>`: Action handler container for business logic.
- `<kite-view>`: Routed view container.
- `<kite-router>` / `<kite-route>`: Client-side routing declarations.
- `<kite-outlet>`: Target container for routed view mounting.
- `<kite-include>`: HTML partial inclusion primitive.
- `<kite-component>` / `<kite-use>`: Component definition and invocation.
- `<kite-teleport>`: Target projection container.

---

## 4. Core Directives

The following directive attributes and syntax forms are guaranteed stable across v1.x:

- **State & Data**: `kite-scope`, `kite-model`, `kite-persist`, `kite-persist-key`, `kite-bind:*`
- **DOM Rendering**: `kite-text`, `kite-html`, `kite-show`, `kite-class:*`, `kite-style:*`, `kite-number`, `kite-date`, `kite-money`, `kite-timeago`
- **Control Flow**: `kite-if`, `kite-elif`, `kite-else`, `kite-for`, `kite-when`, `kite-each`
- **Event Listeners**: `kite-on-*` (including event modifiers `.prevent`, `.stop`, `.debounce`, `.throttle`, `.once`, `.self`)
- **Lifecycle Hooks**: `kite-on-mount`, `kite-on-unmount`, `kite-on-update`, `kite-lazy`
- **Control & Utility**: `kite-skip`, `kite-ref`, `kite-config:*`

---

## 5. Security & Architectural Invariants

Throughout the v1.x release lifecycle, the following architectural constraints remain non-negotiable:

1. **Zero `eval()` and Zero `new Function()`**: The AST-based expression parser will never introduce code generation or unsafe evaluation.
2. **Strict Content Security Policy (CSP)**: The runtime operates without `'unsafe-eval'` under standard `default-src 'self'` policies.
3. **Zero External Runtime Dependencies**: The core browser runtime remains 100% self-contained with no external dependencies.
4. **Safe Error Fallbacks**: Expression syntax errors, missing models, and network include failures emit informative console diagnostics without throwing unhandled exceptions that break the surrounding page.

---

## 6. Deprecation Policy

In the event that an API method or directive is superseded by an improved alternative during a minor release:

1. The API will be marked as **deprecated** in documentation, accompanied by clear migration examples.
2. The runtime will emit a single development-mode console warning upon invocation (`[Kite Deprecation]`).
3. The deprecated interface will **remain fully operational** for all subsequent `1.x` releases and will only be removed in major release `2.0.0`.
