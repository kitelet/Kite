# Kite + Laravel — Works Perfectly Together

> **HTML is enough for small things — and Blade is just HTML with superpowers.**

Kite works natively with Laravel. No adapters, no bridges, no package wrappers required. Drop Kite into any Blade view and it runs immediately.

This guide provides everything Laravel developers need to add client-side reactivity without leaving their existing stack.

---

## 1. Why It Just Works

Laravel and Kite share the same core philosophy: **HTML is the API**.

| Laravel | Kite |
| :--- | :--- |
| Blade directives: `@if`, `@foreach` | Kite attributes: `kite-if`, `kite-for` |
| Eloquent models | `<kite-model>` |
| Controllers | `<kite-controller>` |
| Routes | `<kite-route>` (client-side) |
| API resources | `<kite-api>` |
| Components | `<kite-component>` / `<kite-use>` |

**They don't compete. They layer.**

Laravel renders the initial HTML on the server. Kite makes it interactive in the browser. Blade runs first on the server; Kite runs second in the browser. Zero conflicts.

---

## 2. The 60-Second Setup

### Step 1 — Add Kite to your Blade layout

```blade
{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', config('app.name'))</title>

    @vite(['resources/css/app.css'])
    <!-- Kite CDN runtime -->
    <script type="module" src="https://cdn.jsdelivr.net/npm/@kitelet/core/dist/kite.min.js"></script>
</head>
<body class="bg-gray-50 text-gray-900" kite-cloak>
    @yield('content')
</body>
</html>
```

### Step 2 — Write a Blade view with Kite

```blade
{{-- resources/views/counter.blade.php --}}
@extends('layouts.app')

@section('content')
    <div class="max-w-md mx-auto my-12 p-6 bg-white rounded-xl shadow"
         kite-scope="{ count: {{ $start ?? 0 }} }">
        <h2 class="text-xl font-bold mb-4">Reactive Counter</h2>
        <div class="flex items-center gap-4">
            <button class="px-3 py-1 bg-gray-200 rounded font-bold"
                    kite-on-click="count--">−</button>
            <span class="text-2xl font-bold"
                  kite-text="count"></span>
            <button class="px-3 py-1 bg-blue-600 text-white rounded font-bold"
                    kite-on-click="count++">+</button>
        </div>
    </div>
@endsection
```

### Step 3 — Done.

Server-rendered `$start` populates the initial state. Client-reactive `count` increments and decrements instantly in the browser.

---

## 3. Blade + Kite — Side by Side

The two syntaxes never collide. Blade processes on the server before sending HTML down the wire. Kite parses attributes when the DOM loads in the client.

| Task | Blade (Server-side) | Kite (Client-side) |
| :--- | :--- | :--- |
| **Looping** | `@foreach($items as $item)` | `kite-for="item in items"` |
| **Conditions** | `@if($user)` | `kite-if="user"` |
| **Interpolation** | `{{ $user->name }}` | `kite-text="user.name"` |
| **Components** | `<x-alert type="error" />` | `<kite-use name="alert">` |
| **User Events** | — *(requires JS)* | `kite-on-click="save()"` |
| **Local State** | — *(requires server hit)* | `kite-scope="{ open: false }"` |

**Rule of thumb:** Use Blade for what the server knows upon initial request. Use Kite for what happens in the browser after load.

---

## 4. Passing Server Data to Kite

### 4.1 Inline Object Expression

Use Laravel's native `@json()` directive directly in `kite-scope`:

```blade
<div kite-scope="{ user: @json($user), activeTab: 'profile' }">
    <h1 kite-text="user.name"></h1>
    <p kite-text="user.email"></p>
</div>
```

### 4.2 Data Attributes

If you prefer keeping attribute expressions minimal:

```blade
<div id="user-profile"
     data-user='@json($user)'
     kite-scope="{ user: JSON.parse($el.dataset.user) }">
    <h1 kite-text="user.name"></h1>
</div>
```

### 4.3 Bootstrap from a JSON API Endpoint

Let Kite's declarative `<kite-api>` fetch directly from Laravel API routes:

```blade
<kite-api name="main" base="/api">
    <kite-header name="X-CSRF-TOKEN" value="{{ csrf_token() }}"></kite-header>
</kite-api>

<kite-model name="users" api="main">
    {
        list: [],
        async load() {
            this.list = await this.api.get('/users');
        }
    }
</kite-model>
```

---

## 5. Kite Talking to Laravel Routes

Laravel's standard API controllers and resource routes work out of the box.

```php
// routes/api.php
Route::get('/todos', [TodoController::class, 'index']);
Route::post('/todos', [TodoController::class, 'store']);
Route::delete('/todos/{id}', [TodoController::class, 'destroy']);
```

```blade
<kite-api name="main" base="/api">
    <kite-header name="X-CSRF-TOKEN" value="{{ csrf_token() }}"></kite-header>
</kite-api>

<kite-model name="todos" api="main">
    {
        items: [],
        async load()       { this.items = await this.api.get('/todos'); },
        async add(text)    { this.items.push(await this.api.post('/todos', { text })); },
        async remove(id)   { await this.api.delete('/todos/' + id); this.load(); }
    }
</kite-model>
```

Same URLs, same controllers, same Eloquent models underneath.

---

## 6. CSRF Handling

Laravel requires CSRF validation on all state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`). Kite supports this declaratively in two ways:

### Method A — Declarative Header

```blade
<kite-api name="main" base="/api">
    <kite-header name="X-CSRF-TOKEN" value="{{ csrf_token() }}"></kite-header>
