{{-- examples/laravel/laravel-flash.blade.php --}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>💬 Laravel Flash Messages + Kite</title>
    <link rel="stylesheet" href="../shared.css">
    <script type="module" src="https://cdn.jsdelivr.net/npm/@kitelet/core/dist/kite.min.js"></script>
    <style>
        .flash-alert {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.85rem 1rem;
            margin-bottom: 1.25rem;
            border-radius: 8px;
            background: rgba(34, 197, 94, 0.15);
            color: #4ade80;
            border: 1px solid rgba(34, 197, 94, 0.3);
            font-size: 0.9rem;
        }
        .close-btn {
            background: none;
            border: none;
            font-size: 1.25rem;
            cursor: pointer;
            color: inherit;
            padding: 0 0.25rem;
        }
    </style>
</head>
<body>

    <!-- Topbar Navigation -->
    <div class="kite-topbar">
      <a href="../index.html" class="kite-back-link">
        <svg class="kite-icon" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
        <span>Gallery</span>
      </a>
      <span class="kite-chip">🔴 Laravel + Blade</span>
    </div>

    <!-- Main Card Container -->
    <div class="kite-card">
        <h1 class="kite-title">💬 Laravel Flash Messages</h1>
        <p class="kite-desc">Server session messages rendered into client-dismissible Kite scopes.</p>

        {{-- Server session flash rendered into client-dismissible Kite scope --}}
        @if(session('status', 'Your profile changes have been saved successfully!'))
            <div class="flash-alert"
                 kite-scope="{ visible: true }"
                 kite-show="visible">
                <span>{{ session('status', 'Your profile changes have been saved successfully!') }}</span>
                <button class="close-btn"
                        type="button"
                        kite-on-click="visible = false"
                        title="Dismiss alert">✕</button>
            </div>
        @endif

        <p style="color: var(--kite-text-muted); font-size: 0.9rem; margin: 0;">
            The notification dismisses smoothly without reloading the page or pinging the server.
        </p>
    </div>

    <!-- Official Banner Footer -->
    <footer class="kite-footer">
      <a href="../index.html" title="Kite Examples Gallery">
        <img src="../../assets/kite-banner.svg" alt="Kite Toolkit" class="kite-footer-banner">
      </a>
      <div class="kite-footer-meta">
        HTML is enough for small things &bull; <a href="../index.html">← All Examples</a>
      </div>
    </footer>

</body>
</html>
