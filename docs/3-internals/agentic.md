# Agentic-Ready Toolkit

> **HTML is enough for small things — and clear enough for AI to help build them.**

Kite ships with a first-class **agentic layer**: machine-readable files, structured metadata, and deterministic conventions that allow AI coding agents, IDE assistants, documentation crawlers, and LLM tools to understand a Kite codebase on first contact — without guessing or hallucinating APIs.

---

## 1. The Thesis

### The Problem
AI coding agents often fail when working with specialized or lightweight frameworks because:
- They hallucinate APIs that do not exist (e.g. inventing `kite-fro` instead of `kite-for`).
- They guess at file structure and project layouts.
- They invent non-existent directives or mix syntax from Vue/Alpine/React.
- They miss critical conventions and scale constraints.

Most frameworks are authored exclusively for human readers: documentation is narrative prose, rules are implicit, and constraints live only in maintainers' heads.

### The Solution
Kite ships **explicit, machine-readable metadata** alongside human documentation:

> **Every human doc has a machine twin.**  
> **Every rule has a name.**  
> **Every convention is published.**  
> **Every constraint is checkable.**

---

## 2. The Agentic File Set

Every Kite project — and the core toolkit repository — ships with these files at the root:

| File | Purpose | Primary Consumer |
| :--- | :--- | :--- |
| `AGENTS.md` | Single entry point and orientation guide | AI coding agents |
| `.kite/manifest.json` | Machine-readable project structure and asset counts | Agents, IDEs, CLI tools |
| `.kite/capabilities.json` | Complete directive, tag, helper, and API catalog with signatures | Agents, autocomplete engines |
| `.kite/rules.json` | Named, checkable architectural and security constraints | Agents, linters, CI checks |
| `.kite/conventions.json` | 9-slot markup order, naming standards, and file patterns | Agents, formatters |
| `.kite/limits.json` | Scale limits, sweet spots, and graduation triggers | Agents, `kite doctor` |
| `llms.txt` | Structured summary following the llmstxt.org standard | Documentation crawlers, LLMs |
| `llms-full.txt` | Complete plaintext concatenated corpus of all docs | LLMs, offline agents |
| `CLAUDE.md` | Tailored instructions for Claude Code | Claude Code |
| `.cursorrules` | Project rules for Cursor editor | Cursor |
| `.github/copilot-instructions.md` | Tailored instructions for GitHub Copilot | GitHub Copilot |
| `.windsurfrules` | Project rules for Windsurf editor | Windsurf |
| `.aider.conf.yml` | Context configuration for Aider CLI | Aider |
| `.continue/config.json` | Context index for Continue IDE | Continue |

---

## 3. How Agents Onboard

When an AI agent (such as Antigravity, Claude, Copilot, or Cursor) encounters a Kite repository:

```
Step 1: Read AGENTS.md                 ─→ Learns philosophy, layout, critical rules
Step 2: Read .kite/manifest.json       ─→ Learns project structure and asset counts
Step 3: Read .kite/capabilities.json   ─→ Learns all valid directives, tags, signatures
Step 4: Read .kite/rules.json          ─→ Learns constraints & severity levels
Step 5: Read .kite/conventions.json    ─→ Learns 9-slot attribute order and naming
Step 6: Read .kite/limits.json         ─→ Learns scale limits (<500 nodes) & exit paths
```

**Total onboarding footprint**: 6 files, ~1,500 lines combined, parsed in milliseconds. Hallucination is eliminated because the complete capability boundary is explicitly declared.

---

## 4. CLI Commands

The Kite CLI includes built-in commands to generate and audit the agentic layer:

### Building & Synchronizing
```bash
kite agentic:build
```
- Scans `docs/` and compiles `llms-full.txt`.
- Inspects project assets and updates `.kite/manifest.json`.
- Synchronizes IDE configuration files (`CLAUDE.md`, `.cursorrules`, etc.).

### Health Check & Drift Prevention
```bash
kite agentic:check
```
- Validates all `.kite/*.json` files against their schemas.
- Audits implemented directives in `src/directives/` against `.kite/capabilities.json`.
- Confirms freshness of `llms-full.txt` and `llms.txt`.
- Exits with non-zero status code in CI if metadata drift is detected.

---

## 5. Architectural Separation Rules

AI agents must strictly adhere to Kite's core architectural constraints:

1. **Only Models touch the network**: `<kite-api>` definitions and data fetching belong exclusively in `<kite-model>`.
2. **Views never fetch**: `<kite-view>` elements only bind to model state.
3. **Controllers never fetch**: `<kite-controller>` handles and dispatches actions to models.
4. **`kite-text` always escapes**: Strictly escapes HTML by default. Use `kite-html` only when raw HTML is explicitly intended.
5. **Zero-eval guarantee**: Never generate `eval()` or `new Function()`. Kite runs cleanly under strict CSP.
6. **Nine-slot attribute order**:
   `[identity] [state] [data-in] [render] [control] [events] [lifecycle] [escape] [config]`
