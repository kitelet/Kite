{{-- examples/laravel/laravel-sanctum.blade.php --}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>🔐 Laravel Sanctum Auth + Kite</title>
    <link rel="stylesheet" href="../shared.css">
    <script type="module" src="https://cdn.jsdelivr.net/npm/@kitelet/core/dist/kite.min.js"></script>
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

    <!-- SPA Mode: Sanctum First-Party Session Cookies -->
    <kite-api name="sanctum" base="/api" credentials="include">
        <kite-header name="X-CSRF-TOKEN" value="{{ csrf_token() }}"></kite-header>
    </kite-api>

    <div class="kite-card" kite-scope="{ user: null, loading: false }">
        <h1 class="kite-title">🔐 Laravel Sanctum SPA Auth</h1>
        <p class="kite-desc">First-party session cookies with <code>credentials="include"</code> and reactive user state.</p>

        <div class="kite-badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); width: 100%; justify-content: center; margin-bottom: 1rem;" kite-if="loading">
            ⏳ Checking authentication state...
        </div>

        <div kite-if="user" style="background: rgba(11, 17, 32, 0.6); padding: 1rem; border-radius: 8px; border: 1px solid var(--kite-card-border);">
            <h3 style="margin-top: 0; color: #f8fafc;">Welcome, <span kite-text="user.name" style="color: var(--kite-primary);"></span></h3>
            <p style="margin-bottom: 1rem; color: var(--kite-text-muted);">Email: <strong kite-text="user.email" style="color: var(--kite-text);"></strong></p>
            <button class="kite-btn kite-btn-danger" kite-on-click="
                await Kite.api('sanctum').post('/logout');
                user = null;
            ">Log Out</button>
        </div>

        <div kite-if="!user && !loading" style="text-align: center; padding: 1rem 0;">
            <p style="color: var(--kite-text-muted); margin-bottom: 1rem;">You are browsing as a guest.</p>
            <button class="kite-btn kite-btn-primary" kite-on-click="
                loading = true;
                user = await Kite.api('sanctum').get('/user');
                loading = false;
            ">Fetch Profile via Sanctum</button>
        </div>
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
