/**
 * @file bin/lib/doctor.js
 * @description Project health diagnostics for Kite projects.
 *
 * Checks:
 *  - Node.js and npm version requirements.
 *  - Kite installed and up to date.
 *  - public/index.html exists and is valid HTML.
 *  - <kite-outlet> present.
 *  - All <kite-include> targets exist on disk.
 *  - kite.config.json is valid JSON (if present).
 *  - No obvious issues detected.
 *
 * Prints colored status lines with fix suggestions.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ─── Terminal Colors ───────────────────────────────────────────────────────
const C = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
};

const PASS = C.green('✅');
const WARN = C.yellow('⚠️ ');
const FAIL = C.red('❌');

function pad(s, len = 28) { return s.padEnd(len); }
function row(label, icon, note = '') {
  console.log(`  ${icon}  ${pad(label)} ${note}`);
}

// ─── Version Helpers ───────────────────────────────────────────────────────
function getNodeVersion() {
  try { return execSync('node -v', { stdio: 'pipe' }).toString().trim(); } catch { return null; }
}
function getNpmVersion() {
  try { return execSync('npm -v', { stdio: 'pipe' }).toString().trim(); } catch { return null; }
}
function semverMajor(v) { return parseInt((v || '').replace(/^v/, '').split('.')[0] || '0', 10); }

// ─── HTML Helpers ──────────────────────────────────────────────────────────
function findIncludes(html) {
  const matches = [];
  const re = /<kite-include\s+src=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) matches.push(m[1]);
  return matches;
}

// ─── Doctor ────────────────────────────────────────────────────────────────
/**
 * Run project health diagnostics.
 * @param {object} options
 * @param {string} options.projectRoot
 * @returns {{ passed: number, warnings: number, errors: number }}
 */
