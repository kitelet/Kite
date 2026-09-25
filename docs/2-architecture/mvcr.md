# MVCR Architecture in Kite
> Model, View, Controller, Route — the battle-tested architectural pattern expressed cleanly and visibly as native HTML tags.

---

## What is MVCR in Kite?

In large applications, scattering state declarations and business logic across dozens of inline HTML attributes quickly becomes unmanageable. 

Traditional front-end frameworks solve this by introducing complex TypeScript classes, state managers (Redux, Pinia, Vuex), and bundle pipelines.

Kite solves this by expressing the classic **Model-View-Controller-Route (MVCR)** pattern directly in **standard HTML**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Kite MVCR Architecture                          │
├───────────────────┬────────────────────────────────────────────────────┤
│ 1. Model          │ <kite-model name="cart">                           │
│    (The Data)     │   { items: [], total: 0, add(i) { ... } }         │
│                   │ </kite-model>                                      │
├───────────────────┼────────────────────────────────────────────────────┤
│ 2. Controller     │ <kite-controller model="cart">                     │
│    (The Actions)  │   <kite-action name="checkout" run="pay()"></kite> │
│                   │ </kite-controller>                                 │
├───────────────────┼────────────────────────────────────────────────────┤
│ 3. View           │ <kite-view name="cart-view" model="cart">          │
│    (The Markup)   │   <h2 kite-text="total"></h2>                      │
│                   │ </kite-view>                                       │
├───────────────────┼────────────────────────────────────────────────────┤
│ 4. Route          │ <kite-route path="/checkout" view="cart-view">     │
│    (The URL)      │ <kite-outlet></kite-outlet>                        │
└───────────────────┴────────────────────────────────────────────────────┘
```

Everything remains **100% standard HTML**. No build step. No user JS files required.

---

## The Four Core Primitives

| Primitive | HTML Tag | Primary Responsibility |
| :--- | :--- | :--- |
| **Model** | `<kite-model name="...">` | Stores reactive data and domain methods where `this` binds to reactive state. |
| **View** | `<kite-view model="..." [name="..."]>` | Pure HTML markup bound reactively to a model scope. |
| **Controller** | `<kite-controller model="...">` | Exposes named actions (`<kite-action>`) to views, decoupling markup from business logic. |
| **Route** | `<kite-route path="..." view="...">` | Maps browser URL hash changes to active views and mounts them into `<kite-outlet>`. |

---

## Deep Dive into Each Primitive

### 1. The Model (`<kite-model>`)
The model is a centralized, named state container. Inside `<kite-model>`, you write a JSON-like object literal defining initial properties and methods:

```html
<kite-model name="auth">
  {
    user: null,
    token: '',
    login(username) {
      this.user = { name: username, loggedInAt: Date.now() };
      this.token = 'demo-session-token';
    },
    logout() {
      this.user = null;
      this.token = '';
    }
  }
</kite-model>
```

#### Key Behaviors:
- State inside the model is reactive via JavaScript `Proxy`.
- Methods inside the model have their `this` bound directly to the reactive scope. Mutating `this.user` immediately notifies all subscribing DOM elements.
- The model is globally registered by name and can be referenced by multiple views and controllers anywhere on the page.

---

### 2. The View (`<kite-view>`)
Views render HTML markup bound to a model. They come in two modes:

#### Mode A: Routed View Template (with `name="..."`)
When a view has a `name` attribute, it acts as a template for client-side routing. It remains hidden until `<kite-outlet>` loads it:

```html
<kite-view name="user-profile-view" model="auth">
  <div class="card" kite-if="user">
    <h2>User Profile</h2>
    <p>Welcome, <span kite-text="user.name"></span>!</p>
    <button kite-on-click="logout()">Log Out</button>
  </div>
</kite-view>
```

#### Mode B: Inline View (Tag or Attribute)
When a view does not have a `name`, or when applied as an attribute (`kite-view="modelName"`), it immediately binds its subtree to the specified model:

```html
<!-- Tag syntax -->
<kite-view model="auth">
  <span kite-if="user" kite-text="'Logged in as ' + user.name"></span>
</kite-view>

<!-- Attribute syntax on standard elements -->
<header kite-view="auth">
  <span kite-if="user" kite-text="'Logged in as ' + user.name"></span>
</header>
```

---

### 3. The Controller (`<kite-controller>`)
The controller gives clean, semantic names to behaviors. Instead of inlining complicated multi-statement expressions into buttons or forms, controllers expose `<kite-action>` tags:

```html
<kite-controller model="auth">
  <!-- Named action that delegates to the model method -->
  <kite-action name="doLogin" run="login(draftUser); draftUser = ''"></kite-action>
  <kite-action name="doLogout" run="logout()"></kite-action>
