/**
 * @file bin/lib/add.js
 * @description Comprehensive MVCR, component, extension, and plugin scaffold generator.
 *
 * Supports:
 *   kite make:component <name>  — Create app/components/<name>.component.html
 *   kite make:view <name>       — Create app/views/<name>.view.html
 *   kite make:model <name>      — Create app/models/<name>.model.html
 *   kite make:controller <name> — Create app/controllers/<name>.controller.html
 *   kite make:route <path>      — Append a <kite-route> to app/routes/routes.html
 *   kite make:action <name>     — Add a <kite-action> to a controller
 *   kite make:plugin <name>     — Create plugins/<name>.js
 *   kite make:directive <name>  — Create plugins/directives/<name>.js
 *   kite make:helper <name>     — Create plugins/helpers/<name>.js
 *   kite make:rule <name>       — Create plugins/rules/<name>.js
 *   kite make:adapter <name>    — Create plugins/adapters/<name>.js
 *   kite make:api <name>        — Create app/api/<name>.api.html
 *   kite make:layout <name>     — Create app/layouts/<name>.layout.html
 *
 * Supported flags:
 *   --force       Overwrite file if it exists
 *   --no-include  Skip adding <kite-include> or <script> to public/index.html
 *   --path <dir>  Custom output directory
 *   --no-comment  Skip header comments
 */

import fs from 'fs';
import path from 'path';

// ─── Colors ────────────────────────────────────────────────────────────────
const C = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
};

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function camelCase(s) { return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); }

// ─── index.html Updaters ───────────────────────────────────────────────────
/**
 * Insert a <kite-include> tag before </body> in public/index.html.
 */
function addInclude(indexPath, includeSrc) {
  if (!fs.existsSync(indexPath)) return false;
  const html = fs.readFileSync(indexPath, 'utf8');
  if (html.includes(`src="${includeSrc}"`)) return false;
  const updated = html.replace('</body>', `  <kite-include src="${includeSrc}"></kite-include>\n</body>`);
  fs.writeFileSync(indexPath, updated, 'utf8');
  return true;
}

/**
 * Insert a <script src="..."> tag before </head> or </body> in public/index.html.
 */
function addScript(indexPath, scriptSrc) {
  if (!fs.existsSync(indexPath)) return false;
  const html = fs.readFileSync(indexPath, 'utf8');
  if (html.includes(`src="${scriptSrc}"`)) return false;
  const scriptTag = `  <script type="module" src="${scriptSrc}"></script>\n`;
  let updated;
  if (html.includes('</head>')) {
    updated = html.replace('</head>', `${scriptTag}</head>`);
  } else if (html.includes('</body>')) {
    updated = html.replace('</body>', `${scriptTag}</body>`);
  } else {
    updated = html + '\n' + scriptTag;
  }
  fs.writeFileSync(indexPath, updated, 'utf8');
  return true;
}

