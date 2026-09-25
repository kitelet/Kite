# Kite JavaScript API Reference
> Complete programmatic API specification for the global `Kite` runtime object, scope proxies, and extension hooks.

---

## The Global `Kite` Object

When loaded in the browser (via `<script type="module">` or regular script tag), Kite automatically exposes the global `window.Kite` object. It is also exported as the default and named export from `kite.js`.

```javascript
import Kite from './src/kite.js';
// or access via window.Kite
```

---

## Core API Methods

### 1. `Kite.directive(name, handler, options)`
Registers a custom `kite-*` directive with the Kite compiler.

#### Signature
```typescript
Kite.directive(
  name: string,
  handler: (
    el: Element,
    expr: string,
    scope: Proxy,
    arg: string | null,
    modifiers: string[],
    scanElement: (el: Element, scope: Proxy) => Function
  ) => Function | void,
  options?: {
    priority?: number,
    isTerminal?: boolean
  }
): void
```

#### Parameters:
- `name` (*string*): Directive name without the `kite-` prefix (e.g. `'tooltip'` for `kite-tooltip`).
- `handler` (*Function*): Function invoked when the directive is encountered during DOM scanning.
  - Returns an optional teardown unbinder function `() => void` called when the element is removed.
- `options` (*Object*, optional):
  - `priority` (*number*, default `0`): Higher priority directives execute earlier on the same element.
  - `isTerminal` (*boolean*, default `false`): If `true`, stops processing lower-priority directives and child elements (used by `kite-if` and `kite-for`).

#### Example
```javascript
Kite.directive('autofocus', (el) => {
  el.focus();
}, { priority: 10 });
```

---

### 2. `Kite.helper(name, fn)`
Registers a helper function accessible inside any attribute expression.

#### Signature
```typescript
Kite.helper(name: string, fn: Function): void
```

#### Parameters:
- `name` (*string*): Identifier used inside expressions (e.g. `'formatDate'`).
- `fn` (*Function*): Implementation function.

#### Example
```javascript
Kite.helper('truncate', (str, len = 20) => {
  const s = String(str || '');
  return s.length > len ? s.slice(0, len) + '...' : s;
});
```
Usage in HTML:
```html
<p kite-text="truncate(article.body, 50)"></p>
```

---

### 3. `Kite.component(name, template)`
Programmatically registers a reusable component template.

#### Signature
```typescript
Kite.component(name: string, template: HTMLTemplateElement | Element | string): void
```

#### Parameters:
- `name` (*string*): Component name (case-insensitive, kebab-case recommended).
- `template` (*string | Element*): An HTML string or a `<template>` DOM element.

#### Example
```javascript
Kite.component('user-pill', `
  <span class="pill">
    <strong kite-text="name"></strong> (<span kite-text="role"></span>)
  </span>
`);
```

---

### 4. `Kite.model(name, state)`
Programmatically defines a named reactive model.

#### Signature
```typescript
Kite.model(name: string, state: Object): Proxy
```

#### Parameters:
- `name` (*string*): Model identifier (case-insensitive).
- `state` (*Object*): Plain object containing initial properties and methods.

#### Returns:
- Returns the newly created reactive Proxy scope.

#### Example
```javascript
const cart = Kite.model('cart', {
  items: [],
  total: 0,
  add(item) {
    this.items.push(item);
    this.total += item.price;
  }
});
```

---

### 5. `Kite.route(path, viewName)`
Registers a URL hash route mapping to a named `<kite-view>`.

#### Signature
```typescript
Kite.route(path: string, viewName: string): void
```

#### Parameters:
- `path` (*string*): Target path starting with `/` (e.g. `'/'`, `'/profile'`, `'/settings'`).
- `viewName` (*string*): Name of the registered `<kite-view>` to activate.

#### Example
```javascript
Kite.route('/orders', 'orders-view');
```

---

### 6. `Kite.navigate(path)`
Programmatically triggers client-side navigation.

#### Signature
```typescript
Kite.navigate(path: string): void
```

#### Parameters:
- `path` (*string*): Destination path (e.g. `'/orders'` or `'#/orders'`).

#### Example
```javascript
Kite.navigate('/orders');
```

---

### 7. `Kite.createScope(initial, parent)`
Creates an isolated reactive scope proxy.

#### Signature
```typescript
Kite.createScope(initial?: Object, parent?: Proxy | null): Proxy
```

#### Parameters:
- `initial` (*Object*, optional): Initial state properties.
- `parent` (*Proxy*, optional): Parent scope proxy for hierarchical fallback lookups.

#### Returns:
- A reactive `Proxy` instance equipped with `$subscribe` and prototype chain traversal.

---

### 8. `Kite.scan(root)`
Scans the DOM tree starting from `root`, compiling and binding all directives and components.

#### Signature
```typescript
Kite.scan(root?: Element | Document): () => void
```

#### Parameters:
- `root` (*Element | Document*, default `document`): Container element to scan.

#### Returns:
- A master cleanup function that unbinds all listeners and reactors created during the scan.

---

### 9. `Kite.evaluate(expr, scope)`
Safely evaluates an expression string against a given reactive scope using Kite's zero-`eval` recursive-descent evaluator.

#### Signature
```typescript
Kite.evaluate(expr: string, scope?: Object): any
```

#### Parameters:
- `expr` (*string*): Expression string to evaluate.
- `scope` (*Object*, optional): Scope providing variable bindings.

#### Returns:
- The result of the evaluated expression.

---

## Global Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `Kite.version` | `string` | Current version string (e.g. `'2.0.0'`). |
| `Kite.state` | `Object` | Global fallback state object. Variables set here are accessible to all scopes. |
| `Kite.helpers` | `Object` | Dictionary of registered expression helpers. |

---

## The Scope Proxy API

Every scope instance created by Kite is a JavaScript `Proxy` with built-in reactive methods:

### `scope.$subscribe(property, callback)`
Subscribes a listener to mutations of a specific property or all properties.

```typescript
scope.$subscribe(
  property: string, // Property name or '*' for any mutation
  callback: (newValue: any, oldValue: any) => void
): () => void // Returns an unsubscribe function
```

#### Example
```javascript
const unsubscribe = scope.$subscribe('count', (newVal, oldVal) => {
  console.log(`Count changed from ${oldVal} to ${newVal}`);
});

// To stop listening:
unsubscribe();
```

---

## Related Documentation
- [Flexibility & Extensions Guide](./extending.md)
- [Scope & Reactivity Model](../2-architecture/scope.md)
- [Safe Expressions & Security Engine](./expressions.md)
