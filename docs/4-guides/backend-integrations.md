# Kite — Backend Integration Guides

> **HTML is enough for small things.** Supercharge your server-rendered applications with client reactivity — zero bundlers, zero Node.js runtime required on your server.

Kite is the ideal progressive enhancement toolkit for backend-driven architectures:
- **Zero Node.js dependency**: Serve Kite directly from your static assets or a public CDN.
- **Native HTML markup**: No JSX, no compilation step, no webpack/vite watchers running during backend development.
- **No syntax collision**: Kite uses `kite-*` attributes and native HTML tags, so it never clashes with server template delimiters like `{{ ... }}` or `<% ... %>`.

---

## 1. Laravel (Blade) Integration

Blade uses `{{ $variable }}` for server interpolation. Because Kite uses standard HTML attributes, there are zero syntax conflicts.

### Setup (`resources/views/layouts/app.blade.php`)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $title ?? 'My Laravel App' }}</title>
    
    <!-- Kite CSS & CDN runtime -->
    <link rel="stylesheet" href="https://esm.sh/@kitelet/core/dist/kite.css">
    <script type="module" src="https://esm.sh/@kitelet/core"></script>
</head>
<body kite-cloak>
    @yield('content')
</body>
</html>
```

### Passing Server Data to Kite Scope (`resources/views/todos.blade.php`)
```html
@extends('layouts.app')

@section('content')
<!-- Seed Kite scope with server-rendered JSON -->
<div kite-scope="{ 
    items: {{ json_encode($todos) }},
    filter: 'all',
    newTitle: ''
}">
    <h1>Todos for {{ Auth::user()->name }}</h1>

    <div class="add-box">
        <input type="text" kite-model="newTitle" placeholder="What needs to be done?">
        <button kite-on-click="if(newTitle) { items.push({ id: Date.now(), title: newTitle }); newTitle = ''; }">
            Add
        </button>
    </div>

    <ul>
        <li kite-for="todo in items">
            <span kite-text="todo.title"></span>
        </li>
    </ul>
</div>
@endsection
```

---

## 2. Django & Flask (Jinja2) Integration

Jinja templates render server variables inside `{{ ... }}` and blocks inside `{% ... %}`.

### Setup (`templates/base.html`)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{% block title %}Django App{% endblock %}</title>
    <link rel="stylesheet" href="https://esm.sh/@kitelet/core/dist/kite.css">
    <script type="module" src="https://esm.sh/@kitelet/core"></script>
</head>
<body kite-cloak>
    {% block content %}{% endblock %}
</body>
</html>
```

### CSRF Protection & Dynamic Fetching (`templates/dashboard.html`)
```html
{% extends 'base.html' %}

{% block content %}
<!-- Configure Kite API with Django's CSRF token -->
<kite-api base="/api" adapter="rest">
    <kite-header name="X-CSRFToken" value="{{ csrf_token }}"></kite-header>
</kite-api>

<kite-model name="metrics" api="metrics">
    {
        data: null,
        refresh() {
            this.api.get().then(res => this.data = res);
        }
    }
</kite-model>

<div kite-view="metrics-view" model="metrics" kite-init="refresh()">
    <h2>Live Metrics</h2>
    <span kite-if="loading">Refreshing...</span>
    
    <div kite-if="data">
        <p>Active Users: <strong kite-text="data.activeUsers"></strong></p>
        <p>Revenue: $<strong kite-text="data.revenue"></strong></p>
    </div>

    <button kite-on-click="refresh()">Refresh Now</button>
</div>
{% endblock %}
```

---

## 3. Ruby on Rails (ERB) Integration

In Rails, Kite replaces heavy JavaScript stacks (Turbo/Stimulus or React) for client-side UI interactivity while leaving Rails controllers and ActiveRecord untouched.