// ─── Generator Definitions & Templates ──────────────────────────────────────
export const TYPE_MAP = {
  component: {
    dir: 'app/components',
    suffix: '.component.html',
    includeSrc: (name) => `/app/components/${name}.component.html`,
    isScript: false,
    next: (file) => `edit ${file}`,
    template: (name, noComment, flags = {}) => {
      const header = noComment ? '' : `<!-- app/components/${name}.component.html -->\n`;
      if (flags.styled || flags.s) {
        return `${header}<kite-component name="${name}" kite-shadow>
  <template>
    <style>
      :host {
        display: block;
        box-sizing: border-box;
      }
      .${name} {
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
      }
    </style>
    <div class="${name}">
      <slot></slot>
    </div>
  </template>
</kite-component>
`;
      }
      return `${header}<kite-component name="${name}">
  <template>
    <div class="${name}">
      <slot></slot>
    </div>
  </template>
</kite-component>
`;
    }
  },
  view: {
    dir: 'app/views',
    suffix: '.view.html',
    includeSrc: (name) => `/app/views/${name}.view.html`,
    isScript: false,
    next: (file, name) => `add a route in app/routes/routes.html for ${name}-view`,
    template: (name, noComment) => {
      const header = noComment ? '' : `<!-- app/views/${name}.view.html -->\n`;
      return `${header}<kite-view name="${name}-view">
  <h1>${capitalize(name)}</h1>
  <!-- Add your markup here -->
</kite-view>
`;
    }
  },
  model: {
    dir: 'app/models',
    suffix: '.model.html',
    includeSrc: (name) => `/app/models/${name}.model.html`,
    isScript: false,
    next: (file) => `edit ${file} to define model state and methods`,
    template: (name, noComment) => {
      const header = noComment ? '' : `<!-- app/models/${name}.model.html -->\n`;
      return `${header}<kite-model name="${name}">
  {
    items: [],

    add(item) {
      this.items.push(item);
    }
  }
</kite-model>
`;
    }
  },
  controller: {
    dir: 'app/controllers',
    suffix: '.controller.html',
    includeSrc: (name) => `/app/controllers/${name}.controller.html`,
    isScript: false,
    next: (file) => `edit ${file} to bind actions`,
    template: (name, noComment) => {
      const header = noComment ? '' : `<!-- app/controllers/${name}.controller.html -->\n`;
      return `${header}<kite-controller model="${name}">
  <kite-action name="add" run="add(item)"></kite-action>
</kite-controller>
`;
    }
  },
  layout: {
    dir: 'app/layouts',
    suffix: '.layout.html',
    includeSrc: (name) => `/app/layouts/${name}.layout.html`,
    isScript: false,
    next: (file) => `edit ${file} to structure page layout`,
    template: (name, noComment) => {
      const header = noComment ? '' : `<!-- app/layouts/${name}.layout.html -->\n`;
      return `${header}<kite-layout name="${name}">
  <header>
    <!-- Header navigation -->
  </header>
  <main>
    <kite-outlet></kite-outlet>
  </main>
  <footer>
    <!-- Footer content -->
  </footer>
</kite-layout>
`;
    }
  },
  api: {
    dir: 'app/api',
    suffix: '.api.html',
    includeSrc: (name) => `/app/api/${name}.api.html`,
    isScript: false,
    next: (file) => `configure endpoint and headers in ${file}`,
    template: (name, noComment) => {
      const header = noComment ? '' : `<!-- app/api/${name}.api.html -->\n`;
      return `${header}<kite-api name="${name}" base="/api/${name}">
</kite-api>
`;
    }
  },
  plugin: {
    dir: 'plugins',
    suffix: '.js',
    includeSrc: (name) => `/plugins/${name}.js`,
    isScript: true,
    next: (file) => `edit ${file}`,
    template: (name, noComment) => {
      const header = noComment ? '' : `/**\n * @file ${capitalize(name)} plugin for Kite.\n * @module plugins/${name}\n */\n\n`;
      return `${header}Kite.plugin('${name}', (kite) => {
  kite.hook('after:route', (route) => {
    // track(route)
  });
});
`;
    }
  },
  directive: {
    dir: 'plugins/directives',
    suffix: '.js',
    includeSrc: (name) => `/plugins/directives/${name}.js`,
    isScript: true,
    next: (file) => `edit ${file}`,
    template: (name, noComment) => {
      const header = noComment ? '' : `/**\n * @file kite-${name} directive.\n * @module plugins/directives/${name}\n */\n\n`;
      return `${header}Kite.directive('${name}', (el, expr, scope) => {
  const render = () => {
    el.title = scope.get ? scope.get(expr) : scope[expr];
  };
  const stop = scope.watch ? scope.watch(expr, render) : () => {};
  render();
  return stop;
});
`;
    }
  },
  helper: {
    dir: 'plugins/helpers',
    suffix: '.js',
    includeSrc: (name) => `/plugins/helpers/${name}.js`,
    isScript: true,
    next: (file) => `edit ${file}`,
    template: (name, noComment) => {
      const header = noComment ? '' : `/**\n * @file ${name} helper.\n * @module plugins/helpers/${name}\n */\n\n`;
      return `${header}Kite.helper('${name}', (value) => {
  return value;
});
`;
    }
  },
  rule: {
    dir: 'plugins/rules',
    suffix: '.js',
    includeSrc: (name) => `/plugins/rules/${name}.js`,
    isScript: true,
    next: (file) => `edit ${file}`,
    template: (name, noComment) => {
      const header = noComment ? '' : `/**\n * @file ${name} validation rule.\n * @module plugins/rules/${name}\n */\n\n`;
      return `${header}Kite.rule('${name}', (val) => {
  return Boolean(val);
});
`;
    }
  },
  adapter: {
    dir: 'plugins/adapters',
    suffix: '.js',
    includeSrc: (name) => `/plugins/adapters/${name}.js`,
    isScript: true,
    next: (file) => `edit ${file}`,
    template: (name, noComment) => {
      const header = noComment ? '' : `/**\n * @file ${name} network adapter.\n * @module plugins/adapters/${name}\n */\n\n`;
      return `${header}Kite.adapter('${name}', {
  async request(config) {
    const res = await fetch(config.url, config);
    return res.json();
  }
});
`;
    }
  }
};

// ─── Public API ────────────────────────────────────────────────────────────
/**
 * Scaffold a piece into an existing Kite project.
 *
 * @param {object} opts
 * @param {string} opts.projectRoot
 * @param {string} opts.type
 * @param {string} opts.name
 * @param {object} [opts.flags={}]
 */