</kite-api>
```

Every request from this `<kite-api>` client automatically carries the CSRF header.

### Method B — Meta Tag

Place Laravel's standard meta tag in `<head>`:

```blade
<meta name="csrf-token" content="{{ csrf_token() }}">
```

Kite's API client automatically checks for `meta[name="csrf-token"]` and attaches it to outbound mutation requests if present.

---

## 7. Sanctum & Passport Authentication

### 7.1 Sanctum (SPA Session Cookie Mode)

When your frontend and backend run on the same top-level domain:

```blade
<kite-api name="main" base="/api" credentials="include"></kite-api>
```

Laravel Sanctum's first-party session cookies flow automatically with every fetch call.

### 7.2 Sanctum & Passport (Token Mode)

When using API tokens (`Bearer`):

```blade
<kite-api name="main" base="/api">
    <kite-header name="Authorization" value="Bearer {{ session('api_token') }}"></kite-header>
</kite-api>
```

---

## 8. Blade Components vs. Kite Components

| Need | Recommended Tool | Why |
| :--- | :--- | :--- |
| Server-rendered layout & SEO | **Blade Component** (`<x-layout>`) | Zero client footprint, fast server rendering. |
| Client-reactive widgets with state | **Kite Component** (`<kite-use>`) | Reactive scope, DOM diffing, events. |
| Needs server-side PHP data / auth checks | **Blade Component** | Direct access to Eloquent, Auth, Session. |
| Needs browser interactions & instant updates | **Kite Component** | Runs in browser without full roundtrips. |

### 8.1 Blade Component Wrapping Kite

```blade
{{-- resources/views/components/counter.blade.php --}}
@props(['start' => 0])

<div {{ $attributes->merge(['class' => 'counter-widget']) }}
     kite-scope="{ count: {{ $start }} }">
    <button kite-on-click="count--">−</button>
    <span kite-text="count"></span>
    <button kite-on-click="count++">+</button>
</div>
```

```blade
<x-counter :start="10" class="my-4" />
```

### 8.2 Kite Component Utilizing Blade Data

```blade
<kite-component name="user-badge">
    <template>
        <div class="user-badge">
            <strong kite-text="name"></strong>
            <span class="role" kite-text="role"></span>
        </div>
    </template>
</kite-component>

@foreach($users as $user)
    <kite-use name="user-badge"
              name="{{ $user->name }}"
              role="{{ $user->role }}">
    </kite-use>
@endforeach
```

---

## 9. Livewire & Inertia Coexistence

Kite coexists cleanly with both Laravel Livewire and Inertia.js.

### 9.1 Livewire Coexistence

| Concern | Livewire | Kite |
| :--- | :--- | :--- |
| **Roundtrips** | Server-side PHP re-renders | Purely client-side |
| **DOM Ownership** | Elements marked with `wire:id` | Elements with `kite-*` |
| **Attributes** | `wire:*` | `kite-*` |
| **Conflicts** | None | None |

```blade
<div>
    {{-- Livewire handles heavy business forms --}}
    <livewire:checkout-form />

    {{-- Kite handles quick client-only UI interactions --}}
    <div kite-scope="{ openHelp: false }">
        <button kite-on-click="openHelp = !openHelp">Need Help?</button>
        <div kite-show="openHelp" class="help-popover">
            Contact support at support@example.com
        </div>
    </div>
</div>
```

*Golden Rule:* If Livewire owns the element, use `wire:`. If Kite owns it, use `kite-`. Do not mix attributes on the exact same DOM node.

### 9.2 Inertia.js Coexistence

Inertia handles client-side page routing and controller props; Kite handles lightweight, isolated component behavior inside Vue/React views without needing complex state stores.

---

## 10. Common Laravel + Kite Patterns

### 10.1 Search with Debounce

```blade
<div kite-scope="{ query: '', results: [] }">
    <input type="search"
           placeholder="Search records..."
           kite-model="query"
           kite-on-input.debounce="results = await Kite.api('main').get('/search', { q: query })">

    <ul>
        <li kite-for="res in results" kite-text="res.title"></li>
    </ul>
</div>
```

### 10.2 Flash Messages from Session

```blade
@if(session('success'))
    <div class="alert alert-success"
         kite-scope="{ show: true }"
         kite-show="show">
        <span>{{ session('success') }}</span>
        <button type="button" kite-on-click="show = false">×</button>
    </div>
@endif
```

### 10.3 Auth-Aware UI

```blade
<div kite-scope="{ user: @json(Auth::user()) }">
    <div kite-if="user">
        Welcome back, <span kite-text="user.name"></span>!
    </div>
    <div kite-else>
        <a href="{{ route('login') }}">Sign In</a>
    </div>
</div>
```

---

## 11. Deployment

Kite does not change how you build or deploy Laravel applications:
- **CDN**: One `<script>` tag in your layout. No build step required.
- **Vite (Bundled)**: `npm install @kitelet/core` and `import '@kitelet/core';` in `resources/js/app.js`. `npm run build` bundles Kite cleanly.
- Standard deployments via Laravel Forge, Vapor, Ploi, or Docker require zero configuration changes.

---

## 12. Summary

Kite is a drop-in reactive companion for Laravel. Blade renders the foundation; Kite manages browser interactivity. No build chains, no adapters, and no framework lock-in.
