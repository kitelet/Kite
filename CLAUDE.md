# Claude Code Instructions — Kite Toolkit

Kite is a zero-build teaching toolkit for building small, self-contained interactive web apps using pure HTML and CSS.

## Critical Guidelines for Claude

1. **HTML-First Interactivity**: Never generate vanilla JavaScript event handlers or DOM manipulations unless explicitly requested. Always use Kite directives (`kite-scope`, `kite-text`, `kite-model`, `kite-for`, `kite-if`, `kite-on-*`).
2. **Never Invent Directives**: Check `.kite/capabilities.json` for all valid directives, tags, attributes, and API methods. For example, never generate `kite-fro` (use `kite-for`).
3. **Strict Separation of Concerns**:
   - Only Models (`<kite-model>`) manage data, state mutations, and backend API interactions.
   - Views (`<kite-view>`) only bind to models; they never fetch or call external APIs directly.
   - Controllers (`<kite-controller>`) dispatch actions to models.
4. **Zero-Eval Security**: Never generate `eval()` or `new Function()`. Kite runs under strict CSP without `unsafe-eval`.
5. **Attribute Ordering**: Follow Kite's 9-slot convention:
   `[identity] [state] [data-in] [render] [control] [events] [lifecycle] [escape] [config]`
6. **Scale Awareness**: If a requested UI involves > 500 interactive nodes or > 20 models, warn the user and suggest graduation paths per `.kite/limits.json` and `docs/4-guides/graduating.md`.

## Project Navigation

- Directives & APIs: `.kite/capabilities.json`
- Rules & Constraints: `.kite/rules.json`
- Markup Conventions: `.kite/conventions.json`
- Scale Limits: `.kite/limits.json`
- Master Reference: `AGENTS.md` and `llms.txt`