export function doctor({ projectRoot }) {
  let passed = 0, warnings = 0, errors = 0;

  console.log(C.bold('\n🪁 Kite Doctor\n'));

  // --- Node version
  const nodeVer = getNodeVersion();
  if (nodeVer && semverMajor(nodeVer) >= 18) {
    row('Node version', PASS, C.dim(nodeVer)); passed++;
  } else if (nodeVer) {
    row('Node version', WARN, C.yellow(`${nodeVer} — v18 LTS recommended`)); warnings++;
  } else {
    row('Node version', FAIL, C.red('not found — install from nodejs.org')); errors++;
  }

  // --- npm version
  const npmVer = getNpmVersion();
  if (npmVer && semverMajor(npmVer) >= 9) {
    row('npm version', PASS, C.dim(npmVer)); passed++;
  } else if (npmVer) {
    row('npm version', WARN, C.yellow(`${npmVer} — v9+ recommended`)); warnings++;
  } else {
    row('npm version', FAIL, C.red('not found')); errors++;
  }

  // --- Kite package.json
  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const kiteDep = pkg?.dependencies?.['@kitelet/core'] || pkg?.devDependencies?.['@kitelet/core'];
      if (kiteDep) {
        row('Kite installed', PASS, C.dim(kiteDep)); passed++;
      } else {
        row('Kite installed', WARN, C.yellow('not in dependencies — add @kitelet/core')); warnings++;
      }
    } catch {
      row('package.json', FAIL, C.red('invalid JSON')); errors++;
    }
  } else {
    row('package.json', WARN, C.yellow('not found')); warnings++;
  }

  // --- index.html
  const indexPath = path.join(projectRoot, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    row('public/index.html', PASS, ''); passed++;
    const html = fs.readFileSync(indexPath, 'utf8');

    // --- <kite-outlet>
    if (html.includes('<kite-outlet')) {
      row('<kite-outlet> found', PASS, ''); passed++;
    } else {
      row('<kite-outlet> found', WARN, C.yellow('missing — add <kite-outlet></kite-outlet> to body')); warnings++;
    }

    // --- <kite-include> targets
    const includes = findIncludes(html);
    let allFound = true;
    for (const src of includes) {
      const candidates = [
        path.join(projectRoot, 'public', src.replace(/^\//, '')),
        path.join(projectRoot, src.replace(/^\//, '')),
      ];
      const found = candidates.some(c => fs.existsSync(c));
      if (!found) {
        row(`  include: ${src}`, FAIL, C.red('file not found')); errors++;
        allFound = false;
      }
    }
    if (allFound && includes.length > 0) {
      row(`<kite-include> (${includes.length})`, PASS, C.dim('all targets found')); passed++;
    } else if (includes.length === 0) {
      row('<kite-include>', C.dim('—'), C.dim('none')); 
    }
  } else {
    row('public/index.html', FAIL, C.red('not found — create public/index.html')); errors++;
  }

  // --- kite.config.json
  const configPath = path.join(projectRoot, 'kite.config.json');
  if (fs.existsSync(configPath)) {
    try {
      JSON.parse(fs.readFileSync(configPath, 'utf8'));
      row('kite.config.json', PASS, C.dim('valid JSON')); passed++;
    } catch {
      row('kite.config.json', FAIL, C.red('invalid JSON — fix syntax error')); errors++;
    }
  } else {
    row('kite.config.json', C.dim('—'), C.dim('not present (optional)')); 
  }

  // --- Scale check
  const scale = analyzeScale(projectRoot);
  const exceedsComfortable = scale.interactiveNodes >= 500 || scale.modelCount >= 20;

  if (exceedsComfortable) {
    row('Scale check', WARN, C.yellow(`~${scale.interactiveNodes} nodes, ${scale.modelCount} models`));
    warnings++;
    console.log(C.yellow('\n  ⚠️  Scale warning\n'));
    console.log(C.dim(`     Interactive nodes:  ~${scale.interactiveNodes}  (comfortable: < 500)`));
    console.log(C.dim(`     Models:             ${scale.modelCount}      (comfortable: < 20)`));
    console.log('');
    console.log(C.yellow(`     Your project is approaching Kite's comfortable limits.`));
    console.log(C.cyan(`     See: docs/1-basics/limits.md`));
    console.log(C.cyan(`     Ready to leave? See: docs/4-guides/graduating.md\n`));
  } else if (scale.interactiveNodes > 0 || scale.modelCount > 0) {
    row('Scale check', PASS, C.dim(`~${scale.interactiveNodes} nodes, ${scale.modelCount} models (healthy)`));
    passed++;
  } else {
    row('Scale check', PASS, C.dim('within comfortable limits'));
    passed++;
  }

  // --- Summary
  console.log('');
  if (errors === 0 && warnings === 0) {
    console.log(C.green('  Everything looks good. Run `npm run dev` to start.\n'));
  } else if (errors === 0) {
    console.log(C.yellow('  ' + warnings + ' warning(s). Run npm run dev or fix issues above.\n'));
  } else {
    console.log(C.red('  ' + errors + ' error(s), ' + warnings + ' warning(s). Fix issues above before continuing.\n'));
  }

  return { passed, warnings, errors, scale };
}

// ─── Scale Analysis Helpers ────────────────────────────────────────────────
function collectHtmlFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        collectHtmlFiles(fullPath, fileList);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        fileList.push(fullPath);
      }
    }
  } catch {}
  return fileList;
}

export function analyzeScale(projectRoot) {
  const htmlFiles = [
    ...collectHtmlFiles(path.join(projectRoot, 'public')),
    ...collectHtmlFiles(path.join(projectRoot, 'app')),
  ];
  let interactiveNodes = 0;
  let modelCount = 0;
  let routeCount = 0;

  for (const file of htmlFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const attrMatches = content.match(/<[a-zA-Z0-9_-]+(?:\s+[^>]*?kite-[^>]+|\s+kite-[^>]*?)>/gi) || [];
      interactiveNodes += attrMatches.length;

      const models = content.match(/<kite-model[\s>]/gi) || [];
      modelCount += models.length;

      const routes = content.match(/<kite-route[\s>]/gi) || [];
      routeCount += routes.length;
    } catch {}
  }

  const modelsDir = path.join(projectRoot, 'app', 'models');
  if (fs.existsSync(modelsDir)) {
    try {
      const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.html'));
      modelCount = Math.max(modelCount, files.length);
    } catch {}
  }

  return { interactiveNodes, modelCount, routeCount };
}
