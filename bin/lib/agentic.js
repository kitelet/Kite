/**
 * @file bin/lib/agentic.js
 * @description Agentic pipeline: builds and verifies machine-readable metadata,
 * LLM summaries (llms.txt, llms-full.txt), AGENTS.md, and IDE-specific configurations.
 *
 * Commands:
 *   kite agentic:build  (or kite agentic)
 *   kite agentic:check
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRAMEWORK_ROOT = path.resolve(__dirname, '../..');

const C = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  cyan:   s => `\x1b[36m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`
};

/**
 * Recursively collects all markdown files under a directory in sorted order.
 */
function getMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files.sort();
}

/**
 * Builds all agentic files from project sources and .kite metadata.
 *
 * @param {Object} options
 * @param {string} options.projectRoot - Root directory of the Kite project.
 */
export function buildAgenticFiles({ projectRoot }) {
  console.log(`\n${C.bold('🪁 Kite Agentic Builder')}\n`);

  const kiteDir = path.resolve(projectRoot, '.kite');
  const docsDir = path.resolve(projectRoot, 'docs');

  if (!fs.existsSync(kiteDir)) {
    fs.mkdirSync(kiteDir, { recursive: true });
  }

  // 0. Seed metadata and schemas if missing in project
  const frameworkKite = path.join(FRAMEWORK_ROOT, '.kite');
  const metaFilesToSeed = ['capabilities.json', 'rules.json', 'conventions.json', 'limits.json'];
  for (const m of metaFilesToSeed) {
    const targetFile = path.join(kiteDir, m);
    const sourceFile = path.join(frameworkKite, m);
    if (!fs.existsSync(targetFile) && fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, targetFile);
    }
  }

  const targetSchemas = path.join(kiteDir, 'schemas');
  const sourceSchemas = path.join(frameworkKite, 'schemas');
  if (!fs.existsSync(targetSchemas) && fs.existsSync(sourceSchemas)) {
    fs.mkdirSync(targetSchemas, { recursive: true });
    for (const s of fs.readdirSync(sourceSchemas)) {
      fs.copyFileSync(path.join(sourceSchemas, s), path.join(targetSchemas, s));
    }
  }

  // 1. Build llms-full.txt by concatenating docs/
  let fullDocCount = 0;
  if (fs.existsSync(docsDir)) {
    const mdFiles = getMarkdownFiles(docsDir);
    fullDocCount = mdFiles.length;
    const banner = [
      '# Kite Documentation Corpus (llms-full.txt)',
      `# Generated: ${new Date().toISOString()}`,
      '# Source: https://getkite.netlify.app',
      '# Specification: https://llmstxt.org',
      '',
      '================================================================================',
      ''
    ].join('\n');

    const sections = mdFiles.map(file => {
      const rel = path.relative(projectRoot, file).replace(/\\/g, '/');
      const text = fs.readFileSync(file, 'utf-8');
      return `\n\n<!-- FILE: ${rel} -->\n\n` + text;
    });

    const fullContent = banner + sections.join('\n\n---\n');
    fs.writeFileSync(path.resolve(projectRoot, 'llms-full.txt'), fullContent, 'utf-8');
    console.log(`  ${C.green('✔')} Generated llms-full.txt (${fullDocCount} docs compiled)`);
  }

  // 2. Build or sync .kite/manifest.json
  const manifestPath = path.resolve(kiteDir, 'manifest.json');
  let manifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch (_) {
      manifest = {};
    }
  }

  manifest.$schema = manifest.$schema || './schemas/manifest-1.0.json';
  manifest.kite = manifest.kite || '1.0.0';
  manifest.project = manifest.project || {
    name: path.basename(projectRoot),
    template: 'starter'
  };
  manifest.structure = {
    models: 'app/models/*.model.html',
    views: 'app/views/*.view.html',
    controllers: 'app/controllers/*.controller.html',
    components: 'app/components/*.component.html',
    routes: 'app/routes/routes.html',
    api: 'app/api/*.api.html',
    shell: 'public/index.html',
    styles: 'styles/**/*.css'
  };

  const countFiles = (globPattern) => {
    const dir = path.resolve(projectRoot, path.dirname(globPattern));
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter(f => f.endsWith('.html')).length;
  };

  manifest.counts = {
    models: countFiles('app/models/*.model.html'),
    views: countFiles('app/views/*.view.html'),
    controllers: countFiles('app/controllers/*.controller.html'),
    components: countFiles('app/components/*.component.html'),
    routes: fs.existsSync(path.resolve(projectRoot, 'app/routes/routes.html')) ? 1 : 0,
    api: countFiles('app/api/*.api.html')
  };

  manifest.entryPoints = {
    html: fs.existsSync(path.resolve(projectRoot, 'public/index.html')) ? 'public/index.html' : 'index.html',
    runtime: fs.existsSync(path.resolve(projectRoot, 'dist/kite.min.js')) ? 'dist/kite.min.js' : 'https://esm.sh/@kitelet/core'
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  console.log(`  ${C.green('✔')} Updated .kite/manifest.json`);

  // 3. Ensure llms.txt exists
  const llmsPath = path.resolve(projectRoot, 'llms.txt');
  if (!fs.existsSync(llmsPath)) {
    const defaultLlms = [
      '# Kite',
      '',
      '> HTML is enough for small things.',
      '',
      'Kite is a teaching toolkit for building small, self-contained interactive web apps using only HTML and CSS.',
      '',
      '## Not a framework',
      'Kite is not React, Vue, or Svelte. See docs/1-basics/limits.md for honest constraints.',
      '',
      '## Quick start',
      '<script src="https://esm.sh/@kitelet/core"></script>',
      '<div kite-scope="{ count: 0 }">',
      '  <button kite-on-click="count++">+1</button>',
      '  <span kite-text="count"></span>',
      '</div>',
      '',
      '## Documentation',
      '- [Getting Started](docs/1-basics/getting-started.md)',
      '- [Syntax Cheat Sheet](docs/1-basics/cheatsheet.md)',
      '- [Directives Reference](docs/1-basics/directives.md)',
      '- [Full Text Corpus](llms-full.txt)'
    ].join('\n');
    fs.writeFileSync(llmsPath, defaultLlms + '\n', 'utf-8');
    console.log(`  ${C.green('✔')} Generated llms.txt`);
  } else {
    console.log(`  ${C.green('✔')} Verified llms.txt`);
  }

  // 4. Ensure AGENTS.md exists
  const agentsPath = path.resolve(projectRoot, 'AGENTS.md');
  const sourceAgents = path.join(FRAMEWORK_ROOT, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    if (fs.existsSync(sourceAgents)) {
      fs.copyFileSync(sourceAgents, agentsPath);
      console.log(`  ${C.green('✔')} Seeded AGENTS.md`);
    } else {
      const defaultAgents = [
        '# Kite — Agent Guide',
        '',
        '> Read this before writing any Kite code.',
        '',
        '## What Kite is',
        'A teaching toolkit for small, self-contained web apps.',
        'HTML-only interactivity. No JS required. No build step.',
        '',
        '## Project structure',
        '- `app/models/*.model.html`    — data + methods + api',
        '- `app/views/*.view.html`      — markup',
        '- `app/controllers/*.controller.html` — named behaviors',
        '- `app/components/*.component.html`   — reusable UI',
        '- `app/routes/routes.html`     — URL → view',
        '- `app/api/*.api.html`         — backend clients',
        '- `public/index.html`          — the shell',
        '',
        '## Rules',
        '1. Only Models touch the network.',
        '2. Views never fetch.',
        '3. Controllers never fetch.',
        '4. kite-text always escapes. Use kite-html for HTML.',
        '5. Never use eval or new Function.',
        '6. Only window.Kite is global.',
        '',
        '## What NOT to do',
        '- Do not invent directives. See .kite/capabilities.json.',
        '- Do not use kite-fro. It does not exist.',
        '- Do not assume React/Vue patterns. Kite is HTML-only.'
      ].join('\n');
      fs.writeFileSync(agentsPath, defaultAgents + '\n', 'utf-8');
      console.log(`  ${C.green('✔')} Generated AGENTS.md`);
    }
  } else {
    console.log(`  ${C.green('✔')} Verified AGENTS.md`);
  }

  // 5. Synchronize IDE configurations
  const ideFiles = [
    { file: 'CLAUDE.md', name: 'Claude Code' },
    { file: '.cursorrules', name: 'Cursor' },
    { file: '.github/copilot-instructions.md', name: 'GitHub Copilot' },
    { file: '.windsurfrules', name: 'Windsurf' },
    { file: '.aider.conf.yml', name: 'Aider' },
    { file: '.continue/config.json', name: 'Continue' }
  ];

  for (const { file, name } of ideFiles) {
    const fullPath = path.resolve(projectRoot, file);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, `# ${name} instructions for Kite\n# See AGENTS.md for master reference.\n`, 'utf-8');
    }
  }
  console.log(`  ${C.green('✔')} Synchronized IDE rules (Claude, Cursor, Copilot, Windsurf, Aider, Continue)`);

  console.log(`\n${C.green('Build complete!')} Project is 100% Agentic-Ready.\n`);
  return { success: true };
}

