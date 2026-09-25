# Declarative Zero-JS Routing
> Single-page application screen navigation using standard HTML tags and native browser URL hashes.

---

## Why Client-Side Routing in HTML?

Traditional single-page application (SPA) routers (React Router, Vue Router) require extensive JavaScript configuration, pushState server rewrites, and complex route tables.

Kite provides **declarative hash-based routing** directly in HTML:
- **No server configuration needed**: Hash URLs (`#/`, `#/about`, `#/settings`) work on any static web host, GitHub Pages, or local file server without 404 rewrite rules.
- **Native browser history**: Standard browser Back and Forward buttons work out of the box.
- **Pure HTML markup**: Routes and view targets are declared using `<kite-route>` and `<kite-outlet>` tags.

---

## The Routing Primitives

| Primitive | HTML Tag | Role |
| :--- | :--- | :--- |
| **Route Definition** | `<kite-route path="..." view="...">` | Associates a URL path with a registered `<kite-view>` name. |
| **View Template** | `<kite-view name="..." [model="..."]>` | The HTML content rendered when the route activates. |
| **Outlet Container** | `<kite-outlet>` | The DOM insertion point where active views are mounted. |

---

## Syntax & Structure

### 1. Defining Routes & Views
Declare route mappings at the top of your document or within your application container:

```html
<!-- Route definitions -->
<kite-route path="/" view="home-screen"></kite-route>
<kite-route path="/dashboard" view="dashboard-screen"></kite-route>
<kite-route path="/settings" view="settings-screen"></kite-route>

<!-- Named view templates (automatically hidden until mounted) -->
<kite-view name="home-screen">
  <h2>Welcome to the Home Screen</h2>
  <p>This is the default view loaded at #/</p>
</kite-view>

<kite-view name="dashboard-screen">
  <h2>Dashboard Overview</h2>
  <p>Live metrics and reports.</p>
</kite-view>

<kite-view name="settings-screen">
  <h2>User Settings</h2>
  <p>Configure notifications and security.</p>
</kite-view>

<!-- Active route will be cloned and mounted here -->
<main>
  <kite-outlet></kite-outlet>
</main>
```

---

## How to Navigate

### Method 1: Native HTML Links (Recommended)
Because Kite listens to the browser `hashchange` event, you navigate between screens using regular HTML anchor tags:

```html
<nav class="main-nav">
  <a href="#/">Home</a>
  <a href="#/dashboard">Dashboard</a>
  <a href="#/settings">Settings</a>
</nav>
```

---

### Method 2: In Kite Expressions (`navigate`)
Kite provides a built-in `navigate(path)` helper available in all expressions:

```html
<button kite-on-click="navigate('/dashboard')">Go to Dashboard</button>
<button kite-on-click="navigate('/')">Back Home</button>
```

---

### Method 3: Programmatic JavaScript API
If you are writing custom JavaScript, navigate programmatically via `Kite.navigate()`:

```javascript
import Kite from './kite.js';

// Programmatically switch views
Kite.navigate('/settings');

// Or via native window hash
window.location.hash = '#/settings';
```

---

## Automatic View Lifecycle & Memory Management

When a user switches from `#/dashboard` to `#/settings`:

1. **Teardown**: Kite automatically executes the cleanup unbinders for the previous view. All event listeners, timers, and microtask subscribers in the outgoing screen are completely detached.
2. **Mount**: Kite clears `<kite-outlet>`, clones the target `<kite-view>`, reveals it, and mounts it into the DOM.
3. **Compilation**: Kite scans the newly mounted elements, binding any directives (`kite-text`, `kite-for`, `kite-on-*`) and connecting them to the view's associated model scope.

---

## Binding Routed Views to Models

Views loaded by the router can be bound to a centralized `<kite-model>`:

```html
<!-- Shared Model -->
<kite-model name="user">
  { name: 'Ada', email: 'ada@example.com', role: 'Admin' }
</kite-model>

<!-- Routes -->
<kite-route path="/" view="home-view"></kite-route>
<kite-route path="/profile" view="profile-view"></kite-route>

<!-- Home View -->
<kite-view name="home-view">
  <h2>Welcome Page</h2>
</kite-view>

<!-- Profile View bound to 'user' model -->
<kite-view name="profile-view" model="user">
  <h2>User Profile</h2>
  <p>Name: <strong kite-text="name"></strong></p>
  <p>Email: <strong kite-text="email"></strong></p>
</kite-view>

<kite-outlet></kite-outlet>
```

---

## Dynamic Route Parameters (`:id`)

Kite routes support URL segment parameters using standard colon notation:

```html
<kite-route path="/users/:id" view="user-details-view"></kite-route>

<kite-view name="user-details-view">
  <h2>User Profile</h2>
  <!-- Access via params.id or $params.id in expressions -->
  <p>Viewing User ID: <strong kite-text="params.id"></strong></p>
</kite-view>
```

When navigating to `#/users/42`, Kite extracts `{ id: '42' }` and injects both `params` and `$params` into the view's reactive scope.

---

## Route Guards & Redirects

Protect routes using declarative expressions. If the guard evaluates to falsy, Kite automatically redirects the user to the fallback path:

```html
<!-- Only accessible if auth.isLoggedIn is truthy -->
<kite-route path="/dashboard" view="dashboard-view" guard="auth.isLoggedIn" redirect="/login"></kite-route>
<kite-route path="/login" view="login-view"></kite-route>
```

---

## The `<kite-link>` Tag

In addition to standard `<a href="#/path">` links, Kite provides a custom `<kite-link>` tag for declarative SPA navigation:

```html
<nav>
  <kite-link to="/">Home</kite-link>
  <kite-link to="/dashboard">Dashboard</kite-link>
  <kite-link to="/settings">Settings</kite-link>
</nav>
```

---

## Wildcard & 404 Fallback Routes

Catch unhandled or mistyped paths using the wildcard pattern (`path="*"` or `path="/*"`):

```html
<!-- Catch-all 404 page -->
<kite-route path="*" view="not-found-view"></kite-route>

<kite-view name="not-found-view">
  <h2>404 — Page Not Found</h2>
  <p>The requested screen does not exist.</p>
  <kite-link to="/">Return Home</kite-link>
</kite-view>
```

---

## Practical Examples

### Multi-Tab Interface
```html
<div class="tabs-container">
  <nav class="tab-bar">
    <a href="#/tab1">General</a>
    <a href="#/tab2">Security</a>
    <a href="#/tab3">Billing</a>
  </nav>

  <kite-route path="/" view="tab1-content"></kite-route>
  <kite-route path="/tab1" view="tab1-content"></kite-route>
  <kite-route path="/tab2" view="tab2-content"></kite-route>
  <kite-route path="/tab3" view="tab3-content"></kite-route>

  <kite-view name="tab1-content">
    <h3>General Configuration</h3>
    <p>Update site title and description.</p>
  </kite-view>

  <kite-view name="tab2-content">
    <h3>Security Settings</h3>
    <p>Manage two-factor authentication.</p>
  </kite-view>

  <kite-view name="tab3-content">
    <h3>Billing & Subscriptions</h3>
    <p>View invoices and payment methods.</p>
  </kite-view>

  <div class="tab-body">
    <kite-outlet></kite-outlet>
  </div>
</div>
```

---

## Gotchas & Best Practices

> [!IMPORTANT]
> **Always Define a Root Route (`path="/"`)**: When a page first loads without a hash, Kite defaults to the `/` route. Always define a route for `path="/"` so your outlet has an initial screen to display.

> [!TIP]
> **View Templates Are Hidden by Default**: Any `<kite-view>` that has a `name="..."` attribute is treated as a routing template and automatically hidden (`display: none`) until cloned into `<kite-outlet>`.

> [!NOTE]
> **Case Insensitive Matching**: Route paths and view names are matched case-insensitively (`/About` matches `/about`).

---

## Related Documentation
- [MVCR Architecture](./mvcr.md)
- [Declarative Components](./components.md)
- [Directives Reference](../1-basics/directives.md)
