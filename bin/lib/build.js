/**
 * @file bin/lib/build.js
 * @description Production build compiler for Kite projects.
 *
 * What it does:
 *  1. Reads public/index.html.
 *  2. Resolves all <kite-include src="..."> recursively.
 *  3. Copies static assets from public/, styles/.
 *  4. Optionally minifies the Kite runtime via esbuild (if available).
 *  5. Writes everything to the configured out directory (default: dist/).
 *  6. Prints a size summary table.
 *
 * Honors .kiteignore and kite.config.json.
 * Zero third-party dependencies required (esbuild is optional/peer).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Helpers ───────────────────────────────────────────────────────────────
function readFile(p) { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function bytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── .kiteignore Parser ────────────────────────────────────────────────────
function loadIgnorePatterns(projectRoot) {
  const ignoreFile = path.join(projectRoot, '.kiteignore');
  if (!fs.existsSync(ignoreFile)) return [];
  return fs.readFileSync(ignoreFile, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}
function isIgnored(relPath, patterns) {
  return patterns.some(p => relPath.startsWith(p) || relPath.includes(p));
}

// ─── Include Resolver ──────────────────────────────────────────────────────
/**
 * Recursively resolve <kite-include src="..."> tags in an HTML string.
 * @param {string} html
 * @param {string} projectRoot
 * @param {Set<string>} [seen]
 * @returns {string}
 */
function resolveIncludes(html, projectRoot, seen = new Set()) {
  return html.replace(/<kite-include\s+src=["']([^"']+)["']\s*(?:\/>|>(?:<\/kite-include>)?)/gi, (_match, src) => {
    const candidates = [
      path.join(projectRoot, 'public', src.replace(/^\//, '')),
      path.join(projectRoot, src.replace(/^\//, '')),
    ];
    const resolved = candidates.find(c => fs.existsSync(c));
    if (!resolved) return `<!-- kite-include not found: ${src} -->`;
    if (seen.has(resolved)) return `<!-- kite-include circular: ${src} -->`;
    seen.add(resolved);
    try {
      const content = fs.readFileSync(resolved, 'utf8');
      return resolveIncludes(content, projectRoot, seen);
    } catch (_) {
      return `<!-- kite-include read error: ${src} -->`;
    }
  });
}

// ─── Simple HTML Minifier ──────────────────────────────────────────────────
function minifyHtml(html) {
  return html
    .replace(/<!--(?!.*kite-include).*?-->/gs, '') // strip comments (preserve kite warnings)
    .replace(/\s{2,}/g, ' ')                        // collapse whitespace
    .replace(/>\s+</g, '><')                         // remove whitespace between tags
    .trim();
}

// ─── Directory Copier ──────────────────────────────────────────────────────
function copyDir(src, dest, ignorePatterns, summary) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const rel = path.relative(src, srcPath);
    if (isIgnored(rel, ignorePatterns)) continue;
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, ignorePatterns, summary);
    } else {
      fs.copyFileSync(srcPath, destPath);
      const size = fs.statSync(destPath).size;
      summary.push({ file: destPath, size });
    }
  }
}

// ─── Print Size Summary ────────────────────────────────────────────────────
function printSummary(outDir, summary) {
  const total = summary.reduce((acc, f) => acc + f.size, 0);
  console.log(`\n📦 Build complete — ${bytes(total)} total\n`);
  for (const { file, size } of summary) {
    const rel = path.relative(outDir, file).replace(/\\/g, '/');
    console.log(`  ${bytes(size).padStart(8)}  ${rel}`);
  }
  console.log('');
}

// ─── Presets ───────────────────────────────────────────────────────────────
export const PRESETS = {
  minimal: ['text', 'on', 'if', 'for'],
  forms: ['text', 'model', 'rule', 'field', 'on', 'if'],
  app: ['text', 'on', 'if', 'for', 'model', 'view', 'route', 'component'],
  full: null
};

export function resolveDirectives({ preset, only }) {
  if (only) {
    return only.split(',').map(s => s.trim().replace(/^kite-/, '')).filter(Boolean);
  }
  if (preset && PRESETS[preset] !== undefined) {
    return PRESETS[preset];
  }
  return null;
}

// ─── Public API ────────────────────────────────────────────────────────────
/**
 * Run the production build.
 * @param {object} options
 * @param {string} options.projectRoot
 * @param {string} [options.outDir='dist']
 * @param {boolean} [options.minify=true]
 * @param {string} [options.only]
 * @param {string} [options.preset]
 */
