#!/usr/bin/env node
/**
 * @file bin/kite.js
 * @description Kite CLI — Developer tools, MVCR generators, and project scaffolding.
 *
 * Commands:
 *   kite new <name> [--template <type>]     Scaffold a new project
 *   kite make:<type> <name> [flags]         Scaffold a piece into project (g:c, g:v, etc.)
 *   kite dev [--port] [--host] [--open]     Start dev server with live reload
 *   kite build [--out] [--no-minify]        Build single-file production bundle
 *   kite preview [--port]                   Serve dist/ locally
 *   kite clean                              Remove dist/ and caches
 *   kite list                               List all components, views, models, routes
 *   kite find <name>                        Locate a piece by fuzzy match
 *   kite remove <name>                      Delete a piece and clean up references
 *   kite rename <old> <new>                 Rename a piece and update references
 *   kite doctor                             Diagnose project health
 *   kite info                               Show versions, paths, environment
 *   kite config [key] [value]               Inspect or modify configuration
 *   kite upgrade                            Check update guidelines
 *   kite eject <target>                     Eject a built-in engine module
 *   kite --version                          Print CLI version
 *   kite --help                             Show help
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const rootDir    = path.resolve(__dirname, '..');

const args    = process.argv.slice(2);
const rawCommand = args[0] || '';

// ─── Colors ────────────────────────────────────────────────────────────────
const C = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  cyan:   s => `\x1b[36m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
};

// ─── Arg Parser ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { flags[key] = next; i++; }
      else flags[key] = true;
    } else if (a.startsWith('-') && a.length === 2) {
      flags[a.slice(1)] = true;
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

// ─── Help ──────────────────────────────────────────────────────────────────
function printHelp() {
  console.log(`
${C.bold('🪁 Kite CLI')}  ${C.dim('HTML is enough for small things.')}

${C.bold('Usage:')}
  kite <command> [options]

${C.bold('Project Commands:')}
  ${C.cyan('new')} <name> [--template <t>]         Scaffold a new project (alias: create)
  ${C.cyan('dev')} [--port 3000] [--open]         Start zero-dependency live-reload dev server
  ${C.cyan('build')} [--out dist] [--preset p]    Inline includes & compile bundle (--only, --preset)
  ${C.cyan('preview')} [--port 4000]              Serve production dist/ bundle locally
  ${C.cyan('clean')}                              Remove dist/ and .kite/ caches
  ${C.cyan('doctor')}                             Diagnose project health & scale boundaries
  ${C.cyan('format')} [path] [--sort-attrs]       Format HTML templates & reorder attributes to 9-slot convention
  ${C.cyan('info')}                               Display versions, paths, and environment
  ${C.cyan('upgrade')}                            Display upgrade instructions

${C.bold('Scaffolding Commands (make:* or add):')}
  ${C.cyan('make:component')} <name>  (or ${C.bold('g:c')})   Create app/components/<name>.component.html
  ${C.cyan('make:view')}      <name>  (or ${C.bold('g:v')})   Create app/views/<name>.view.html
  ${C.cyan('make:model')}     <name>  (or ${C.bold('g:m')})   Create app/models/<name>.model.html
  ${C.cyan('make:controller')} <name> (or ${C.bold('g:ct')})  Create app/controllers/<name>.controller.html
  ${C.cyan('make:route')}     <path>  (or ${C.bold('g:r')})   Append route to app/routes/routes.html
  ${C.cyan('make:action')}    <name>                  Append action to controller
  ${C.cyan('make:plugin')}    <name>  (or ${C.bold('g:p')})   Create plugins/<name>.js
  ${C.cyan('make:directive')} <name>                  Create plugins/directives/<name>.js
  ${C.cyan('make:helper')}    <name>                  Create plugins/helpers/<name>.js
  ${C.cyan('make:rule')}      <name>                  Create plugins/rules/<name>.js
  ${C.cyan('make:adapter')}   <name>                  Create plugins/adapters/<name>.js
  ${C.cyan('make:api')}       <name>                  Create app/api/<name>.api.html
  ${C.cyan('make:layout')}    <name>                  Create app/layouts/<name>.layout.html
  ${C.cyan('make')}                                   Interactive scaffold prompt

${C.bold('Management Commands:')}
  ${C.cyan('list')}                               Show all components, views, models, routes
  ${C.cyan('find')} <name>                        Fuzzy locate a file across project
  ${C.cyan('remove')} <name>  (alias: ${C.bold('rm')})        Delete a piece and clean up references
  ${C.cyan('rename')} <old> <new>                 Rename a piece and update references
  ${C.cyan('config')} [key] [value]               Inspect or modify project configuration
  ${C.cyan('eject')} <target>                     Eject a built-in module into ./kite-extensions/
  ${C.cyan('agentic:build')}                      Build AGENTS.md, llms.txt, llms-full.txt, and metadata
  ${C.cyan('agentic:check')}                      Verify agentic metadata, schemas, and prevent drift

${C.bold('Scaffold Flags:')}
  --force       Overwrite if target file already exists
  --no-include  Skip automatic <kite-include> / <script> injection in index.html
  --path <dir>  Custom target output directory
  --no-comment  Omit header comment block in generated file

${C.bold('Templates (for new / create):')}
  blank          Minimal setup — just HTML and Kite
  starter        Recommended — counter, routes, nav
  full           Everything — todos, user, MVCR, API client
  component-kit  Design system starter with 5 components
  dashboard      Analytics dashboard with metrics, charts & MVCR

${C.bold('Examples:')}
  kite new my-app --template starter
  kite make:component user-card
  kite g:m todos
  kite g:r /profile
  kite list
  kite doctor
`);
}

// ─── Version & Help Checks ─────────────────────────────────────────────────
if (!rawCommand || rawCommand === '--help' || rawCommand === '-h') {
  printHelp();
  process.exit(0);
}

if (rawCommand === '--version' || rawCommand === '-v') {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  console.log(`@kitelet/core v${pkg.version}`);
  process.exit(0);
}

// ─── Resolve Project Context ───────────────────────────────────────────────
const projectRoot = process.cwd();
const { flags, positional } = parseArgs(args.slice(1));

// ─── Command Aliasing & Mapping ────────────────────────────────────────────
// Normalize shortcut commands: g:c -> make:component, g:v -> make:view, etc.
const SHORTCUT_MAP = {
  'g:c':  'component',
  'g:v':  'view',
  'g:m':  'model',
  'g:ct': 'controller',
  'g:r':  'route',
  'g:p':  'plugin',
};

let command = rawCommand.toLowerCase();
let makeType = null;

if (command.startsWith('make:')) {
  makeType = command.slice(5);
  command = 'make';
} else if (SHORTCUT_MAP[command]) {
  makeType = SHORTCUT_MAP[command];
  command = 'make';
}

// ─── Interactive Prompt Helper ─────────────────────────────────────────────
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

// ─── 1. new / create ───────────────────────────────────────────────────────
if (command === 'new' || command === 'create') {
  let projectName = positional[0];
  if (!projectName) {
    projectName = await askQuestion(`${C.bold('? Project name:')} `);
    if (!projectName) {
      console.error('Error: Missing project name. Usage: kite new <name>');
      process.exit(1);
    }
  }

  const template = flags['template'] || flags['t'] || 'starter';
  const { create } = await import('./lib/create.js');
  await create({ projectName, template });
  process.exit(0);
}

// ─── 2. make / add / shortcuts ─────────────────────────────────────────────
else if (command === 'make' || command === 'add') {
  let type = makeType || positional[0];
  let name = makeType ? positional[0] : positional[1];

  // Interactive mode if no type or name provided
  if (!type) {
    console.log(`\n${C.bold('? What do you want to create?')}`);
    console.log(`  1) Component     (app/components/*.component.html)`);
    console.log(`  2) View          (app/views/*.view.html)`);
    console.log(`  3) Model         (app/models/*.model.html)`);
    console.log(`  4) Controller    (app/controllers/*.controller.html)`);
    console.log(`  5) Route         (app/routes/routes.html)`);
    console.log(`  6) Action        (action inside controller)`);
    console.log(`  7) Plugin        (plugins/*.js)`);
    console.log(`  8) Directive     (plugins/directives/*.js)`);
    console.log(`  9) Helper        (plugins/helpers/*.js)`);
    console.log(` 10) Rule          (plugins/rules/*.js)`);
    console.log(` 11) Adapter       (plugins/adapters/*.js)`);
    console.log(` 12) API client    (app/api/*.api.html)`);
    console.log(` 13) Layout        (app/layouts/*.layout.html)\n`);

    const choice = await askQuestion(`${C.bold('Select number or type name:')} `);
    const numMap = {
      '1': 'component', '2': 'view', '3': 'model', '4': 'controller',
      '5': 'route', '6': 'action', '7': 'plugin', '8': 'directive',
      '9': 'helper', '10': 'rule', '11': 'adapter', '12': 'api', '13': 'layout'
    };
    type = numMap[choice] || choice;
  }

  if (!name) {
    name = await askQuestion(`${C.bold(`? Name for ${type}:`)} `);
    if (!name) {
      console.error(`Error: Missing name for ${type}.`);
      process.exit(1);
    }
  }

  const { add } = await import('./lib/add.js');
  add({ projectRoot, type, name, flags });
  process.exit(0);
}

// ─── 3. dev ────────────────────────────────────────────────────────────────
else if (command === 'dev') {
  const port   = parseInt(flags['port'] || '3000', 10);
  const host   = flags['host'] || 'localhost';
  const reload = flags['no-reload'] !== true;
  const open   = flags['open'] === true;
  const { startServer } = await import('./lib/server.js');
  startServer({ projectRoot, port, host, reload, open });
}

// ─── 4. build ──────────────────────────────────────────────────────────────
else if (command === 'build') {
  const outDir  = flags['out'] || 'dist';
  const minify  = flags['no-minify'] !== true;
  const only    = flags['only'];
  const preset  = flags['preset'];
  console.log('Building for production...');
  const { build } = await import('./lib/build.js');
  try {
    await build({ projectRoot, outDir, minify, only, preset });
  } catch (e) {
    console.error(`Build failed: ${e.message}`);
    process.exit(1);
  }
  process.exit(0);
}

// ─── 5. preview ────────────────────────────────────────────────────────────
else if (command === 'preview') {
  const port = parseInt(flags['port'] || '4000', 10);
  const distRoot = path.join(projectRoot, flags['out'] || 'dist');
  if (!fs.existsSync(distRoot)) {
    console.error('Error: dist/ not found. Run `kite build` first.');
    process.exit(1);
  }
  const { startServer } = await import('./lib/server.js');
  startServer({ projectRoot: distRoot, port, host: 'localhost', reload: false, open: false });
}

// ─── 6. clean ──────────────────────────────────────────────────────────────
else if (command === 'clean') {
  const targets = ['dist', '.kite'];
  for (const t of targets) {
    const p = path.join(projectRoot, t);
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
      console.log(`  ${C.green('✔')} Removed ${t}/`);
    }
  }
  console.log('  Done.\n');
  process.exit(0);
}

// ─── 7. list ───────────────────────────────────────────────────────────────
else if (command === 'list' || command === 'ls') {
  const { listProjectPieces } = await import('./lib/manage.js');
  listProjectPieces({ projectRoot });
  process.exit(0);
}

// ─── 8. find ───────────────────────────────────────────────────────────────
else if (command === 'find') {
  const query = positional[0];
  const { findPiece } = await import('./lib/manage.js');
  findPiece({ projectRoot, query });
  process.exit(0);
}

// ─── 9. remove / rm ────────────────────────────────────────────────────────
else if (command === 'remove' || command === 'rm') {
  const target = positional[0];
  const { removePiece } = await import('./lib/manage.js');
  removePiece({ projectRoot, target });
  process.exit(0);
}

// ─── 10. rename ────────────────────────────────────────────────────────────
else if (command === 'rename' || command === 'mv') {
  const oldName = positional[0];
  const newName = positional[1];
  const { renamePiece } = await import('./lib/manage.js');
  renamePiece({ projectRoot, oldName, newName });
  process.exit(0);
}

// ─── 11. info ──────────────────────────────────────────────────────────────
else if (command === 'info') {
  const { showInfo } = await import('./lib/manage.js');
  showInfo({ projectRoot, rootDir });
  process.exit(0);
}

// ─── 12. config ────────────────────────────────────────────────────────────
else if (command === 'config') {
  const key = positional[0];
  const value = positional[1];
  const { handleConfig } = await import('./lib/manage.js');
  handleConfig({ projectRoot, key, value });
  process.exit(0);
}

// ─── 13. upgrade ───────────────────────────────────────────────────────────
else if (command === 'upgrade') {
  const { upgradeProject } = await import('./lib/manage.js');
  upgradeProject();
  process.exit(0);
}

// ─── 14. doctor ────────────────────────────────────────────────────────────
else if (command === 'doctor') {
  const { doctor } = await import('./lib/doctor.js');
  const { errors } = doctor({ projectRoot });
  process.exit(errors > 0 ? 1 : 0);
}

// ─── 15. format ────────────────────────────────────────────────────────────
else if (command === 'format') {
  const { formatFiles } = await import('./lib/format.js');
  const sortAttrs = flags['sort-attrs'] === true;
  const target = positional[0] ? path.resolve(projectRoot, positional[0]) : projectRoot;
  formatFiles({ target, sortAttrs });
  process.exit(0);
}

// ─── 15. eject ─────────────────────────────────────────────────────────────
else if (command === 'eject') {
  const target = positional[0];

  if (!target) {
    console.error('Error: Missing eject target.\nExample: kite eject directives.for');
    process.exit(1);
  }

  const cleanTarget = target.replace(/^kite-/, '');
  let relativeSrcPath;

  if (cleanTarget.includes('.')) {
    const parts = cleanTarget.split('.');
    relativeSrcPath = path.join('src', ...parts) + '.js';
  } else {
    const directivePath = path.join('src', 'directives', `${cleanTarget}.js`);
    if (fs.existsSync(path.join(rootDir, directivePath))) {
      relativeSrcPath = directivePath;
    } else {
      relativeSrcPath = path.join('src', `${cleanTarget}.js`);
    }
  }

  const srcFilePath = path.join(rootDir, relativeSrcPath);
  if (!fs.existsSync(srcFilePath)) {
    console.error(`Error: Module '${target}' not found at ${relativeSrcPath}.`);
    process.exit(1);
  }

  const outDir = path.resolve(projectRoot, 'kite-extensions');
  fs.mkdirSync(outDir, { recursive: true });
  const outFileName = path.basename(srcFilePath);
  const destPath    = path.join(outDir, outFileName);
  fs.copyFileSync(srcFilePath, destPath);

  console.log(`${C.green('✔')} Ejected successfully!`);
  console.log(`  Source: ${relativeSrcPath}`);
  console.log(`  Destination: ./kite-extensions/${outFileName}`);
  console.log(`\nTo use your ejected module:\n  import myModule from './kite-extensions/${outFileName}';\n  Kite.override('${target}', myModule);\n`);
  process.exit(0);
}

// ─── 16. agentic:build / agentic ───────────────────────────────────────────
else if (command === 'agentic:build' || command === 'agentic') {
  const { buildAgenticFiles } = await import('./lib/agentic.js');
  buildAgenticFiles({ projectRoot });
  process.exit(0);
}

// ─── 17. agentic:check ─────────────────────────────────────────────────────
else if (command === 'agentic:check') {
  const { checkAgenticFiles } = await import('./lib/agentic.js');
  const { errors } = checkAgenticFiles({ projectRoot });
  process.exit(errors > 0 ? 1 : 0);
}

// ─── Unknown Command ───────────────────────────────────────────────────────
else {
  console.error(`Unknown command: ${rawCommand}`);
  printHelp();
  process.exit(1);
}
