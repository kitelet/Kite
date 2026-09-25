{{-- examples/laravel/laravel-livewire.blade.php --}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>⚡ Livewire + Kite Coexistence — Integration Example</title>
    <link rel="stylesheet" href="../shared.css">
    @livewireStyles
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

    <!-- Main Card Container -->
    <div class="kite-card">
      <h1 class="kite-title">⚡ Livewire &amp; Kite Coexistence</h1>
      <p class="kite-desc">Clear boundaries: Livewire handles server roundtrips, Kite handles instant zero-latency client state.</p>

      <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
        <!-- Livewire Side -->
        <div style="background: rgba(11, 17, 32, 0.6); padding: 1rem; border-radius: 8px; border: 1px solid var(--kite-card-border);">
            <h3 style="margin-top: 0; color: #f8fafc; font-size: 1rem;">1. Laravel Livewire Side</h3>
            <p style="color: var(--kite-text-muted); font-size: 0.85rem; margin-bottom: 0.5rem;">Managed via <code>wire:*</code> attributes and server PHP calls.</p>
            <livewire:user-search />
        </div>

        <!-- Kite Client-Only UI -->
        <div style="background: rgba(11, 17, 32, 0.6); padding: 1rem; border-radius: 8px; border: 1px solid var(--kite-card-border);"
             kite-scope="{ openModal: false }">
            <h3 style="margin-top: 0; color: #f8fafc; font-size: 1rem;">2. Kite Client-Only UI</h3>
            <p style="color: var(--kite-text-muted); font-size: 0.85rem; margin-bottom: 0.75rem;">Managed via <code>kite-*</code> attributes directly in the browser.</p>

            <button class="kite-btn kite-btn-primary" type="button" kite-on-click="openModal = !openModal">
                Toggle Quick Notes
            </button>

            <div kite-show="openModal" style="margin-top: 0.75rem; padding: 0.75rem 1rem; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px;">
                <strong style="color: var(--kite-primary);">Local Draft Note:</strong>
                <p style="margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--kite-text);">
                  This panel opens instantly in the browser without any HTTP requests or Livewire lifecycle triggers.
                </p>
            </div>
        </div>
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

    @livewireScripts
</body>
</html>