export async function build({ projectRoot, outDir = 'dist', minify = true, only = null, preset = null } = {}) {
  const outPath = path.resolve(projectRoot, outDir);
  const ignorePatterns = loadIgnorePatterns(projectRoot);
  const summary = [];
  const selectedDirectives = resolveDirectives({ preset, only });

  // 1. Load kite.config.json for overrides
  const configFile = path.join(projectRoot, 'kite.config.json');
  let config = {};
  if (fs.existsSync(configFile)) {
    try { config = JSON.parse(fs.readFileSync(configFile, 'utf8')); } catch (_) {}
  }
  const finalOut = config?.build?.out || outDir;
  const finalOutPath = path.resolve(projectRoot, finalOut);
  const finalMinify = config?.build?.minify ?? minify;

  // 2. Clean output dir
  if (fs.existsSync(finalOutPath)) {
    fs.rmSync(finalOutPath, { recursive: true, force: true });
  }
  ensureDir(finalOutPath);

  // 3. Read and resolve index.html
  const indexPath = path.join(projectRoot, 'public', 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Missing public/index.html in project root: ${projectRoot}`);
  }
  let html = fs.readFileSync(indexPath, 'utf8');
  html = resolveIncludes(html, projectRoot);

  if (selectedDirectives && !html.includes('kite-config')) {
    if (html.includes('<head>')) {
      html = html.replace(/<head>/i, `<head>\n  <kite-config only="${selectedDirectives.join(',')}"></kite-config>`);
    } else {
      html = `<kite-config only="${selectedDirectives.join(',')}"></kite-config>\n` + html;
    }
  }

  if (finalMinify) html = minifyHtml(html);

  const outIndex = path.join(finalOutPath, 'index.html');
  fs.writeFileSync(outIndex, html, 'utf8');
  summary.push({ file: outIndex, size: fs.statSync(outIndex).size });

  // 4. Copy styles/
  copyDir(path.join(projectRoot, 'styles'), path.join(finalOutPath, 'styles'), ignorePatterns, summary);

  // 5. Copy public/ assets (skip index.html, already processed)
  const publicDir = path.join(projectRoot, 'public');
  if (fs.existsSync(publicDir)) {
    for (const entry of fs.readdirSync(publicDir, { withFileTypes: true })) {
      if (entry.name === 'index.html') continue;
      const srcPath = path.join(publicDir, entry.name);
      const destPath = path.join(finalOutPath, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath, ignorePatterns, summary);
      } else {
        fs.copyFileSync(srcPath, destPath);
        summary.push({ file: destPath, size: fs.statSync(destPath).size });
      }
    }
  }

  // 6. Ensure runtime assets (kite.css, kite.js) exist in dist if referenced
  const outCss = path.join(finalOutPath, 'kite.css');
  if (!fs.existsSync(outCss) && html.includes('kite.css')) {
    const cssCandidates = [
      path.join(projectRoot, 'node_modules', '@kitelet', 'core', 'src', 'styles', 'kite.css'),
      path.resolve(__dirname, '..', '..', 'src', 'styles', 'kite.css')
    ];
    const foundCss = cssCandidates.find(c => fs.existsSync(c));
    if (foundCss) {
      fs.copyFileSync(foundCss, outCss);
      summary.push({ file: outCss, size: fs.statSync(outCss).size });
    }
  }

  const outJs = path.join(finalOutPath, 'kite.js');
  if (!fs.existsSync(outJs) && html.includes('kite.js')) {
    const jsCandidates = [
      path.join(projectRoot, 'node_modules', '@kitelet', 'core', 'dist', 'kite.min.js'),
      path.join(projectRoot, 'node_modules', '@kitelet', 'core', 'src', 'kite.js'),
      path.resolve(__dirname, '..', '..', 'dist', 'kite.min.js'),
      path.resolve(__dirname, '..', '..', 'src', 'kite.js')
    ];
    const foundJs = jsCandidates.find(c => fs.existsSync(c));
    if (foundJs) {
      fs.copyFileSync(foundJs, outJs);
      summary.push({ file: outJs, size: fs.statSync(outJs).size });
    }
  }

  // 7. Custom preset bundle if requested
  if (selectedDirectives) {
    const outCustomJs = path.join(finalOutPath, 'kite.custom.js');
    const customBundleCode = `/**
 * Kite Custom Bundle (${preset || 'custom'})
 * Directives included: ${selectedDirectives.join(', ')}
 */
import Kite from './kite.js';
Kite.config({ only: ${JSON.stringify(selectedDirectives)} });
export default Kite;
`;
    fs.writeFileSync(outCustomJs, customBundleCode, 'utf8');
    summary.push({ file: outCustomJs, size: fs.statSync(outCustomJs).size });
  }

  printSummary(finalOutPath, summary);
  return { outPath: finalOutPath, files: summary };
}