export function add({ projectRoot, type, name, flags = {} }) {
  const normType = type ? type.toLowerCase().trim() : '';
  const indexPath = path.join(projectRoot, 'public', 'index.html');
  const force = Boolean(flags.force);
  const noInclude = Boolean(flags['no-include'] || flags.noInclude);
  const noComment = Boolean(flags['no-comment'] || flags.noComment);
  const customPath = flags.path || null;

  // 1. Special case: route
  if (normType === 'route') {
    const routesPath = customPath
      ? path.resolve(projectRoot, customPath)
      : path.join(projectRoot, 'app', 'routes', 'routes.html');
    ensureDir(path.dirname(routesPath));

    const routePath = name.startsWith('/') ? name : `/${name}`;
    const viewName = flags.view || `${routePath.replace(/^\//, '').replace(/\//g, '-') || 'index'}-view`;
    const routeLine = `  <kite-route path="${routePath}" view="${viewName}"></kite-route>\n`;

    if (fs.existsSync(routesPath) && !force) {
      const existing = fs.readFileSync(routesPath, 'utf8');
      if (!existing.includes(`path="${routePath}"`)) {
        fs.appendFileSync(routesPath, routeLine);
        console.log(`  ${C.green('✔')} Updated  ${C.bold(path.relative(projectRoot, routesPath))}  (+1 route)`);
      } else {
        console.log(`  ${C.yellow('~')} Route ${routePath} already exists in routes.html`);
      }
    } else {
      fs.writeFileSync(routesPath, `<kite-routes>\n${routeLine}</kite-routes>\n`, 'utf8');
      console.log(`  ${C.green('✔')} Created  ${C.bold(path.relative(projectRoot, routesPath))}`);
      if (!noInclude) {
        addInclude(indexPath, '/app/routes/routes.html');
        console.log(`  ${C.green('✔')} Updated  public/index.html  (+1 include)`);
      }
    }
    console.log(`\n  ${C.dim(`Next: run \`kite dev\` and visit #${routePath}`)}\n`);
    return;
  }

  // 2. Special case: action
  if (normType === 'action') {
    const targetController = flags.controller || `${name}`;
    const controllerPath = customPath
      ? path.resolve(projectRoot, customPath)
      : path.join(projectRoot, 'app', 'controllers', `${targetController}.controller.html`);
    ensureDir(path.dirname(controllerPath));

    const actionLine = `  <kite-action name="${name}" run="${name}(item)"></kite-action>\n`;
    if (fs.existsSync(controllerPath)) {
      let content = fs.readFileSync(controllerPath, 'utf8');
      if (content.includes(`name="${name}"`) && !force) {
        console.log(`  ${C.yellow('~')} Action ${name} already exists in ${path.relative(projectRoot, controllerPath)}`);
        return;
      }
      if (content.includes('</kite-controller>')) {
        content = content.replace('</kite-controller>', `${actionLine}</kite-controller>`);
      } else {
        content += `\n${actionLine}`;
      }
      fs.writeFileSync(controllerPath, content, 'utf8');
      console.log(`  ${C.green('✔')} Added action '${name}' to ${C.bold(path.relative(projectRoot, controllerPath))}`);
    } else {
      const fullContent = `<kite-controller model="${targetController}">\n${actionLine}</kite-controller>\n`;
      fs.writeFileSync(controllerPath, fullContent, 'utf8');
      console.log(`  ${C.green('✔')} Created  ${C.bold(path.relative(projectRoot, controllerPath))}`);
      if (!noInclude) {
        addInclude(indexPath, `/app/controllers/${targetController}.controller.html`);
      }
    }
    console.log(`\n  ${C.dim(`Next: edit ${path.relative(projectRoot, controllerPath)} to customize action execution.`)}\n`);
    return;
  }

  // 3. Standard file generator
  const def = TYPE_MAP[normType];
  if (!def) {
    console.error(`  Unknown type: '${type}'.`);
    console.error(`  Valid types: component, view, model, controller, route, action, plugin, directive, helper, rule, adapter, api, layout.`);
    process.exit(1);
  }

  const targetDir = customPath
    ? path.resolve(projectRoot, customPath)
    : path.join(projectRoot, def.dir);
  ensureDir(targetDir);

  const cleanName = name.endsWith(def.suffix) ? name.slice(0, -def.suffix.length) : name;
  const filePath = path.join(targetDir, `${cleanName}${def.suffix}`);

  if (fs.existsSync(filePath) && !force) {
    console.log(`  ${C.yellow('~')} Already exists: ${path.relative(projectRoot, filePath)} (use --force to overwrite)`);
    return;
  }

  const content = def.template(cleanName, noComment, flags);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ${C.green('✔')} Created  ${C.bold(path.relative(projectRoot, filePath))}`);

  if (!noInclude && def.includeSrc) {
    const srcPath = def.includeSrc(cleanName);
    const updated = def.isScript ? addScript(indexPath, srcPath) : addInclude(indexPath, srcPath);
    if (updated) {
      console.log(`  ${C.green('✔')} Updated  public/index.html  (+1 ${def.isScript ? 'script' : 'include'})`);
    }
  }

  const relFile = path.relative(projectRoot, filePath);
  console.log(`\n  ${C.dim(`Next: ${def.next(relFile, cleanName)}`)}\n`);
}
