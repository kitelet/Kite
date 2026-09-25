# Laravel 11 + Kite Example Application

A full-stack, zero-build reactive application demonstrating how **Kite** seamlessly enhances **Laravel Blade**.

## Features

- **Standard Blade Layout**: Uses `resources/views/layouts/app.blade.php` with standard `@yield` directives.
- **Kite CDN Integration**: Loaded via a single CDN `<script>` tag. No Node.js build chain or npm package required.
- **Automatic CSRF Handling**: `<kite-header name="X-CSRF-TOKEN" value="{{ csrf_token() }}">` attaches Laravel's session CSRF token to every mutation.
- **RESTful Eloquent Endpoints**: Standard Laravel controllers (`TodoController`) return JSON models directly to `<kite-model>`.
- **Zero Frontend JS**: All reactivity, data fetching, mutations, and inline list rendering are defined in declarative HTML tags and attributes.

## Directory Structure

```text
examples/laravel-todo/
├── app/
│   └── Http/
│       └── Controllers/
│           └── TodoController.php
├── resources/
│   └── views/
│       ├── layouts/
│       │   └── app.blade.php
│       └── todos.blade.php
├── routes/
│   ├── api.php
│   └── web.php
└── README.md
```