</kite-controller>
```

#### Argument Passing in Actions:
When an action is invoked with arguments in the view (e.g. `doSomething('abc', 123)`), the arguments are accessible in `run="..."` via positional parameters:
- `$args` — Full array of passed arguments.
- `arg0`, `arg1`, `arg2` — Individual positional arguments.

```html
<kite-controller model="todos">
  <kite-action name="removeTodo" run="deleteItem(arg0)"></kite-action>
</kite-controller>

<kite-view model="todos">
  <button kite-on-click="removeTodo(item.id)">Delete</button>
</kite-view>
```

---

### 4. The Route (`<kite-route>` & `<kite-outlet>`)
The router maps URL hash changes (such as `#/`, `#/settings`, `#/about`) to named `<kite-view>` templates, rendering them inside `<kite-outlet>`:

```html
<!-- Route definitions -->
<kite-route path="/" view="home-view"></kite-route>
<kite-route path="/settings" view="settings-view"></kite-route>

<!-- Navigation links -->
<nav>
  <a href="#/">Home</a>
  <a href="#/settings">Settings</a>
</nav>

<!-- Active view mounts here -->
<main>
  <kite-outlet></kite-outlet>
</main>
```

---

## Complete Working MVCR Example

Here is a complete, self-contained single-page task manager demonstrating all 4 primitives working together:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MVCR Todo App</title>
  <link rel="stylesheet" href="https://esm.sh/@kitelet/core/dist/kite.css">
  <script type="module" src="https://esm.sh/@kitelet/core"></script>
</head>
<body kite-cloak>

  <!-- 1. MODEL -->
  <kite-model name="todo">
    {
      items: [
        { id: 1, text: 'Explore Kite MVCR', done: true },
        { id: 2, text: 'Build an app with 0 build step', done: false }
      ],
      draft: '',
      add() {
        if (!this.draft.trim()) return;
        this.items.push({ id: Date.now(), text: this.draft.trim(), done: false });
        this.draft = '';
      },
      clearCompleted() {
        this.items = this.items.filter(t => !t.done);
      }
    }
  </kite-model>

  <!-- 2. CONTROLLER -->
  <kite-controller model="todo">
    <kite-action name="addTodo" run="add()"></kite-action>
    <kite-action name="purgeDone" run="clearCompleted()"></kite-action>
  </kite-controller>

  <!-- 3. ROUTES -->
  <kite-route path="/" view="todos-view"></kite-route>
  <kite-route path="/about" view="about-view"></kite-route>

  <!-- 4. VIEWS -->
  <kite-view name="todos-view" model="todo">
    <h2>Task Board</h2>
    
    <form kite-on-submit.prevent="addTodo()">
      <input type="text" placeholder="What's next?" kite-model="draft">
      <button>Add</button>
    </form>

    <ul>
      <li kite-for="item in items" kite-class:done="item.done">
        <input type="checkbox" kite-model="item.done">
        <span kite-text="item.text"></span>
      </li>
    </ul>

    <button kite-on-click="purgeDone()">Clear Done</button>
    <p><a href="#/about">About This Toolkit →</a></p>
  </kite-view>

  <kite-view name="about-view">
    <h2>About Kite MVCR</h2>
    <p>Model, View, Controller, and Route are expressed directly as HTML tags.</p>
    <p><a href="#/">← Back to Tasks</a></p>
  </kite-view>

  <!-- Mount outlet -->
  <main>
    <kite-outlet></kite-outlet>
  </main>

</body>
</html>
```

---

## Advantages of MVCR in Kite

1. **Zero Framework Lock-in**: Your application is pure, valid HTML. It runs in any modern browser without compilers or bundlers.
2. **Order Independent**: Kite discovers all `<kite-model>`, `<kite-controller>`, and `<kite-route>` tags during an initial pre-scan pass before mounting elements, ensuring that tag order does not break behavior.
3. **No Hidden State**: Anyone inspecting the page source can immediately understand the data models, actions, and screens of the entire application at a glance.
4. **Global State Integration**: Complement your MVCR models with `<kite-store name="app">` for application-wide state (such as themes, user sessions, or notifications) that spans multiple routes and components effortlessly.

---

## Related Documentation
- [Declarative Zero-JS Routing](./routing.md)
- [Declarative Components](./components.md)
- [Scope & Reactivity Model](./scope.md)
