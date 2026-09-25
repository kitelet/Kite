{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Laravel + Kite Todo')</title>

    <!-- Tailwind CSS (or @vite(['resources/css/app.css'])) -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Kite Toolkit CDN -->
    <script type="module" src="https://cdn.jsdelivr.net/npm/@kitelet/core/dist/kite.min.js"></script>
</head>
<body class="bg-slate-100 min-h-screen text-slate-800" kite-cloak>
    <main class="py-12 px-4">
        @yield('content')
    </main>
</body>
</html>