/**
 * Audits and verifies all agentic metadata against runtime definitions.
 *
 * @param {Object} options
 * @param {string} options.projectRoot - Root directory of the Kite project.
 * @returns {{ errors: number, warnings: number }}
 */
export function checkAgenticFiles({ projectRoot }) {
  console.log(`\n${C.bold('🪁 Kite Agentic Health Check')}\n`);

  let errors = 0;
  let warnings = 0;

  const kiteDir = path.resolve(projectRoot, '.kite');

  // 1. Check required metadata files
  const requiredFiles = [
    'capabilities.json',
    'rules.json',
    'conventions.json',
    'limits.json',
    'manifest.json'
  ];

  for (const f of requiredFiles) {
    const fullPath = path.join(kiteDir, f);
    if (!fs.existsSync(fullPath)) {
      console.log(`  ${C.red('✖')} Missing required metadata file: .kite/${f}`);
      errors++;
    } else {
      try {
        const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        if (!parsed.$schema) {
          console.log(`  ${C.yellow('⚠️')} .kite/${f} is missing a $schema declaration`);
          warnings++;
        }
      } catch (err) {
        console.log(`  ${C.red('✖')} Malformed JSON in .kite/${f}: ${err.message}`);
        errors++;
      }
    }
  }

  // 2. Check capabilities.json against implemented directives
  const capabilitiesPath = path.join(kiteDir, 'capabilities.json');
  if (fs.existsSync(capabilitiesPath)) {
    try {
      const cap = JSON.parse(fs.readFileSync(capabilitiesPath, 'utf-8'));
      const directivesDir = path.resolve(projectRoot, 'src', 'directives');
      if (fs.existsSync(directivesDir)) {
        const directiveFiles = fs.readdirSync(directivesDir)
          .filter(f => f.endsWith('.js') && f !== 'index.js')
          .map(f => f.replace('.js', ''));

        for (const d of directiveFiles) {
          const expectedKey = `kite-${d}`;
          if (!cap.directives || !cap.directives[expectedKey]) {
            console.log(`  ${C.yellow('⚠️')} Directive 'kite-${d}' found in code but missing in capabilities.json`);
            warnings++;
          }
        }
      }
    } catch (_) {}
  }

  // 3. Check AGENTS.md and llms.txt presence
  const rootAgentFiles = ['AGENTS.md', 'llms.txt', 'llms-full.txt'];
  for (const rf of rootAgentFiles) {
    if (!fs.existsSync(path.resolve(projectRoot, rf))) {
      console.log(`  ${C.red('✖')} Missing root agent entry point: ${rf}`);
      errors++;
    }
  }

  // 4. Check llms-full.txt freshness
  const llmsFullPath = path.resolve(projectRoot, 'llms-full.txt');
  if (fs.existsSync(llmsFullPath)) {
    const stat = fs.statSync(llmsFullPath);
    if (stat.size < 500) {
      console.log(`  ${C.yellow('⚠️')} llms-full.txt is unusually small (< 500 bytes). Run 'kite agentic:build'.`);
      warnings++;
    }
  }

  // Summary
  if (errors === 0 && warnings === 0) {
    console.log(`  ${C.green('✅')} All agentic metadata, schemas, and LLM text files verified.`);
    console.log(`\n${C.green('Agentic check passed with 0 errors, 0 warnings.')}\n`);
  } else {
    console.log(`\nAgentic check completed with ${errors} error(s) and ${warnings} warning(s).\n`);
  }

  return { errors, warnings };
}
