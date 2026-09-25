/**
 * @file bin/lib/manage.js
 * @description Project inspection and asset management for Kite projects.
 *
 * Provides:
 *   kite list                    — Show all components, views, models, routes, plugins
 *   kite find <name>             — Locate a file by name (fuzzy)
 *   kite remove <name>           — Delete a piece and remove its includes/routes
 *   kite rename <old> <new>      — Rename a piece and update references
 *   kite info                    — Show versions, paths, environment
 *   kite config                  — Read or update kite.config.json / .kitrc
 *   kite upgrade                 — Check/display upgrade guidelines
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const C = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  cyan:   s => `\x1b[36m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
};

function getFilesRecursively(dir, baseDir = dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFilesRecursively(fullPath, baseDir));
    } else if (entry.isFile()) {
      files.push({
        name: entry.name,
        relPath: path.relative(baseDir, fullPath).replace(/\\/g, '/'),
        fullPath
      });
    }
  }
  return files;
}

/**
 * Lists all components, views, models, controllers, routes, and plugins in the project.
 */
export function listProjectPieces({ projectRoot }) {
  console.log(`\n${C.bold('🪁 Project Assets Overview')}\n`);

  const categories = [
    { label: 'Components',   dir: 'app/components' },
    { label: 'Views',        dir: 'app/views' },
    { label: 'Models',       dir: 'app/models' },
    { label: 'Controllers',  dir: 'app/controllers' },
    { label: 'Layouts',      dir: 'app/layouts' },
    { label: 'API Clients',  dir: 'app/api' },
    { label: 'Plugins',      dir: 'plugins' },
  ];

  let totalCount = 0;

  for (const cat of categories) {
    const targetDir = path.join(projectRoot, cat.dir);
    const files = getFilesRecursively(targetDir, targetDir);
    totalCount += files.length;

    console.log(`  ${C.cyan(cat.label)} ${C.dim(`(${files.length})`)}`);
    if (files.length === 0) {
      console.log(`    ${C.dim('none')}`);
    } else {
      for (const f of files) {
        console.log(`    • ${f.relPath}`);
      }
    }
    console.log('');
  }

  // Routes inspection
  const routesPath = path.join(projectRoot, 'app', 'routes', 'routes.html');
  if (fs.existsSync(routesPath)) {
    const content = fs.readFileSync(routesPath, 'utf8');
    const matches = Array.from(content.matchAll(/<kite-route\s+path="([^"]+)"(?:\s+view="([^"]+)")?/g));
    console.log(`  ${C.cyan('Routes')} ${C.dim(`(${matches.length})`)}`);
    if (matches.length === 0) {
      console.log(`    ${C.dim('none')}`);
    } else {
      for (const m of matches) {
        console.log(`    • ${C.bold(m[1])}  →  ${m[2] || 'default'}`);
      }
    }
    console.log('');
  }

  console.log(`  ${C.dim(`Total tracked assets: ${totalCount}`)}\n`);
}

/**
 * Searches for files matching a query string across the project.
 */
export function findPiece({ projectRoot, query }) {
  if (!query) {
    console.error('Usage: kite find <name>');
    process.exit(1);
  }

  const searchDirs = ['app', 'plugins', 'public'];
  const allFiles = [];

  for (const d of searchDirs) {
    const fullDir = path.join(projectRoot, d);
    allFiles.push(...getFilesRecursively(fullDir, projectRoot));
  }

  const q = query.toLowerCase();
  const matched = allFiles.filter(f => f.relPath.toLowerCase().includes(q));

  console.log(`\n${C.bold(`Search results for "${query}":`)}\n`);
  if (matched.length === 0) {
    console.log(`  ${C.yellow('No matching files found.')}\n`);
    return;
  }

  for (const f of matched) {
    console.log(`  • ${C.green(f.relPath)}`);
  }
  console.log(`\n  ${C.dim(`Found ${matched.length} match(es).`)}\n`);
}

/**
 * Removes a piece and strips any references in public/index.html and routes.html.
 */