### Setup (`app/views/layouts/application.html.erb`)
```html
<!DOCTYPE html>
<html>
  <head>
    <title>RailsApp</title>
    <%= csrf_meta_tags %>
    <%= csp_meta_tag %>

    <link rel="stylesheet" href="https://esm.sh/@kitelet/core/dist/kite.css">
    <script type="module" src="https://esm.sh/@kitelet/core"></script>
  </head>
  <body kite-cloak>
    <%= yield %>
  </body>
</html>
```

### Modal Dialog Component (`app/views/posts/index.html.erb`)
```html
<!-- Define a reusable Kite component in Rails partial -->
<kite-component name="confirm-dialog">
  <div class="modal" kite-if="isOpen">
    <div class="modal-card">
      <h3 kite-text="title">Confirm</h3>
      <p><slot></slot></p>
      <button kite-on-click="isOpen = false">Cancel</button>
      <button class="danger" kite-emit:confirm="true">Proceed</button>
    </div>
  </div>
</kite-component>

<div kite-scope="{ modalOpen: false, selectedPost: null }">
  <h1>Posts</h1>

  <% @posts.each do |post| %>
    <div class="post-row">
      <span><%= post.title %></span>
      <button kite-on-click="modalOpen = true; selectedPost = <%= post.id %>">
        Delete
      </button>
    </div>
  <% end %>

  <kite-use name="confirm-dialog" kite-bind:is-open="modalOpen" title="Delete Post">
    Are you sure you want to delete this post?
  </kite-use>
</div>
```

---

## 4. Go (`html/template`) Integration

Go's standard `html/template` package parses HTML securely. Because Kite attributes use standard HTML5 syntax, Go's template engine validates them without escaping issues.

### Server (`main.go`)
```go
package main

import (
    "html/template"
    "net/http"
)

type Product struct {
    ID    int     `json:"id"`
    Name  string  `json:"name"`
    Price float64 `json:"price"`
}

func handler(w http.ResponseWriter, r *http.Request) {
    tmpl := template.Must(template.ParseFiles("index.html"))
    products := []Product{
        {ID: 1, Name: "Mechanical Keyboard", Price: 120.00},
        {ID: 2, Name: "Ergonomic Mouse", Price: 75.50},
    }
    tmpl.Execute(w, products)
}
```

### Template (`index.html`)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Go + Kite</title>
    <link rel="stylesheet" href="https://esm.sh/@kitelet/core/dist/kite.css">
    <script type="module" src="https://esm.sh/@kitelet/core"></script>
</head>
<body kite-cloak>
    <div kite-scope="{ cart: [], currency: '$' }">
        <h1>Product Catalog</h1>

        <div class="grid">
            {{ range . }}
            <div class="card">
                <h3>{{ .Name }}</h3>
                <p>${{ .Price }}</p>
                <button kite-on-click="cart.push({ id: {{ .ID }}, name: '{{ .Name }}', price: {{ .Price }} })">
                    Add to Cart
                </button>
            </div>
            {{ end }}
        </div>

        <div class="cart-summary" kite-if="cart.length > 0">
            <h3>Cart (<span kite-text="cart.length"></span> items)</h3>
            <ul>
                <li kite-for="item in cart">
                    <span kite-text="item.name"></span> — $<span kite-text="item.price"></span>
                </li>
            </ul>
        </div>
    </div>
</body>
</html>
```

---

## 5. Summary of Best Practices for Backends

1. **Seed Initial State with JSON**: Use your language's native JSON encoder (e.g. `json_encode($data)` or `json.dumps(data)`) directly inside `kite-scope="{ ... }"`.
2. **Inject CSRF Tokens with `<kite-api>`**: Use `<kite-header name="X-CSRF-TOKEN" value="...">` to ensure all API client mutations authenticate seamlessly.
3. **Use `kite-cloak` on `<body>`**: Prevent initial template flickers before client hydration.
4. **Zero Node Build Steps**: Keep your deployment pipeline simple — no `npm run build` needed on production servers.
