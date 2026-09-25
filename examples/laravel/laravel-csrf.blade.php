{{-- examples/laravel/laravel-csrf.blade.php --}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>🛡️ Laravel CSRF + Kite — Integration Example</title>
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

    <!-- Configure Kite API client with Laravel CSRF token header -->
    <kite-api name="main" base="/api">
        <kite-header name="X-CSRF-TOKEN" value="{{ csrf_token() }}"></kite-header>
    </kite-api>

    <div class="kite-card" kite-scope="{ feedback: '', submitted: false }">
        <h1 class="kite-title">🛡️ Laravel CSRF + Kite</h1>
        <p class="kite-desc">Pass Blade CSRF tokens automatically to Kite's declarative API client.</p>

        <form kite-on-submit.prevent="
            await Kite.api('main').post('/feedback', { comment: feedback });
            submitted = true;
            feedback = '';
        ">
            <textarea class="kite-input" style="min-height: 100px; margin-bottom: 1rem;" kite-model="feedback" placeholder="Your thoughts..." required></textarea>
            <button class="kite-btn kite-btn-primary" type="submit">Submit Feedback</button>
        </form>

        <div class="kite-badge" style="margin-top: 1rem; width: 100%; justify-content: center; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3);" kite-if="submitted">
            ✅ Thank you! Your feedback was securely submitted with Laravel CSRF verification.
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