export function removePiece({ projectRoot, target }) {
  if (!target) {
    console.error('Usage: kite remove <name>');
    process.exit(1);
  }

  const searchDirs = ['app/components', 'app/views', 'app/models', 'app/controllers', 'app/layouts', 'app/api', 'plugins', 'plugins/directives', 'plugins/helpers', 'plugins/rules', 'plugins/adapters'];
  let matchedPath = null;

  for (const d of searchDirs) {
    const fullDir = path.join(projectRoot, d);
    if (!fs.existsSync(fullDir)) continue;
    const entries = fs.readdirSync(fullDir);
    for (const entry of entries) {
      const baseName = entry.split('.')[0];
      if (entry === target || baseName === target || entry.startsWith(target)) {
        matchedPath = path.join(fullDir, entry);
        break;
      }
    }
    if (matchedPath) break;
  }

  if (!matchedPath || !fs.existsSync(matchedPath)) {
    console.error(`  ${C.red('Error:')} Asset '${target}' not found in project.`);
    process.exit(1);
  }

  const relTarget = path.relative(projectRoot, matchedPath).replace(/\\/g, '/');
  fs.unlinkSync(matchedPath);
  console.log(`  ${C.green('✔')} Removed file: ${C.bold(relTarget)}`);

  // Strip reference in public/index.html
  const indexPath = path.join(projectRoot, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    let indexHtml = fs.readFileSync(indexPath, 'utf8');
    const includeRegex = new RegExp(`\\s*<kite-include[^>]*src="[^"]*${target}[^"]*"[^>]*><\\/kite-include>`, 'g');
    const scriptRegex = new RegExp(`\\s*<script[^>]*src="[^"]*${target}[^"]*"[^>]*><\\/script>`, 'g');
    if (includeRegex.test(indexHtml) || scriptRegex.test(indexHtml)) {
      indexHtml = indexHtml.replace(includeRegex, '').replace(scriptRegex, '');
      fs.writeFileSync(indexPath, indexHtml, 'utf8');
      console.log(`  ${C.green('✔')} Cleaned reference from public/index.html`);
    }
  }

  // Strip route in app/routes/routes.html if route
  const routesPath = path.join(projectRoot, 'app', 'routes', 'routes.html');
  if (fs.existsSync(routesPath)) {
    let routesHtml = fs.readFileSync(routesPath, 'utf8');
    const routeRegex = new RegExp(`\\s*<kite-route[^>]*path="[^"]*${target}[^"]*"[^>]*><\\/kite-route>`, 'g');
    if (routeRegex.test(routesHtml)) {
      routesHtml = routesHtml.replace(routeRegex, '');
      fs.writeFileSync(routesPath, routesHtml, 'utf8');
      console.log(`  ${C.green('✔')} Cleaned route from app/routes/routes.html`);
    }
  }

  console.log('');
}

/**
 * Renames a piece and updates all references in public/index.html and routes.html.
 */
