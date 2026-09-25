# GitHub Copilot Instructions for Kite

When generating or editing HTML and CSS in this repository:

1. **Use Native Kite Directives**: Use `kite-scope`, `kite-text`, `kite-html`, `kite-bind:*`, `kite-model`, `kite-for`, `kite-if`, `kite-show`, and `kite-on-*`. Do not generate custom inline `<script>` tags or framework imports (React, Vue, Alpine).
2. **Consult Capabilities**: Refer to `.kite/capabilities.json` for exact syntax, signatures, and directive modifiers.
3. **Follow the 9-Slot Attribute Order**:
   - Slot 1 (identity): `id`, `class`, `name`, `data-*`
   - Slot 2 (state): `kite-scope`, `kite-persist*`
   - Slot 3 (data-in): `kite-model`, `kite-bind:*`
   - Slot 4 (render): `kite-text`, `kite-html`, `kite-show`, `kite-class:*`, `kite-style:*`
   - Slot 5 (control): `kite-if`, `kite-elif`, `kite-else`, `kite-for`
   - Slot 6 (events): `kite-on-*`, `kite-emit:*`, `kite-reset`, `kite-copy`
   - Slot 7 (lifecycle): `kite-init`, `kite-watch:*`, `kite-poll.*`, `kite-cloak`
   - Slot 8 (escape): `kite-skip`
   - Slot 9 (config): `kite-config:*`, `kite-debounce`, `kite-throttle`
4. **Architectural Separation**: Keep network operations inside `<kite-model>`. Views (`<kite-view>`) must remain purely declarative presentation templates.
5. **Security**: Maintain zero-eval guarantees. Never introduce `eval` or dynamic code evaluation.
