/**
 * @file bin/lib/create.js
 * @description Project scaffolding for `kite create <name> [--template <type>]`.
 *
 * Templates: blank | starter | full | component-kit
 *
 * What it does:
 *  1. Creates the target directory.
 *  2. Copies the chosen template files.
 *  3. Copies common dotfiles (.editorconfig, .gitignore, .kitrc, kite.config.json).
 *  4. Writes a customized package.json.
 *  5. Prints next steps.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Templates live two levels up: bin/lib/ -> bin/ -> project root -> templates/
const TEMPLATES_DIR = path.resolve(__dirname, '..', '..', 'templates');
const COMMON_DIR = path.join(TEMPLATES_DIR, 'common');
const VALID_TEMPLATES = ['blank', 'starter', 'full', 'component-kit', 'dashboard'];

// ─── Colors ────────────────────────────────────────────────────────────────
const C = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  cyan:   s => `\x1b[36m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
};

// ─── Directory Copier ──────────────────────────────────────────────────────
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ─── package.json Generator ────────────────────────────────────────────────
function generatePackageJson(projectName, template) {
  return JSON.stringify({
    name: projectName,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev:     'kite dev',
      build:   'kite build',
      preview: 'kite preview',
      clean:   'kite clean',
      doctor:  'kite doctor',
    },
    dependencies: {
      '@kitelet/core': '^1.0.0',
    },
    devDependencies: {},
  }, null, 2) + '\n';
}

// ─── Public API ────────────────────────────────────────────────────────────
/**
 * Scaffold a new Kite project.
 * @param {object} opts
 * @param {string} opts.projectName  - Name of the project (folder name)
 * @param {string} [opts.template='starter'] - Template to use
 * @param {string} [opts.targetDir]  - Where to create the project (defaults to cwd/<projectName>)
 */
export async function create({ projectName, template = 'starter', targetDir }) {
  if (!VALID_TEMPLATES.includes(template)) {
    console.error(`Unknown template: "${template}". Valid options: ${VALID_TEMPLATES.join(', ')}`);
    process.exit(1);
  }

  const destDir = targetDir || path.resolve(process.cwd(), projectName);

  if (fs.existsSync(destDir) && fs.readdirSync(destDir).length > 0) {
    console.error(`Directory "${destDir}" already exists and is not empty.`);
    process.exit(1);
  }

  console.log(`\n🪁 Creating "${C.bold(projectName)}" with template: ${C.cyan(template)}\n`);

  // 1. Create target directory
  fs.mkdirSync(destDir, { recursive: true });

  // 2. Copy template files
  const templateDir = path.join(TEMPLATES_DIR, template);
  copyDir(templateDir, destDir);
  console.log(`  ${C.green('✔')} Copied ${template} template`);

  // 3. Copy common dotfiles (don't overwrite template-specific versions)
  if (fs.existsSync(COMMON_DIR)) {
    for (const entry of fs.readdirSync(COMMON_DIR, { withFileTypes: true })) {
      const src = path.join(COMMON_DIR, entry.name);
      const dest = path.join(destDir, entry.name);
      if (!fs.existsSync(dest)) {
        if (entry.isDirectory()) {
          copyDir(src, dest);
        } else {
          fs.copyFileSync(src, dest);
        }
      }
    }
    console.log(`  ${C.green('✔')} Added project dotfiles`);
  }

  // 4. Write package.json
  const pkgPath = path.join(destDir, 'package.json');
  fs.writeFileSync(pkgPath, generatePackageJson(projectName, template), 'utf8');
  console.log(`  ${C.green('✔')} Created package.json`);

  // 5. Initialize agentic layer (.kite, AGENTS.md, etc.)
  try {
    const { buildAgenticFiles } = await import('./agentic.js');
    buildAgenticFiles({ projectRoot: destDir });
  } catch (_) {}

  // 5. Print next steps
  const rel = path.relative(process.cwd(), destDir);
  console.log(`\n${C.bold('Next steps:')}\n`);
  if (rel !== '.') console.log(`  cd ${rel}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
  console.log(`\n  Then open ${C.cyan('http://localhost:3000')} in your browser.\n`);
}