export function renamePiece({ projectRoot, oldName, newName }) {
  if (!oldName || !newName) {
    console.error('Usage: kite rename <oldName> <newName>');
    process.exit(1);
  }

  const searchDirs = ['app/components', 'app/views', 'app/models', 'app/controllers', 'app/layouts', 'app/api', 'plugins', 'plugins/directives', 'plugins/helpers', 'plugins/rules', 'plugins/adapters'];
  let matchedPath = null;
  let dir = null;
  let oldFile = null;

  for (const d of searchDirs) {
    const fullDir = path.join(projectRoot, d);
    if (!fs.existsSync(fullDir)) continue;
    const entries = fs.readdirSync(fullDir);
    for (const entry of entries) {
      const baseName = entry.split('.')[0];
      if (entry === oldName || baseName === oldName || entry.startsWith(oldName)) {
        matchedPath = path.join(fullDir, entry);
        dir = fullDir;
        oldFile = entry;
        break;
      }
    }
    if (matchedPath) break;
  }

  if (!matchedPath || !fs.existsSync(matchedPath)) {
    console.error(`  ${C.red('Error:')} Asset '${oldName}' not found in project.`);
    process.exit(1);
  }

  const ext = oldFile.slice(oldFile.indexOf('.'));
  const newFileName = newName.includes('.') ? newName : `${newName}${ext}`;
  const newFilePath = path.join(dir, newFileName);

  fs.renameSync(matchedPath, newFilePath);
  console.log(`  ${C.green('✔')} Renamed: ${C.bold(oldFile)} → ${C.bold(newFileName)}`);

  // Update public/index.html
  const indexPath = path.join(projectRoot, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    let indexHtml = fs.readFileSync(indexPath, 'utf8');
    if (indexHtml.includes(oldFile)) {
      indexHtml = indexHtml.replaceAll(oldFile, newFileName);
      fs.writeFileSync(indexPath, indexHtml, 'utf8');
      console.log(`  ${C.green('✔')} Updated reference in public/index.html`);
    }
  }

  // Update app/routes/routes.html
  const routesPath = path.join(projectRoot, 'app', 'routes', 'routes.html');
  if (fs.existsSync(routesPath)) {
    let routesHtml = fs.readFileSync(routesPath, 'utf8');
    if (routesHtml.includes(oldName)) {
      routesHtml = routesHtml.replaceAll(oldName, newName);
      fs.writeFileSync(routesPath, routesHtml, 'utf8');
      console.log(`  ${C.green('✔')} Updated route in app/routes/routes.html`);
    }
  }

  console.log('');
}

/**
 * Displays comprehensive environment, versions, paths, and package info.
 */
export function showInfo({ projectRoot, rootDir }) {
  let pkgVersion = 'unknown';
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    pkgVersion = pkg.version;
  } catch (_) {}

  let nodeVer = process.version;
  let npmVer = 'unknown';
  try {
    npmVer = execSync('npm --version', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (_) {}

  console.log(`\n${C.bold('🪁 Kite System Information')}\n`);
  console.log(`  Kite Core Version:   ${C.cyan(`v${pkgVersion}`)}`);
  console.log(`  Node.js Version:     ${C.green(nodeVer)}`);
  console.log(`  npm Version:         ${C.green(npmVer)}`);
  console.log(`  Project Root:        ${projectRoot}`);
  console.log(`  Kite Package Root:   ${rootDir}`);

  const hasConfig = fs.existsSync(path.join(projectRoot, 'kite.config.json')) || fs.existsSync(path.join(projectRoot, '.kitrc'));
  console.log(`  Project Config:      ${hasConfig ? C.green('Present') : C.dim('Default (none)')}`);
  console.log(`  CDN Target:          https://esm.sh/@kitelet/core@${pkgVersion}\n`);
}

/**
 * Displays or updates configuration in kite.config.json or .kitrc.
 */
export function handleConfig({ projectRoot, key, value }) {
  const configPath = path.join(projectRoot, 'kite.config.json');
  let currentConfig = {};

  if (fs.existsSync(configPath)) {
    try {
      currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (_) {}
  }

  if (!key) {
    console.log(`\n${C.bold('Current Project Configuration:')}\n`);
    console.log(JSON.stringify(currentConfig, null, 2));
    console.log('');
    return;
  }

  if (value === undefined) {
    const val = currentConfig[key];
    console.log(`  ${C.bold(key)}: ${val !== undefined ? JSON.stringify(val) : C.dim('(unset)')}`);
  } else {
    try {
      currentConfig[key] = JSON.parse(value);
    } catch (_) {
      currentConfig[key] = value;
    }
    fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf8');
    console.log(`  ${C.green('✔')} Set ${C.bold(key)} = ${JSON.stringify(currentConfig[key])} in kite.config.json`);
  }
}

/**
 * Checks and outputs upgrade directions.
 */
export function upgradeProject() {
  console.log(`\n${C.bold('🪁 Checking for Kite updates...')}\n`);
  console.log(`  Run the following command to update to the latest release:`);
  console.log(`\n  ${C.cyan('npm install @kitelet/core@latest')}\n`);
  console.log(`  Or when using global CLI:`);
  console.log(`\n  ${C.cyan('npm install -g @kitelet/core')}\n`);
}
