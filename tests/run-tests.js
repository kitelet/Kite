/**
 * @file Headless unit test suite for Kite core engine.
 * @description Runs directly via `node tests/run-tests.js` with zero dependencies.
 */

import { tokenize, evaluateExpression, parseObjectLiteral } from '../src/utils/expr.js';
import { createScope } from '../src/core/scope.js';
import { registerDirective, getDirective, getAllDirectives } from '../src/core/registry.js';
import { parseAttribute } from '../src/core/parser.js';
import { registerComponent, getComponent } from '../src/components/component.js';
import { registerModel, getModel, getAllModels, parseModelBody } from '../src/mvcr/model.js';
import { registerRoute, matchRoute } from '../src/mvcr/route.js';
import { ApiClient, registerAdapter, getAdapter } from '../src/api/client.js';
import { registerApi, getApi } from '../src/api/api-element.js';
import { registerStore, getStore, globalStore } from '../src/core/store.js';
import { parseForExpression } from '../src/directives/for.js';
import { graphqlAdapter } from '../src/api/adapters/graphql.js';
import { config, setConfig } from '../src/core/config.js';
import { parseTtl, clearPersistedStorage } from '../src/directives/persist.js';
import { sanitizeHtml } from '../src/utils/sanitize.js';
import { modelDirective } from '../src/directives/model.js';
import Kite from '../src/kite.js';
import { buildAgenticFiles, checkAgenticFiles } from '../bin/lib/agentic.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __testDir = path.dirname(fileURLToPath(import.meta.url));
const KITE_ROOT  = path.resolve(__testDir, '..');
const TEMPLATES_DIR = path.join(KITE_ROOT, 'templates');

function tmpDir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'kite-test-')); }
function rmDir(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }

// Polyfill in-memory localStorage for headless Node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.has(k) ? store.get(k) : null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (i) => Array.from(store.keys())[i] || null,
    keys: () => store.keys()
  };
}

if (typeof globalThis.window === 'undefined') {
  const listeners = new Map();
  globalThis.window = {
    addEventListener: (evt, fn) => {
      if (!listeners.has(evt)) listeners.set(evt, new Set());
      listeners.get(evt).add(fn);
    },
    removeEventListener: (evt, fn) => {
      if (listeners.has(evt)) listeners.get(evt).delete(fn);
    },
    dispatchEvent: (event) => {
      const set = listeners.get(event.type);
      if (set) {
        for (const fn of Array.from(set)) fn(event);
      }
      return true;
    }
  };
}

if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, params = {}) {
      this.type = type;
      this.detail = params.detail || null;
    }
  };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✔\x1b[0m ${message}`);
  } else {
    failed++;
    console.error(`  \x1b[31m✖\x1b[0m ${message}`);
  }
}

async function group(title, fn) {
  console.log(`\n\x1b[1m\x1b[36m--- ${title} ---\x1b[0m`);
  await fn();
}

// 1. Expression Evaluator Tests
group('Safe Expression Evaluator', () => {
  const scope = {
    count: 10,
    user: { name: 'Ada', age: 36 },
    items: ['apples', 'bananas'],
    isActive: true,
    score: 0
  };

  const helpers = {
    double: (n) => n * 2
  };

  // Literals & arithmetic
  assert(evaluateExpression('42', scope) === 42, 'Evaluates number literals');
  assert(evaluateExpression('"hello"', scope) === 'hello', 'Evaluates string literals');
  assert(evaluateExpression('true', scope) === true, 'Evaluates boolean true');
  assert(evaluateExpression('10 + 5 * 2', scope) === 20, 'Obeys standard operator precedence');
  assert(evaluateExpression('(10 + 5) * 2', scope) === 30, 'Obeys parenthesis grouping');

  // Identifiers & member lookups
  assert(evaluateExpression('count', scope) === 10, 'Resolves scope identifiers');
  assert(evaluateExpression('user.name', scope) === 'Ada', 'Resolves nested dot properties');
  assert(evaluateExpression('items[0]', scope) === 'apples', 'Resolves bracket indexing');
  assert(evaluateExpression('items.length', scope) === 2, 'Resolves array length');
  assert(evaluateExpression('items.filter(i => i === "apples").length', scope) === 1, 'Evaluates array filter with arrow functions');

  // Relational & equality
  assert(evaluateExpression('count > 5', scope) === true, 'Evaluates relational >');
  assert(evaluateExpression('count <= 10', scope) === true, 'Evaluates relational <=');
  assert(evaluateExpression('user.name === "Ada"', scope) === true, 'Evaluates strict equality ===');
  assert(evaluateExpression('user.age !== 30', scope) === true, 'Evaluates inequality !==');

  // Logical operators & ternary
  assert(evaluateExpression('isActive && count > 5', scope) === true, 'Evaluates logical AND');
  assert(evaluateExpression('!isActive || count === 10', scope) === true, 'Evaluates logical OR');
  assert(evaluateExpression('count > 5 ? "Big" : "Small"', scope) === 'Big', 'Evaluates ternary condition');

  // Mutations (assignments & increments)
  evaluateExpression('count++', scope);
  assert(scope.count === 11, 'Evaluates postfix count++');

  evaluateExpression('count--', scope);
  assert(scope.count === 10, 'Evaluates postfix count--');

  evaluateExpression('score += 5', scope);
  assert(scope.score === 5, 'Evaluates compound assignment +=');

  evaluateExpression('user.name = "Grace"', scope);
  assert(scope.user.name === 'Grace', 'Evaluates nested property assignment');

  // Semicolon statement sequences
  evaluateExpression('count = 50; score = 100; isActive = false;', scope);
  assert(scope.count === 50 && scope.score === 100 && scope.isActive === false, 'Evaluates semicolon statement sequences');

  // Safe globals & string methods on primitives
  assert(evaluateExpression('Number("42")', scope) === 42, 'Invokes safe standard global Number()');
  assert(evaluateExpression('String(100)', scope) === '100', 'Invokes safe standard global String()');
  assert(evaluateExpression('"ada@example.com".includes("@")', scope) === true, 'Evaluates string.includes on string primitive');
  assert(evaluateExpression('"  hello  ".trim()', scope) === 'hello', 'Evaluates string.trim on string primitive');
  assert(evaluateExpression('Math.max(10, 20, 5)', scope) === 20, 'Invokes Math.max standard utility');

  // Safe helper invocation
  assert(evaluateExpression('double(count)', scope, helpers) === 100, 'Invokes registered helpers');

  // Security bounds
  assert(evaluateExpression('window', scope) === undefined, 'Rejects access to window');
  assert(evaluateExpression('eval("1+1")', scope) === undefined, 'Rejects access to eval');
  assert(evaluateExpression('constructor', scope) === undefined, 'Rejects prototype constructor');
});

// 2. Scope Reactivity & Proxy Tests
group('Scope Reactivity & Hierarchy', () => {
  const globalState = { appTitle: 'Kite App' };
  const parentScope = createScope({ theme: 'dark', user: 'Ada' }, null, globalState);
  const childScope = createScope({ count: 1 }, parentScope, globalState);

  // Lookup chain
  assert(childScope.count === 1, 'Reads property from child scope');
  assert(childScope.theme === 'dark', 'Falls back to parent scope property');
  assert(childScope.appTitle === 'Kite App', 'Falls back to global state property');

  // Writes to parent vs local
  childScope.theme = 'light';
  assert(parentScope.theme === 'light', 'Writing existing parent property updates parent');

  childScope.count = 5;
  assert(childScope.count === 5, 'Writing child property updates child');

  // Subscriptions
  let notified = 0;
  childScope.$subscribe('count', () => {
    notified++;
  });

  childScope.count = 6;
  assert(notified === 1, 'Subscriber triggered on property mutation');
});

// 3. Parser Grammar Tests
group('Attribute Grammar Parser', () => {
  const p1 = parseAttribute('kite-text', 'count');
  assert(p1.name === 'text' && p1.expression === 'count', 'Parses simple verb attribute');

  const p2 = parseAttribute('kite-bind:src', 'avatar');
  assert(p2.name === 'bind' && p2.arg === 'src', 'Parses colon argument (kite-bind:src)');

  const p3 = parseAttribute('kite-on-click.prevent', 'save()');
  assert(
    p3.name === 'on' && p3.arg === 'click' && p3.modifiers.includes('prevent'),
    'Parses event directive with dot modifiers (kite-on-click.prevent)'
  );

  const parsedObj = parseObjectLiteral('{ count: 0, title: "Kite" }');
  assert(parsedObj.count === 0 && parsedObj.title === 'Kite', 'Parses object literal strings safely');
});

// 4. Registry Tests
group('Directive Registry', () => {
  registerDirective('custom-test', () => {}, { priority: 42 });
  const d = getDirective('custom-test');
  assert(d && d.priority === 42, 'Registers and retrieves custom directive with priority');
});

// 5. Components Subsystem Tests
group('Components Subsystem', () => {
  const fakeTemplate = { tagName: 'TEMPLATE', content: 'card-content' };
  registerComponent('user-card', fakeTemplate);
  const comp = getComponent('user-card');
  assert(comp === fakeTemplate, 'Registers and retrieves component by name');
  assert(getComponent('USER-CARD') === fakeTemplate, 'Component lookup is case-insensitive');
});

// 6. MVCR Subsystem Tests
group('MVCR Subsystem', () => {
  const parsed = parseModelBody(`{
    val: 10,
    increment() { this.val++; }
  }`);
  assert(parsed.val === 10, 'Parses model state properties');

  const modelScope = registerModel('test-model', parsed);
  assert(getModel('test-model') === modelScope, 'Registers and retrieves model by name');

  modelScope.increment();
  assert(modelScope.val === 11, 'Model methods mutate reactive scope through `this`');

  Kite.helper('cube', (n) => n * n * n);
  assert(evaluateExpression('cube(3)', {}, Kite.helpers) === 27, 'Registers and executes custom Kite helper');
});

// 7. API Client & Local Adapter Tests
await group('API Client & Adapters', async () => {
  const client = new ApiClient({ base: 'users_test', adapter: 'local' });
  client.setHeader('X-Custom-Test', '12345');
  assert(client.headers['X-Custom-Test'] === '12345', 'Sets default client headers');

  // Clear previous test records if any
  await client.delete('');

  // 1. Create (POST)
  const created = await client.post('', { name: 'Ada Lovelace', role: 'Engineer' });
  assert(created && created.name === 'Ada Lovelace' && created.id, 'Creates record via localAdapter POST');

  // 2. Read (GET list)
  const list = await client.get('');
  assert(Array.isArray(list) && list.length === 1 && list[0].name === 'Ada Lovelace', 'Fetches records via localAdapter GET');

  // 3. Read single (GET item)
  const single = await client.get(`/${created.id}`);
  assert(single && single.name === 'Ada Lovelace', 'Fetches single record by ID via localAdapter GET');

  // 4. Update (PUT)
  const updated = await client.put(`/${created.id}`, { role: 'Chief Scientist' });
  assert(updated.role === 'Chief Scientist' && updated.name === 'Ada Lovelace', 'Updates record via localAdapter PUT');

  // 5. Delete (DELETE item)
  const delRes = await client.delete(`/${created.id}`);
  assert(delRes.success === true, 'Deletes record via localAdapter DELETE');

  const afterDelList = await client.get('');
  assert(afterDelList.length === 0, 'Record was removed from store');

  // 6. Custom Adapter Registration
  registerAdapter('mock-ping', {
    request: async (cfg) => ({ pong: true, path: cfg.path })
  });
  const pingClient = new ApiClient({ adapter: 'mock-ping' });
  const pingRes = await pingClient.get('/hello');
  assert(pingRes.pong === true && pingRes.path === '/hello', 'Registers and dispatches custom protocol adapter');
});

// 8. Model API Binding & Reactive Flags Tests
await group('Model API Integration & Reactive Flags', async () => {
  const apiInstance = new ApiClient({ base: 'products_test', adapter: 'local' });
  registerApi('products_api', apiInstance);

  // Clear products
  await apiInstance.delete('');

  // Define model with api option
  const productModel = registerModel('products', {
    items: [],
    async loadProducts() {
      this.items = await this.api.get('');
    }
  }, 'products_api');

  assert(productModel.api !== undefined, 'Injects `this.api` into model scope');
  assert(productModel.loading === false, 'Initializes model `loading` flag as false');
  assert(productModel.error === null, 'Initializes model `error` flag as null');
  assert(productModel.empty === false, 'Initializes model `empty` flag as false');

  // Load products (currently empty)
  await productModel.loadProducts();
  assert(productModel.empty === true, 'Sets `empty = true` when API response is empty array');
  assert(productModel.loading === false, 'Resets `loading = false` after API call completes');

  // Add an item and load again
  await apiInstance.post('', { name: 'Mechanical Keyboard', price: 99 });
  await productModel.loadProducts();
  assert(productModel.items.length === 1 && productModel.empty === false, 'Sets `empty = false` when API response has data');

  // Verify error handling
  try {
    await productModel.api.get('/nonexistent-999');
  } catch (e) {
    // caught
  }
  assert(productModel.error !== null, 'Captures API error on model `error` flag');
  assert(productModel.loading === false, 'Resets `loading = false` on API failure');
});

// 9. Parameterized Routing & Route Guards Tests
group('Parameterized Routing & Guards', () => {
  registerRoute('/users/:id', 'user-detail');
  registerRoute('/org/:orgId/repos/:repoName', 'repo-detail');
  registerRoute('/dashboard', 'dash-view', { guard: 'isLoggedIn', redirect: '/login' });

  // Parameterized match
  const userMatch = matchRoute('/users/42');
  assert(userMatch !== null, 'Matches parameterized route pattern');
  assert(userMatch.route.viewName === 'user-detail', 'Resolves correct view for parameterized route');
  assert(userMatch.params.id === '42', 'Extracts parameter `:id` as "42"');

  // Multi-parameter match
  const repoMatch = matchRoute('/org/kitelet/repos/core');
  assert(repoMatch !== null, 'Matches multi-parameter route pattern');
  assert(repoMatch.params.orgId === 'kitelet', 'Extracts first parameter `:orgId`');
  assert(repoMatch.params.repoName === 'core', 'Extracts second parameter `:repoName`');

  // Route guards
  const guardedMatch = matchRoute('/dashboard');
  assert(guardedMatch !== null, 'Matches guarded route');
  assert(guardedMatch.route.guard === 'isLoggedIn', 'Preserves guard expression');
  assert(guardedMatch.route.redirect === '/login', 'Preserves redirect fallback path');

  registerModel('auth', { isLoggedIn: true });
  const allModels = getAllModels();
  const guardScope = createScope(Object.assign({}, globalStore, allModels), null, globalStore);
  assert(evaluateExpression('auth.isLoggedIn', guardScope) === true, 'Guard evaluates true when auth model isLoggedIn is true');
  allModels.auth.isLoggedIn = false;
  assert(evaluateExpression('auth.isLoggedIn', guardScope) === false, 'Guard evaluates false when auth model isLoggedIn is false');
});

// 10. Global Store (<kite-store>) Tests
group('Global Store Subsystem', () => {
  const appStore = registerStore('app', { theme: 'dark', currentUser: 'Ada' });
  assert(getStore('app') === appStore, 'Registers and retrieves global store by name');
  assert(appStore.theme === 'dark', 'Maintains reactive store state');

  // Any scope created with globalStore can read store state
  const localScope = createScope({ count: 1 }, null, globalStore);
  assert(localScope.currentUser === 'Ada', 'Scope inherits global store values');
  assert(localScope.theme === 'dark', 'Scope inherits store theme');
});

// 11. Loop Grammar & Filter Tests
group('Advanced Loop Grammar (Ranges & Where)', () => {
  // Range syntax: n in 1..10
  const rangeParsed = parseForExpression('n in 1..10');
  assert(rangeParsed.itemVar === 'n' && rangeParsed.collectionExpr === '1..10', 'Parses range loop grammar');

  // Where filter syntax: item in items where item.done
  const whereParsed = parseForExpression('item in items where item.done');
  assert(whereParsed.itemVar === 'item' && whereParsed.collectionExpr === 'items' && whereParsed.whereExpr === 'item.done', 'Parses where filter clause');

  // Destructured with where
  const complexParsed = parseForExpression('(task, i) in todoList where task.priority === "high"');
  assert(complexParsed.itemVar === 'task' && complexParsed.indexVar === 'i' && complexParsed.whereExpr === 'task.priority === "high"', 'Parses destructured loop with where clause');
});

// 12. 404 Wildcard Routing Tests
group('404 Wildcard Fallback Route', () => {
  registerRoute('*', 'not-found-view');
  const missMatch = matchRoute('/unknown/broken/url');
  assert(missMatch !== null, 'Catches unmapped paths with wildcard fallback');
  assert(missMatch.route.viewName === 'not-found-view', 'Resolves not-found view');
});

// 13. GraphQL Adapter Tests
group('GraphQL Protocol Adapter', () => {
  const adapter = getAdapter('graphql');
  assert(adapter !== undefined && adapter.name === 'graphql', 'Retrieves registered graphqlAdapter');
});

// 14. DevTools & Introspection Tests
group('DevTools & Introspection Helpers', () => {
  assert(Kite.version === '1.0.0', 'Kite reports version 1.0.0');
  const debugDump = Kite.dumpState();
  assert(debugDump && debugDump.stores !== undefined, 'Kite.dumpState() returns active stores');

  const dummyEl = { getAttributeNames: () => ['kite-scope', 'kite-cloak'] };
  const inspected = Kite.inspect(dummyEl);
  assert(inspected && inspected.directives.includes('kite-scope'), 'Kite.inspect() lists element directives');
});

// 15. Computed, Watch & Persist Directives Tests
group('Computed, Watch & Persist Directives', () => {
  // Computed
  const compScope = createScope({ count: 5 });
  const compDef = getDirective('computed');
  assert(compDef !== undefined, 'Registers computed directive');
  compDef.handler(null, 'count * 2', compScope, 'double');
  assert(compScope.double === 10, 'Calculates derived computed property');

  // Watch
  const watchScope = createScope({ score: 10, updated: false });
  const watchDef = getDirective('watch');
  assert(watchDef !== undefined, 'Registers watch directive');
  watchDef.handler(null, 'updated = true', watchScope, 'score');
  watchScope.score = 25;
  assert(watchScope.updated === true, 'Watcher executes action on property change');

  // Persist
  const persistScope = createScope({ setting: 'dark' });
  const persistDef = getDirective('persist');
  assert(persistDef !== undefined, 'Registers persist directive');
  persistDef.handler({ id: 'prefs' }, 'local', persistScope);
  assert(globalThis.localStorage.getItem('kite:prefs') !== null, 'Persists scope state to localStorage with default namespace');
});

// 16. Configuration & Runtime Overrides
group('Configuration & Runtime Overrides', () => {
  const currentConfig = Kite.config();
  assert(currentConfig.prefix === 'kite-', 'Default prefix is kite-');
  assert(currentConfig.mode === 'development', 'Default mode is development');
  assert(currentConfig.persistNamespace === 'kite', 'Default persist namespace is kite');

  Kite.config({ mode: 'production', persistNamespace: 'myapp' });
  assert(Kite.config().mode === 'production', 'Updates runtime mode to production');
  assert(Kite.config().persistNamespace === 'myapp', 'Updates persist namespace to myapp');

  // Reset back for subsequent tests
  Kite.config({ mode: 'development', persistNamespace: 'kite' });
});

// 17. HTML Sanitization & XSS Defense
group('HTML Sanitization & XSS Defense', () => {
  // Strips script tags
  const dirty1 = 'Hello <script>alert("xss")</script><b>World</b>';
  const clean1 = sanitizeHtml(dirty1);
  assert(!clean1.includes('<script>') && clean1.includes('<b>World</b>'), 'Strips malicious script tags');

  // Strips inline on* event handlers
  const dirty2 = '<img src="avatar.png" onerror="alert(1)" onload="evil()">';
  const clean2 = sanitizeHtml(dirty2);
  assert(!clean2.includes('onerror') && !clean2.includes('onload'), 'Strips inline event handlers');

  // Strips javascript: URLs
  const dirty3 = '<a href="javascript:alert(1)">Click Me</a>';
  const clean3 = sanitizeHtml(dirty3);
  assert(!clean3.includes('javascript:'), 'Strips javascript: pseudoprotocol URLs');

  // Strips iframe tags
  const dirty4 = '<iframe src="https://evil.com"></iframe><div>Safe</div>';
  const clean4 = sanitizeHtml(dirty4);
  assert(!clean4.includes('<iframe') && clean4.includes('Safe'), 'Strips dangerous iframe tags');

  // Strips CSS expressions
  const dirty5 = '<div style="width: expression(alert(1))">Content</div>';
  const clean5 = sanitizeHtml(dirty5);
  assert(!clean5.includes('expression'), 'Strips CSS expression vectors');
});

// 18. Namespaced Persistence, Expiry & Programmatic Clear
group('Namespaced Persistence, TTL & Programmatic Clear', () => {
  // TTL parsing
  assert(parseTtl('30s') === 30000, 'Parses 30s TTL to 30,000ms');
  assert(parseTtl('15m') === 15 * 60 * 1000, 'Parses 15m TTL');
  assert(parseTtl('2h') === 2 * 60 * 60 * 1000, 'Parses 2h TTL');
  assert(parseTtl('7d') === 7 * 24 * 60 * 60 * 1000, 'Parses 7d TTL');
  assert(parseTtl('invalid') === null, 'Returns null for malformed TTL');

  // Seed storage with Kite and non-Kite keys
  globalThis.localStorage.setItem('kite:user_data', JSON.stringify({ name: 'Alice' }));
  globalThis.localStorage.setItem('kite:theme_mode', JSON.stringify({ theme: 'dark' }));
  globalThis.localStorage.setItem('foreign_app_key', 'do_not_delete');

  assert(globalThis.localStorage.getItem('kite:user_data') !== null, 'Seeds kite-prefixed item');
  assert(globalThis.localStorage.getItem('foreign_app_key') === 'do_not_delete', 'Seeds foreign non-kite item');

  // Clear Kite storage
  Kite.clear();

  assert(globalThis.localStorage.getItem('kite:user_data') === null, 'Kite.clear() purges kite:user_data');
  assert(globalThis.localStorage.getItem('kite:theme_mode') === null, 'Kite.clear() purges kite:theme_mode');
  assert(globalThis.localStorage.getItem('foreign_app_key') === 'do_not_delete', 'Kite.clear() preserves non-Kite keys');
});

// 19. Programmatic Facade & Event Bridge
group('Programmatic Facade & Event Bridge', () => {
  // Kite.get and Kite.set with Model
  Kite.model('authService', {
    user: 'Guest',
    login(name) { this.user = name; }
  });

  assert(Kite.get('authService', 'user') === 'Guest', 'Kite.get() reads property from model');
  Kite.set('authService', 'user', 'SuperAdmin');
  assert(Kite.get('authService', 'user') === 'SuperAdmin', 'Kite.set() writes property to model');

  // Kite.call
  Kite.call('authService', 'login', 'InvitedMember');
  assert(Kite.get('authService', 'user') === 'InvitedMember', 'Kite.call() invokes method on model');

  // Kite.get on mock element
  const mockElement = {
    _kite: {
      scope: { tab: 'settings' },
      unbinder: () => { mockElement.unbound = true; }
    }
  };
  assert(Kite.get(mockElement, 'tab') === 'settings', 'Kite.get() reads from el._kite.scope');
  Kite.set(mockElement, 'tab', 'profile');
  assert(Kite.get(mockElement, 'tab') === 'profile', 'Kite.set() writes to el._kite.scope');

  // Kite.unmount
  Kite.unmount(mockElement);
  assert(mockElement.unbound === true, 'Kite.unmount() invokes unbinder');
  assert(mockElement._kite === undefined, 'Kite.unmount() removes _kite property');

  // Event Bridge: Kite.on, Kite.emit, Kite.off
  let capturedEvent = null;
  const listener = (e) => { capturedEvent = e.detail; };
  Kite.on('custom-signal', listener);
  Kite.emit('custom-signal', { payload: 42 });
  assert(capturedEvent && capturedEvent.payload === 42, 'Kite.emit() dispatches event received by Kite.on()');

  Kite.off('custom-signal', listener);
  capturedEvent = null;
  Kite.emit('custom-signal', { payload: 99 });
  assert(capturedEvent === null, 'Kite.off() removes listener');

  // Plugin registration
  let pluginInstalled = false;
  const testPlugin = {
    name: 'test-logger',
    install(k) {
      pluginInstalled = (k === Kite);
    }
  };
  Kite.use(testPlugin);
  assert(pluginInstalled === true, 'Kite.use() installs custom plugin');
});

// 20. Unregistering Extensions via Cleanup Functions
group('Unregistering Extensions via Cleanup Functions', () => {
  // Directive unregister
  const offDir = Kite.directive('tempbanner', (el) => {});
  assert(Kite.inspect('tempbanner') !== null, 'Registers temporary directive');
  offDir();
  assert(Kite.inspect('tempbanner') === null, 'Unregisters temporary directive via returned cleanup');

  // Helper unregister
  const offHelper = Kite.helper('tempMath', (n) => n * 3);
  assert(Kite.evaluate('tempMath(4)') === 12, 'Executes temporary helper');
  offHelper();
  assert(Kite.evaluate('tempMath(4)') === undefined, 'Unregisters helper via returned cleanup');

  // Validation Rule unregister
  const offRule = Kite.rule('tempRule', (v) => v === 'valid');
  assert(Kite.registry.rules.has('temprule'), 'Registers temporary rule');
  offRule();
  assert(!Kite.registry.rules.has('temprule'), 'Unregisters rule via returned cleanup');

  // Adapter unregister
  const offAdapter = Kite.adapter('temp-proto', async () => ({ ok: true }));
  assert(Kite.registry.adapters.has('temp-proto'), 'Registers temporary adapter');
  offAdapter();
  assert(!Kite.registry.adapters.has('temp-proto'), 'Unregisters adapter via returned cleanup');

  // Component unregister
  const offComp = Kite.component('temp-widget', '<div>Widget</div>');
  assert(Kite.registry.components.has('temp-widget'), 'Registers temporary component');
  offComp();
  assert(!Kite.registry.components.has('temp-widget'), 'Unregisters component via returned cleanup');
});

// 21. Meta-APIs (override, original, disable, enable, single-key config)
group('Meta-APIs (override, original, disable, enable, config)', () => {
  // Single-key config reader
  assert(Kite.config('mode') === 'development', 'Kite.config(key) reads single config property');
  assert(Kite.config('prefix') === 'kite-', 'Kite.config(key) reads prefix');

  // Original directive retrieval
  const originalTextHandler = Kite.original('directives.text');
  assert(typeof originalTextHandler === 'function', 'Kite.original("directives.text") returns original handler');

  // Override text directive
  let overrideCalled = false;
  Kite.override('directives.text', (el, expr, scope) => {
    overrideCalled = true;
    return originalTextHandler(el, expr, scope);
  });
  const testTextEl = { textContent: '' };
  Kite.inspect('text').handler(testTextEl, 'msg', { msg: 'Hello' });
  assert(overrideCalled === true, 'Kite.override() invokes replacement directive handler');

  // Restore original
  Kite.override('directives.text', originalTextHandler);

  // Disable and Enable directives
  Kite.disable('text');
  assert(Kite.inspect('text') === null, 'Kite.disable("text") disables directive from registry');
  Kite.enable('text');
  assert(Kite.inspect('text') !== null, 'Kite.enable("text") re-enables directive');

  // Disable array
  Kite.disable(['for', 'if']);
  assert(Kite.inspect('for') === null && Kite.inspect('if') === null, 'Kite.disable([...]) disables multiple directives');
  Kite.enable(['for', 'if']);
  assert(Kite.inspect('for') !== null && Kite.inspect('if') !== null, 'Kite.enable([...]) re-enables multiple directives');
});

// 22. Lifecycle Hooks
await group('Lifecycle Hooks Subsystem', async () => {
  let beforeScanRan = false;
  let afterScanRan = false;

  const offBefore = Kite.hook('before:scan', (root) => { beforeScanRan = true; });
  const offAfter = Kite.hook('after:scan', (root) => { afterScanRan = true; });

  const dummyRoot = {
    tagName: 'DIV',
    hasAttribute: () => false,
    getAttribute: () => null,
    querySelectorAll: () => [],
    nodeType: 1,
    attributes: []
  };

  Kite.scan(dummyRoot);
  assert(beforeScanRan === true, 'Kite.hook("before:scan") executes on scan()');
  assert(afterScanRan === true, 'Kite.hook("after:scan") executes on scan() completion');

  offBefore();
  offAfter();

  // Test fetch hooks
  let fetchBeforeRan = false;
  const offFetch = Kite.hook('before:fetch', (opts) => { fetchBeforeRan = true; });
  const testApi = Kite.api('hook-api', { base: 'hook_items', adapter: 'local' });
  await testApi.get('');
  assert(fetchBeforeRan === true, 'Kite.hook("before:fetch") executes before ApiClient request');
  offFetch();
});

// 23. Adapter Middleware Pipeline (Onion-style)
await group('Adapter Middleware Pipeline', async () => {
  const callStack = [];

  const offMw1 = Kite.middleware('mw-outer', async (opts, ctx, next) => {
    callStack.push('outer-before');
    const res = await next(opts, ctx);
    callStack.push('outer-after');
    return res;
  });

  const offMw2 = Kite.middleware('mw-inner', async (opts, ctx, next) => {
    callStack.push('inner-before');
    const res = await next(opts, ctx);
    callStack.push('inner-after');
    return res;
  });

  const testClient = Kite.api('mw-test-api', { base: 'mw_users', adapter: 'local' });
  await testClient.get('');

  assert(
    JSON.stringify(callStack) === JSON.stringify(['outer-before', 'inner-before', 'inner-after', 'outer-after']),
    'Executes middleware stack in proper onion-style order'
  );

  offMw1();
  offMw2();
});

// 24. JavaScript Component Descriptors
group('JavaScript Component Descriptors', () => {
  Kite.component('user-profile-badge', {
    props: {
      role: { default: 'Reader' },
      verified: { type: 'boolean', default: false }
    },
    template: '<div class="badge"><span kite-text="role"></span></div>',
    setup(props, { emit, scope }) {
      return {
        displayRole: `[${props.role}]`
      };
    },
    style: '.badge { color: blue; }'
  });

  const badgeComp = Kite.inspect('user-profile-badge');
  assert(badgeComp !== null, 'Registers JS component descriptor');
  assert(badgeComp.props && badgeComp.props.role.default === 'Reader', 'Preserves descriptor props');
  assert(typeof badgeComp.setup === 'function', 'Preserves component setup function');
  assert(badgeComp.style.includes('.badge'), 'Preserves component style definition');
});

// 25. Dot-Namespaced Helpers
group('Dot-Namespaced & Scoped Helpers', () => {
  const offDate = Kite.helper('math.cube', (n) => n * n * n);
  const cubeResult = Kite.evaluate('math.cube(3)');
  assert(cubeResult === 27, 'Evaluates dot-namespaced helper math.cube(3) === 27');
  offDate();
  assert(Kite.evaluate('math.cube(3)') === undefined, 'Unregisters dot-namespaced helper');
});

// 26. Introspection & State Exploration
group('Introspection & State Exploration', () => {
  // Inspect all
  const summary = Kite.inspect();
  assert(Array.isArray(summary.directives) && summary.directives.includes('text'), 'Kite.inspect() lists all directives');
  assert(Array.isArray(summary.helpers) && summary.helpers.includes('uppercase'), 'Kite.inspect() lists all helpers');
  assert(Array.isArray(summary.adapters) && summary.adapters.includes('rest'), 'Kite.inspect() lists all adapters');

  // Inspect specific directive
  const textInfo = Kite.inspect('text');
  assert(textInfo && textInfo.name === 'text', 'Kite.inspect("text") returns directive definition');

  // State inspection
  Kite.store('themeStore', { activeTheme: 'midnight' });
  Kite.model('profileModel', { bio: { title: 'Developer' } });

  assert(Kite.state('themeStore.activeTheme') === 'midnight', 'Kite.state("themeStore.activeTheme") retrieves nested store value');
  assert(Kite.state('profileModel.bio.title') === 'Developer', 'Kite.state("profileModel.bio.title") retrieves nested model value');

  // Public registry getter
  assert(Kite.registry.directives instanceof Map, 'Kite.registry.directives exposes active Map');
  assert(Kite.registry.rules instanceof Map, 'Kite.registry.rules exposes active Map');
});

// ─── Scaffolding & Project Setup Tests ─────────────────────────────────────

// 27. CLI Scaffolding & Templates
group('CLI Scaffolding & Templates', () => {
  // Verify each template directory exists
  for (const tmpl of ['blank', 'starter', 'full', 'component-kit']) {
    assert(fs.existsSync(path.join(TEMPLATES_DIR, tmpl)), `${tmpl} template directory exists`);
  }

  // Verify common dotfiles exist
  const commonDir = path.join(TEMPLATES_DIR, 'common');
  assert(fs.existsSync(path.join(commonDir, '.editorconfig')), 'common/.editorconfig exists');
  assert(fs.existsSync(path.join(commonDir, '.gitignore')), 'common/.gitignore exists');
  assert(fs.existsSync(path.join(commonDir, '.kitrc')), 'common/.kitrc exists');
  assert(fs.existsSync(path.join(commonDir, 'kite.config.json')), 'common/kite.config.json exists');

  // Verify kite.config.json is valid JSON
  const cfg = JSON.parse(fs.readFileSync(path.join(commonDir, 'kite.config.json'), 'utf8'));
  assert(cfg.dev !== undefined, 'kite.config.json has dev section');
  assert(cfg.build !== undefined, 'kite.config.json has build section');

  // Verify starter template has expected files
  const starterIndex = path.join(TEMPLATES_DIR, 'starter', 'public', 'index.html');
  assert(fs.existsSync(starterIndex), 'starter template has public/index.html');
  const starterHtml = fs.readFileSync(starterIndex, 'utf8');
  assert(starterHtml.includes('<kite-outlet'), 'starter index.html has <kite-outlet>');
  assert(starterHtml.includes('kite-include'), 'starter index.html has <kite-include> tags');

  // Verify starter model
  const counterModel = path.join(TEMPLATES_DIR, 'starter', 'app', 'models', 'counter.model.html');
  assert(fs.existsSync(counterModel), 'starter template has counter.model.html');
  const modelHtml = fs.readFileSync(counterModel, 'utf8');
  assert(modelHtml.includes('kite-model'), 'counter.model.html contains <kite-model>');

  // Verify full template structure
  assert(fs.existsSync(path.join(TEMPLATES_DIR, 'full', 'app', 'models', 'todos.model.html')), 'full template has todos.model.html');
  assert(fs.existsSync(path.join(TEMPLATES_DIR, 'full', 'app', 'views', 'todos.view.html')), 'full template has todos.view.html');
  assert(fs.existsSync(path.join(TEMPLATES_DIR, 'full', 'app', 'controllers', 'todos.controller.html')), 'full template has todos.controller.html');
  assert(fs.existsSync(path.join(TEMPLATES_DIR, 'full', 'app', 'routes', 'routes.html')), 'full template has routes.html');

  // Verify component-kit template components
  for (const comp of ['button', 'card', 'modal', 'input', 'alert']) {
    const compFile = path.join(TEMPLATES_DIR, 'component-kit', 'app', 'components', `${comp}.component.html`);
    assert(fs.existsSync(compFile), `component-kit has ${comp}.component.html`);
  }

  // Verify component-kit tokens.css exists
  assert(fs.existsSync(path.join(TEMPLATES_DIR, 'component-kit', 'styles', 'tokens.css')), 'component-kit has tokens.css');
  assert(fs.existsSync(path.join(TEMPLATES_DIR, 'component-kit', 'styles', 'components.css')), 'component-kit has components.css');
});

// 28. CLI create — Project Scaffolding
group('CLI create — Project Scaffolding', async () => {
  const { create } = await import('../bin/lib/create.js');

  const dest = tmpDir();
  try {
    create({ projectName: 'test-app', template: 'starter', targetDir: dest });

    // Check core files were written
    assert(fs.existsSync(path.join(dest, 'package.json')), 'create writes package.json');
    assert(fs.existsSync(path.join(dest, 'README.md')), 'create writes README.md');
    assert(fs.existsSync(path.join(dest, 'public', 'index.html')), 'create writes public/index.html');
    assert(fs.existsSync(path.join(dest, 'app', 'models', 'counter.model.html')), 'create writes model files');
    assert(fs.existsSync(path.join(dest, 'app', 'views', 'home.view.html')), 'create writes view files');
    assert(fs.existsSync(path.join(dest, 'app', 'components', 'nav-bar.component.html')), 'create writes component files');
    assert(fs.existsSync(path.join(dest, 'app', 'routes', 'routes.html')), 'create writes routes file');

    // Validate generated package.json
    const pkg = JSON.parse(fs.readFileSync(path.join(dest, 'package.json'), 'utf8'));
    assert(pkg.name === 'test-app', 'package.json has correct name');
    assert(pkg.scripts !== undefined, 'package.json has scripts');
    assert(pkg.scripts.dev !== undefined, 'package.json has dev script');
    assert(pkg.dependencies['@kitelet/core'] !== undefined, 'package.json depends on @kitelet/core');

    // Verify dotfiles were copied
    assert(fs.existsSync(path.join(dest, '.editorconfig')), 'create copies .editorconfig');
    assert(fs.existsSync(path.join(dest, '.gitignore')), 'create copies .gitignore');
  } finally {
    rmDir(dest);
  }
});

// 29. CLI add — Feature Scaffold Generator
group('CLI add — Feature Scaffold Generator', async () => {
  const { add } = await import('../bin/lib/add.js');

  const dest = tmpDir();
  try {
    // Seed a minimal project
    fs.mkdirSync(path.join(dest, 'public'));
    fs.writeFileSync(path.join(dest, 'public', 'index.html'), `<!DOCTYPE html><html><body></body></html>`, 'utf8');

    // Add a model
    add({ projectRoot: dest, type: 'model', name: 'todos' });
    assert(fs.existsSync(path.join(dest, 'app', 'models', 'todos.model.html')), 'add model creates file');
    const modelContent = fs.readFileSync(path.join(dest, 'app', 'models', 'todos.model.html'), 'utf8');
    assert(modelContent.includes('kite-model'), 'added model file contains <kite-model>');
    const indexHtml = fs.readFileSync(path.join(dest, 'public', 'index.html'), 'utf8');
    assert(indexHtml.includes('/app/models/todos.model.html'), 'add model injects kite-include into index.html');

    // Add a view
    add({ projectRoot: dest, type: 'view', name: 'todos' });
    assert(fs.existsSync(path.join(dest, 'app', 'views', 'todos.view.html')), 'add view creates file');
    const viewContent = fs.readFileSync(path.join(dest, 'app', 'views', 'todos.view.html'), 'utf8');
    assert(viewContent.includes('kite-view'), 'added view file contains <kite-view>');

    // Add a component
    add({ projectRoot: dest, type: 'component', name: 'nav-bar' });
    assert(fs.existsSync(path.join(dest, 'app', 'components', 'nav-bar.component.html')), 'add component creates file');

    // Add a route
    add({ projectRoot: dest, type: 'route', name: '/todos' });
    const routesPath = path.join(dest, 'app', 'routes', 'routes.html');
    assert(fs.existsSync(routesPath), 'add route creates routes.html');
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    assert(routesContent.includes('path="/todos"'), 'add route inserts correct path');

    // Add a plugin
    add({ projectRoot: dest, type: 'plugin', name: 'my-plugin' });
    assert(fs.existsSync(path.join(dest, 'plugins', 'my-plugin.js')), 'add plugin creates plugins/*.js');

    // Add extended generators
    add({ projectRoot: dest, type: 'directive', name: 'tooltip' });
    assert(fs.existsSync(path.join(dest, 'plugins', 'directives', 'tooltip.js')), 'add directive creates plugins/directives/*.js');

    add({ projectRoot: dest, type: 'helper', name: 'format' });
    assert(fs.existsSync(path.join(dest, 'plugins', 'helpers', 'format.js')), 'add helper creates plugins/helpers/*.js');

    add({ projectRoot: dest, type: 'rule', name: 'email' });
    assert(fs.existsSync(path.join(dest, 'plugins', 'rules', 'email.js')), 'add rule creates plugins/rules/*.js');

    add({ projectRoot: dest, type: 'adapter', name: 'socket' });
    assert(fs.existsSync(path.join(dest, 'plugins', 'adapters', 'socket.js')), 'add adapter creates plugins/adapters/*.js');

    add({ projectRoot: dest, type: 'api', name: 'users' });
    assert(fs.existsSync(path.join(dest, 'app', 'api', 'users.api.html')), 'add api creates app/api/*.api.html');

    add({ projectRoot: dest, type: 'layout', name: 'dashboard' });
    assert(fs.existsSync(path.join(dest, 'app', 'layouts', 'dashboard.layout.html')), 'add layout creates app/layouts/*.layout.html');

    add({ projectRoot: dest, type: 'controller', name: 'todos' });
    assert(fs.existsSync(path.join(dest, 'app', 'controllers', 'todos.controller.html')), 'add controller creates controller file');

    add({ projectRoot: dest, type: 'action', name: 'markDone', flags: { controller: 'todos' } });
    const ctrlContent = fs.readFileSync(path.join(dest, 'app', 'controllers', 'todos.controller.html'), 'utf8');
    assert(ctrlContent.includes('kite-action name="markDone"'), 'add action appends <kite-action> to controller');

    // Flags: --force
    fs.writeFileSync(path.join(dest, 'app', 'models', 'todos.model.html'), '/* custom */', 'utf8');
    add({ projectRoot: dest, type: 'model', name: 'todos', flags: { force: true } });
    const forcedContent = fs.readFileSync(path.join(dest, 'app', 'models', 'todos.model.html'), 'utf8');
    assert(forcedContent.includes('kite-model name="todos"'), '--force overwrites existing file');

    // Flags: --no-include
    const indexBefore = fs.readFileSync(path.join(dest, 'public', 'index.html'), 'utf8');
    add({ projectRoot: dest, type: 'component', name: 'isolated-card', flags: { 'no-include': true } });
    const indexAfter = fs.readFileSync(path.join(dest, 'public', 'index.html'), 'utf8');
    assert(indexBefore === indexAfter, '--no-include prevents index.html modification');

    // Flags: --no-comment
    add({ projectRoot: dest, type: 'model', name: 'raw-model', flags: { 'no-comment': true } });
    const rawContent = fs.readFileSync(path.join(dest, 'app', 'models', 'raw-model.model.html'), 'utf8');
    assert(!rawContent.startsWith('<!--'), '--no-comment omits header comment');

    // Management: listProjectPieces, findPiece, renamePiece, removePiece
    const { listProjectPieces, findPiece, renamePiece, removePiece, handleConfig, showInfo } = await import('../bin/lib/manage.js');

    // list & find shouldn't throw
    listProjectPieces({ projectRoot: dest });
    findPiece({ projectRoot: dest, query: 'todos' });
    showInfo({ projectRoot: dest, rootDir: path.resolve(dest, '..') });

    // config get and set
    handleConfig({ projectRoot: dest, key: 'theme', value: '"dark"' });
    assert(fs.existsSync(path.join(dest, 'kite.config.json')), 'handleConfig creates kite.config.json');

    // renamePiece
    renamePiece({ projectRoot: dest, oldName: 'raw-model', newName: 'custom-model' });
    assert(fs.existsSync(path.join(dest, 'app', 'models', 'custom-model.model.html')), 'renamePiece renames target file');

    // removePiece
    removePiece({ projectRoot: dest, target: 'custom-model' });
    assert(!fs.existsSync(path.join(dest, 'app', 'models', 'custom-model.model.html')), 'removePiece deletes target file');

    // Duplicate add should not overwrite without force
    const before = fs.readFileSync(path.join(dest, 'app', 'views', 'todos.view.html'), 'utf8');
    add({ projectRoot: dest, type: 'view', name: 'todos' });
    const after = fs.readFileSync(path.join(dest, 'app', 'views', 'todos.view.html'), 'utf8');
    assert(before === after, 'add does not overwrite existing file without --force');
  } finally {
    rmDir(dest);
  }
});

// 30. Production Build & Include Inlining
group('Production Build & Include Inlining', async () => {
  const { build } = await import('../bin/lib/build.js');

  const src = tmpDir();
  const out = tmpDir();
  try {
    // Seed project
    fs.mkdirSync(path.join(src, 'public'));
    fs.mkdirSync(path.join(src, 'app', 'views'), { recursive: true });
    fs.mkdirSync(path.join(src, 'styles'));

    const partialHtml = '<div>Hello from partial</div>';
    fs.writeFileSync(path.join(src, 'app', 'views', 'hello.view.html'), partialHtml, 'utf8');

    const indexHtml = `<!DOCTYPE html><html><body><kite-include src="/app/views/hello.view.html"></kite-include></body></html>`;
    fs.writeFileSync(path.join(src, 'public', 'index.html'), indexHtml, 'utf8');
    fs.writeFileSync(path.join(src, 'styles', 'app.css'), 'body { color: red; }', 'utf8');

    const { outPath, files } = await build({ projectRoot: src, outDir: out, minify: false });

    assert(fs.existsSync(path.join(out, 'index.html')), 'build outputs dist/index.html');
    const builtHtml = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    assert(builtHtml.includes('Hello from partial'), 'build inlines <kite-include> content');
    assert(!builtHtml.includes('<kite-include'), 'build removes <kite-include> tags after inlining');
    assert(fs.existsSync(path.join(out, 'styles', 'app.css')), 'build copies styles/ assets');
    assert(files.length > 0, 'build returns non-empty file summary');
  } finally {
    rmDir(src);
    rmDir(out);
  }
});

// 31. Project Doctor Diagnostics
group('Project Doctor Diagnostics', async () => {
  const { doctor } = await import('../bin/lib/doctor.js');

  // Valid project
  const validDir = tmpDir();
  try {
    fs.mkdirSync(path.join(validDir, 'public'));
    fs.writeFileSync(
      path.join(validDir, 'public', 'index.html'),
      `<!DOCTYPE html><html><body><kite-outlet></kite-outlet></body></html>`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(validDir, 'package.json'),
      JSON.stringify({ dependencies: { '@kitelet/core': '^1.0.0' } }),
      'utf8'
    );

    const { errors: validErrors, warnings: validWarnings } = doctor({ projectRoot: validDir });
    assert(validErrors === 0, 'doctor reports 0 errors on valid project');
    assert(validWarnings === 0, 'doctor reports 0 warnings on valid project');
  } finally {
    rmDir(validDir);
  }

  // Missing index.html
  const missingIndex = tmpDir();
  try {
    fs.writeFileSync(
      path.join(missingIndex, 'package.json'),
      JSON.stringify({ dependencies: { '@kitelet/core': '^1.0.0' } }),
      'utf8'
    );
    const { errors } = doctor({ projectRoot: missingIndex });
    assert(errors > 0, 'doctor reports error when public/index.html is missing');
  } finally {
    rmDir(missingIndex);
  }

  // Missing kite-outlet
  const noOutlet = tmpDir();
  try {
    fs.mkdirSync(path.join(noOutlet, 'public'));
    fs.writeFileSync(
      path.join(noOutlet, 'public', 'index.html'),
      `<!DOCTYPE html><html><body></body></html>`,
      'utf8'
    );
    const { warnings } = doctor({ projectRoot: noOutlet });
    assert(warnings > 0, 'doctor warns when <kite-outlet> is missing');
  } finally {
    rmDir(noOutlet);
  }
});

// 32. CLI eject — Built-in Module Extraction
group('CLI eject — Built-in Module Extraction', async () => {
  const dest = tmpDir();
  try {
    // Simulate eject by copying a known src file
    const srcFile = path.join(KITE_ROOT, 'src', 'directives', 'text.js');
    assert(fs.existsSync(srcFile), 'text.js directive source exists for eject');

    const outDir = path.join(dest, 'kite-extensions');
    fs.mkdirSync(outDir, { recursive: true });
    const destFile = path.join(outDir, 'text.js');
    fs.copyFileSync(srcFile, destFile);

    assert(fs.existsSync(destFile), 'eject copies directive source to kite-extensions/');
    const ejectedContent = fs.readFileSync(destFile, 'utf8');
    assert(ejectedContent.length > 0, 'ejected file is non-empty');
    assert(ejectedContent.includes('export'), 'ejected file contains ES module exports');
  } finally {
    rmDir(dest);
  }
});

// 33. Zero-Eval Parsing, Deep Path Access & Comments
group('Zero-Eval Parsing, Deep Paths & Comments', () => {
  // Comments and method shorthand in model body
  const parsed = parseModelBody(`{
    // Single-line comment
    /* Multi-line
       comment block */
    count: 10,
    double() {
      return this.count * 2;
    },
    add(n) {
      this.count += n;
      return this.count;
    }
  }`);

  assert(parsed.count === 10, 'Parses object literal containing single-line and multi-line comments');
  assert(typeof parsed.double === 'function', 'Parses method shorthand without new Function()');
  assert(parsed.double() === 20, 'Method executes safely and returns computed expression result');
  assert(parsed.add(5) === 15, 'Method accepts arguments and mutates state via this');
  assert(parsed.count === 15, 'State mutation is preserved');

  // Deep dot-path access on Kite.get and Kite.set
  const userModel = registerModel('userProfile', {
    details: {
      address: {
        city: 'Tokyo'
      }
    }
  });

  assert(Kite.get('userProfile', 'details.address.city') === 'Tokyo', 'Kite.get traverses nested dot paths');
  Kite.set('userProfile', 'details.address.city', 'Kyoto');
  assert(userModel.details.address.city === 'Kyoto', 'Kite.set updates nested dot paths');
});

// 34. CLI Command Line Dispatcher & Shortcuts
group('CLI Command Line Dispatcher & Shortcuts', () => {
  const stripAnsi = s => s.replace(/\x1b\[[0-9;]*m/g, '');
  const cliBin = path.join(KITE_ROOT, 'bin', 'kite.js');
  const tempProject = tmpDir();

  try {
    // 1. kite new
    const newOutput = execSync(`node "${cliBin}" new demo-app --template starter`, {
      cwd: tempProject,
      encoding: 'utf8'
    });
    assert(stripAnsi(newOutput).includes('Creating "demo-app"'), 'kite new scaffolds project');
    const projectDir = path.join(tempProject, 'demo-app');
    assert(fs.existsSync(path.join(projectDir, 'package.json')), 'kite new creates package.json');

    // 2. kite make:component
    const compOutput = execSync(`node "${cliBin}" make:component custom-card`, {
      cwd: projectDir,
      encoding: 'utf8'
    });
    const strippedComp = stripAnsi(compOutput);
    assert(strippedComp.includes('Created  app\\components\\custom-card.component.html') || strippedComp.includes('Created  app/components/custom-card.component.html'), 'make:component creates component file');
    assert(fs.existsSync(path.join(projectDir, 'app', 'components', 'custom-card.component.html')), 'component file exists on disk');

    // 3. Shortcuts: g:v, g:m, g:ct, g:r, g:p
    execSync(`node "${cliBin}" g:v profile`, { cwd: projectDir, encoding: 'utf8' });
    assert(fs.existsSync(path.join(projectDir, 'app', 'views', 'profile.view.html')), 'g:v creates view file');

    execSync(`node "${cliBin}" g:m profile`, { cwd: projectDir, encoding: 'utf8' });
    assert(fs.existsSync(path.join(projectDir, 'app', 'models', 'profile.model.html')), 'g:m creates model file');

    execSync(`node "${cliBin}" g:ct profile`, { cwd: projectDir, encoding: 'utf8' });
    assert(fs.existsSync(path.join(projectDir, 'app', 'controllers', 'profile.controller.html')), 'g:ct creates controller file');

    execSync(`node "${cliBin}" g:r /profile`, { cwd: projectDir, encoding: 'utf8' });
    const routesHtml = fs.readFileSync(path.join(projectDir, 'app', 'routes', 'routes.html'), 'utf8');
    assert(routesHtml.includes('path="/profile"'), 'g:r appends route');

    execSync(`node "${cliBin}" g:p tracker`, { cwd: projectDir, encoding: 'utf8' });
    assert(fs.existsSync(path.join(projectDir, 'plugins', 'tracker.js')), 'g:p creates plugin file');

    // 4. Management: list, find, rename, remove
    const listOut = execSync(`node "${cliBin}" list`, { cwd: projectDir, encoding: 'utf8' });
    assert(listOut.includes('Components') && listOut.includes('custom-card.component.html'), 'kite list outputs components');

    const findOut = execSync(`node "${cliBin}" find profile`, { cwd: projectDir, encoding: 'utf8' });
    assert(findOut.includes('profile.view.html'), 'kite find outputs matches');

    const renameOut = execSync(`node "${cliBin}" rename tracker audit-log`, { cwd: projectDir, encoding: 'utf8' });
    assert(stripAnsi(renameOut).includes('Renamed: tracker.js → audit-log.js'), 'kite rename renames asset');
    assert(fs.existsSync(path.join(projectDir, 'plugins', 'audit-log.js')), 'renamed plugin exists');

    const removeOut = execSync(`node "${cliBin}" remove audit-log`, { cwd: projectDir, encoding: 'utf8' });
    const strippedRemove = stripAnsi(removeOut);
    assert(strippedRemove.includes('Removed file: plugins/audit-log.js') || strippedRemove.includes('Removed file: plugins\\audit-log.js'), 'kite remove deletes asset');
    assert(!fs.existsSync(path.join(projectDir, 'plugins', 'audit-log.js')), 'removed plugin no longer exists');

    // 5. info command
    const infoOut = execSync(`node "${cliBin}" info`, { cwd: projectDir, encoding: 'utf8' });
    assert(infoOut.includes('Kite Core Version'), 'kite info displays system information');
  } finally {
    rmDir(tempProject);
  }
});

// Security & Prototype Pollution Hardening Tests
group('Security & Prototype Pollution Hardening', () => {
  const scope = createScope({ user: { name: 'Ada' } });

  // 1. Prototype pollution on Scope proxy
  try {
    scope['__proto__'] = { polluted: true };
  } catch (_) {}
  assert(Object.prototype.polluted === undefined, 'scope.__proto__ assignment blocked without polluting Object.prototype');
  assert(scope['__proto__'] === undefined, 'scope.__proto__ read returns undefined');

  try {
    scope.constructor.prototype.polluted = true;
  } catch (_) {}
  assert(Object.prototype.polluted === undefined, 'scope.constructor access returns undefined');

  // 2. Prototype pollution via kite-model two-way binding
  const mockInput = {
    tagName: 'input',
    type: 'text',
    value: 'pwned',
    addEventListener: () => {},
    removeEventListener: () => {}
  };
  modelDirective(mockInput, '__proto__.hacked', scope);
  assert(Object.prototype.hacked === undefined, 'kite-model="__proto__.hacked" write blocked');

  modelDirective(mockInput, 'constructor.prototype.hacked', scope);
  assert(Object.prototype.hacked === undefined, 'kite-model="constructor.prototype.hacked" write blocked');

  // 3. Nested object pollution inside scope
  try {
    scope.user['__proto__'] = { nestedPolluted: true };
  } catch (_) {}
  assert(Object.prototype.nestedPolluted === undefined, 'nested object proxy blocks __proto__ assignment');
});

// Build Artifact Verification
group('Production Build & Asset Pipeline', () => {
  const distCss = path.join(KITE_ROOT, 'dist', 'kite.css');
  const distJs = path.join(KITE_ROOT, 'dist', 'kite.min.js');

  assert(fs.existsSync(distCss), 'dist/kite.css exists');
  assert(fs.existsSync(distJs), 'dist/kite.min.js exists');

  if (fs.existsSync(distCss)) {
    const cssContent = fs.readFileSync(distCss, 'utf8');
    assert(cssContent.includes('[kite-cloak]'), 'dist/kite.css contains [kite-cloak]');
    assert(cssContent.includes('kite-config'), 'dist/kite.css contains kite-config');
  }

  const docsBanner = path.join(KITE_ROOT, 'docs', 'assets', 'kite-banner.svg');
  assert(fs.existsSync(docsBanner), 'docs/assets/kite-banner.svg exists for portal deployment');
});

// 34. Kite v1.0.0 Resolution Verification
await group('Kite v1.0.0 Resolution Before Deployment', async () => {
  // 1. Tagline and Category in README and package.json
  const readmePath = path.join(KITE_ROOT, 'README.md');
  const readme = fs.readFileSync(readmePath, 'utf8');
  assert(readme.includes('HTML is enough for small things.'), 'README.md contains new honest tagline');
  assert(readme.includes('teaching toolkit'), 'README.md positions Kite as a teaching toolkit');

  const pkgPath = path.join(KITE_ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert(pkg.description.includes('HTML is enough for small things.'), 'package.json description contains honest tagline');
  assert(pkg.keywords.includes('toolkit'), 'package.json keywords include toolkit');

  // 2. Organized documentation tiers and files
  const tier1 = path.join(KITE_ROOT, 'docs', '1-basics');
  const tier2 = path.join(KITE_ROOT, 'docs', '2-architecture');
  const tier3 = path.join(KITE_ROOT, 'docs', '3-internals');
  const tier4 = path.join(KITE_ROOT, 'docs', '4-guides');

  assert(fs.existsSync(tier1), 'docs/1-basics tier exists');
  assert(fs.existsSync(tier2), 'docs/2-architecture tier exists');
  assert(fs.existsSync(tier3), 'docs/3-internals tier exists');
  assert(fs.existsSync(tier4), 'docs/4-guides tier exists');

  const limitsPath = path.join(tier1, 'limits.md');
  const gradPath = path.join(tier4, 'graduating.md');
  assert(fs.existsSync(limitsPath), 'docs/1-basics/limits.md exists');
  assert(fs.existsSync(gradPath), 'docs/4-guides/graduating.md exists');

  const limitsContent = fs.readFileSync(limitsPath, 'utf8');
  assert(limitsContent.includes('< 500'), 'limits.md documents <500 comfortable node limit');
  assert(limitsContent.includes('< 20'), 'limits.md documents <20 model limit');

  const gradContent = fs.readFileSync(gradPath, 'utf8');
  assert(gradContent.includes('Lit') && gradContent.includes('Alpine') && gradContent.includes('Vue'), 'graduating.md documents migration destinations');

  const securityContent = fs.readFileSync(path.join(tier3, 'security.md'), 'utf8');
  assert(securityContent.includes('Keeping Your Apps Safe'), 'security.md has friendly educational title');

  // 3. Scale Analyzer in doctor.js
  const { analyzeScale } = await import('../bin/lib/doctor.js');
  assert(typeof analyzeScale === 'function', 'doctor.js exports analyzeScale function');
  const scaleResult = analyzeScale(KITE_ROOT);
  assert(typeof scaleResult.interactiveNodes === 'number', 'analyzeScale calculates interactive node count');

  // 4. Build Presets in build.js
  const { resolveDirectives, PRESETS } = await import('../bin/lib/build.js');
  assert(Array.isArray(PRESETS.minimal) && PRESETS.minimal.includes('text'), 'PRESETS.minimal includes text directive');
  assert(resolveDirectives({ preset: 'minimal' }).includes('for'), 'resolveDirectives handles minimal preset');
  assert(resolveDirectives({ only: 'text, on' }).length === 2, 'resolveDirectives handles custom only flag');

  // 5. Smart Typo Detection in log.js
  const { findClosest } = await import('../src/utils/log.js');
  assert(typeof findClosest === 'function', 'log.js exports findClosest');
  const guess = findClosest('fro', ['text', 'for', 'if']);
  assert(guess === 'for', 'findClosest("fro") returns "for"');

  // 6. Editor Tooling Packages
  const vscodePkg = path.join(KITE_ROOT, 'tools', 'vscode-kite', 'package.json');
  const eslintPkg = path.join(KITE_ROOT, 'tools', 'eslint-plugin-kite', 'package.json');
  const lspPkg = path.join(KITE_ROOT, 'tools', 'kite-language-server', 'package.json');

  assert(fs.existsSync(vscodePkg), 'tools/vscode-kite/package.json exists');
  assert(fs.existsSync(eslintPkg), 'tools/eslint-plugin-kite/package.json exists');
  assert(fs.existsSync(lspPkg), 'tools/kite-language-server/package.json exists');

  // 7. Language Server Analyzer
  const { analyzeProject } = await import('../tools/kite-language-server/index.js');
  assert(typeof analyzeProject === 'function', 'kite-language-server exports analyzeProject');
  const lspResult = analyzeProject(KITE_ROOT);
  assert(Array.isArray(lspResult.diagnostics), 'kite-language-server produces diagnostics array');
});

// 42. Kite v1.0.0 Reliability Test Suite & Markup Convention
await group('Kite v1.0.0 Reliability Test Suite & Markup Convention', async () => {
  // 1. Null scope: No crash, warning logged, returns undefined
  const r1 = evaluateExpression('foo', null);
  assert(r1 === undefined, '1. Null scope: evaluateExpression guards against null scope without throwing');

  // 2. Missing model: Warning logged, view renders empty / skips
  const fakeInput = { tagName: 'INPUT', type: 'text', value: 'hi' };
  const cleanupModel = modelDirective(fakeInput, 'user.name', null);
  assert(typeof cleanupModel === 'function', '2. Missing model: modelDirective guards against null scope safely');

  // 3. Bad expression: Warning logged, no binding, page alive
  const r3 = evaluateExpression('(((bad (syntax', {});
  assert(r3 === undefined, '3. Bad expression: syntax errors safely caught without throwing');

  // 4. Failed fetch: model.error set, promise rejectable
  const fakeModel = { loading: false, error: null };
  const client = new ApiClient({ base: 'https://invalid-nonexistent-domain-xyz.local' });
  const bound = client.createBoundApi(fakeModel);
  try {
    client.request = async () => { throw new Error('Network error 500'); };
    await bound.get('/items');
    assert(false, 'Should have thrown error');
  } catch (err) {
    assert(fakeModel.error === 'Network error 500', '4. Failed fetch: sets model.error reactively');
  }

  // 5. Missing include: Placeholder rendered, page alive
  const { processInclude } = await import('../src/core/include.js');
  let replacedWith = null;
  const fakeIncludeEl = {
    getAttribute: (attr) => attr === 'src' ? 'missing-file-404.html' : null,
    parentNode: {
      replaceChild: (newChild, oldChild) => { replacedWith = newChild; }
    }
  };
  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 404, statusText: 'Not Found' });
  await processInclude(fakeIncludeEl, null);
  globalThis.fetch = origFetch;
  assert(replacedWith && (replacedWith.nodeType === 8 || (replacedWith.nodeValue && replacedWith.nodeValue.includes('failed'))), '5. Missing include: placeholder comment rendered on 404');

  // 6. Circular component: Depth guard triggers, warning, stops
  const { mountComponent } = await import('../src/components/use.js');
  function makeMockUse(name) {
    const el = {
      nodeType: 1,
      tagName: 'KITE-USE',
      getAttribute: (a) => a === 'name' ? name : null,
      attributes: [{ name: 'name', value: name }],
      innerHTML: '',
      children: [],
      appendChild: (child) => el.children.push(child),
      get firstElementChild() { return el.children[0] || null; },
      cloneNode: () => makeMockUse(name),
      nextElementSibling: null
    };
    return el;
  }
  const childMock = makeMockUse('circular-self');
  registerComponent('circular-self', {
    template: {
      content: {
        nodeType: 11,
        childNodes: [childMock],
        cloneNode: () => ({ nodeType: 11, childNodes: [makeMockUse('circular-self')] })
      }
    }
  });
  const fakeHost = makeMockUse('circular-self');
  const recursiveScan = (el) => mountComponent(el, null, recursiveScan);
  mountComponent(fakeHost, null, recursiveScan);
  function findPrevented(node) {
    if (node.innerHTML && node.innerHTML.includes('circular component prevented')) return true;
    return (node.children || []).some(findPrevented);
  }
  assert(findPrevented(fakeHost), '6. Circular component: depth guard prevents infinite recursion');

  // 7. Infinite kite-for: Depth limit triggers
  const { forDirective } = await import('../src/directives/for.js');
  let insertedCount = 0;
  const fakeParent = {
    insertBefore: () => { insertedCount++; },
    removeChild: () => {}
  };
  const fakeForEl = {
    tagName: 'DIV',
    parentNode: fakeParent,
    cloneNode: () => ({ nodeType: 1, removeAttribute: () => {}, cloneNode: () => ({ nodeType: 1 }) })
  };
  forDirective(fakeForEl, 'i in 1..5000', {});
  assert(insertedCount <= 2001, '7. Infinite kite-for: loop iterations capped at 2000 items');

  // 8. Malformed JSON: Falls back to {}
  const malformedObj = parseObjectLiteral(null);
  assert(typeof malformedObj === 'object' && Object.keys(malformedObj).length === 0, '8. Malformed JSON: falls back to empty object {}');

  // 9. Missing route: falls through or matches wildcard
  registerRoute('/*', 'not-found-view');
  const matchedWildcard = matchRoute('/unregistered/route/path');
  assert(matchedWildcard && matchedWildcard.route.viewName === 'not-found-view', '9. Missing route: wildcard 404 route matched cleanly');

  // 10. Unknown directive: Warning logged, ignored
  const { parseElementDirectives } = await import('../src/core/parser.js');
  const fakeUnknownEl = {
    tagName: 'BUTTON',
    attributes: [
      { name: 'kite-fro', value: 'item in items' }
    ]
  };
  const parsedDirectives = parseElementDirectives(fakeUnknownEl);
  assert(parsedDirectives.length === 0, '10. Unknown directive: safely ignored without crashing element');

  // 11. Format & 9-Slot Markup Convention
  const { sortAttributesInTag, formatMarkup, getAttrSlot } = await import('../bin/lib/format.js');
  assert(getAttrSlot('id') === 1, 'Slot 1: Identity');
  assert(getAttrSlot('kite-scope') === 2, 'Slot 2: State');
  assert(getAttrSlot('kite-model') === 3, 'Slot 3: Data-in');
  assert(getAttrSlot('kite-text') === 4, 'Slot 4: Render');
  assert(getAttrSlot('kite-if') === 5, 'Slot 5: Control');
  assert(getAttrSlot('kite-on-click') === 6, 'Slot 6: Events');
  assert(getAttrSlot('kite-on-mount') === 7, 'Slot 7: Lifecycle');
  assert(getAttrSlot('kite-skip') === 8, 'Slot 8: Escape');
  assert(getAttrSlot('kite-config:debounce') === 9, 'Slot 9: Config');

  const unorderedTag = '<div kite-on-click="run()" id="card" kite-text="msg" kite-scope="{}" class="box">';
  const sortedTag = sortAttributesInTag(unorderedTag);
  assert(sortedTag === '<div id="card" class="box" kite-scope="{}" kite-text="msg" kite-on-click="run()">', 'sortAttributesInTag orders attributes to 9-slot convention');

  // 12. ESLint Rule: prefer-attribute-order
  const eslintModule = await import('../tools/eslint-plugin-kite/index.js');
  assert('prefer-attribute-order' in eslintModule.rules, 'ESLint plugin includes prefer-attribute-order rule');
  assert(eslintModule.configs.recommended.rules['kite/prefer-attribute-order'] === 'off', 'prefer-attribute-order is off by default in recommended config');

  // 13. Documentation files
  assert(fs.existsSync(path.join(KITE_ROOT, 'docs', '1-basics', 'markup.md')), 'docs/1-basics/markup.md exists');
  assert(fs.existsSync(path.join(KITE_ROOT, 'docs', '4-guides', 'stability.md')), 'docs/4-guides/stability.md exists');
  assert(fs.existsSync(path.join(KITE_ROOT, 'docs', '1-basics', 'styling.md')), 'docs/1-basics/styling.md exists');
  assert(fs.existsSync(path.join(KITE_ROOT, 'docs', '2-architecture', 'reusable-components.md')), 'docs/2-architecture/reusable-components.md exists');

  // 14. CLI Scaffolding with --styled flag
  const { TYPE_MAP } = await import('../bin/lib/add.js');
  const normalComp = TYPE_MAP.component.template('my-card', false, {});
  assert(!normalComp.includes('kite-shadow') && !normalComp.includes('<style>'), 'Normal component has no shadow DOM or inline style');

  const styledComp = TYPE_MAP.component.template('my-card', false, { styled: true });
  assert(styledComp.includes('kite-shadow'), 'Styled component has kite-shadow');
  assert(styledComp.includes('<style>') && styledComp.includes(':host'), 'Styled component includes scoped :host style block');

  const shortStyledComp = TYPE_MAP.component.template('my-card', false, { s: true });
  assert(shortStyledComp.includes('kite-shadow'), 'Styled component with -s flag has kite-shadow');

  // 15. Universal Styling & Reusability Examples
  const expectedExamples = [
    'styling/styling-tailwind.html',
    'styling/styling-bootstrap.html',
    'styling/styling-vanilla.html',
    'styling/styling-mixed.html',
    'architecture/reusable-field.html',
    'architecture/reusable-table.html',
    'architecture/reusable-mvcr-app.html',
    'laravel/laravel-csrf.blade.php',
    'laravel/laravel-sanctum.blade.php',
    'laravel/laravel-livewire.blade.php',
    'laravel/laravel-flash.blade.php'
  ];
  for (const ex of expectedExamples) {
    assert(fs.existsSync(path.join(KITE_ROOT, 'examples', ex)), `examples/${ex} exists`);
  }

  // 16. Laravel Full Guide & Project
  assert(fs.existsSync(path.join(KITE_ROOT, 'docs', '4-guides', 'laravel.md')), 'docs/4-guides/laravel.md exists');
  assert(fs.existsSync(path.join(KITE_ROOT, 'examples', 'laravel-todo', 'resources', 'views', 'todos.blade.php')), 'laravel-todo todos view exists');
  assert(fs.existsSync(path.join(KITE_ROOT, 'examples', 'laravel-todo', 'routes', 'api.php')), 'laravel-todo api routes exist');

  // 17. Shared Styling & Examples Gallery
  assert(fs.existsSync(path.join(KITE_ROOT, 'examples', 'shared.css')), 'examples/shared.css exists');
  assert(fs.existsSync(path.join(KITE_ROOT, 'examples', 'index.html')), 'examples/index.html exists');
  const sharedCssContent = fs.readFileSync(path.join(KITE_ROOT, 'examples', 'shared.css'), 'utf8');
  assert(sharedCssContent.includes('--kite-bg'), 'shared.css defines theme custom properties');
  assert(sharedCssContent.includes('.kite-footer'), 'shared.css includes footer styling');

  // 18. Dashboard Template Scaffolding
  assert(fs.existsSync(path.join(TEMPLATES_DIR, 'dashboard', 'public', 'index.html')), 'dashboard template has public/index.html');
  assert(fs.existsSync(path.join(TEMPLATES_DIR, 'dashboard', 'styles', 'app.css')), 'dashboard template has styles/app.css');
  assert(fs.existsSync(path.join(TEMPLATES_DIR, 'dashboard', 'app', 'models', 'dashboard.model.html')), 'dashboard template has dashboard.model.html');
  assert(fs.existsSync(path.join(TEMPLATES_DIR, 'dashboard', 'app', 'components', 'stat-card.component.html')), 'dashboard template has stat-card component');

  // 19. Categorized Examples Organization & Creator Banner Kit
  assert(fs.existsSync(path.join(KITE_ROOT, 'examples', 'basics', 'counter.html')), 'examples/basics/counter.html exists');
  assert(fs.existsSync(path.join(KITE_ROOT, 'examples', 'basics', 'todo.html')), 'examples/basics/todo.html exists');
  assert(fs.existsSync(path.join(KITE_ROOT, 'examples', 'basics', 'crud.html')), 'examples/basics/crud.html exists');
  assert(fs.existsSync(path.join(KITE_ROOT, 'docs', '4-guides', 'crud.md')), 'docs/4-guides/crud.md exists');
  assert(fs.existsSync(path.join(KITE_ROOT, 'examples', 'architecture', 'reusable-mvcr-app.html')), 'examples/architecture/reusable-mvcr-app.html exists');
  assert(fs.existsSync(path.join(KITE_ROOT, 'examples', 'styling', 'styling-vanilla.html')), 'examples/styling/styling-vanilla.html exists');
  assert(fs.existsSync(path.join(KITE_ROOT, 'examples', 'advanced', 'api-fetch.html')), 'examples/advanced/api-fetch.html exists');
  assert(fs.existsSync(path.join(KITE_ROOT, 'examples', 'laravel', 'laravel-csrf.blade.php')), 'examples/laravel/laravel-csrf.blade.php exists');
  const indexHtml = fs.readFileSync(path.join(KITE_ROOT, 'examples', 'index.html'), 'utf8');
  assert(indexHtml.includes('Creator Banner Kit'), 'index.html contains Creator Banner Kit section');
  assert(indexHtml.includes('code-html') && indexHtml.includes('code-md'), 'index.html contains copyable banner snippets');
  assert(indexHtml.includes('crud.html'), 'index.html links to full CRUD example');

  // 20. Plugin Auto-Install
  let pluginExecuted = false;
  Kite.plugin('auto-installed-test-plugin', (k) => {
    pluginExecuted = true;
    k.helper('testAutoHelper', (val) => String(val).toUpperCase());
  });
  assert(pluginExecuted, 'Kite.plugin auto-executes installer without requiring explicit use call');
  assert(typeof Kite.helpers.testAutoHelper === 'function', 'Plugin helper registered immediately');
});

// 21. Agentic-Ready Toolkit Verification
group('Agentic-Ready Toolkit', () => {
  // 1. Master agent orientation files
  assert(fs.existsSync(path.join(KITE_ROOT, 'AGENTS.md')), 'AGENTS.md exists at project root');
  assert(fs.existsSync(path.join(KITE_ROOT, 'llms.txt')), 'llms.txt exists at project root');
  assert(fs.existsSync(path.join(KITE_ROOT, 'llms-full.txt')), 'llms-full.txt exists at project root');

  const agentsMd = fs.readFileSync(path.join(KITE_ROOT, 'AGENTS.md'), 'utf8');
  assert(agentsMd.includes('# Kite — Agent Guide'), 'AGENTS.md contains Kite Agent Guide header');
  assert(agentsMd.includes('.kite/capabilities.json'), 'AGENTS.md references capabilities.json');
  assert(agentsMd.includes('.kite/rules.json'), 'AGENTS.md references rules.json');
  assert(agentsMd.includes('kite-fro'), 'AGENTS.md has explicit what-not-to-do section');

  const llmsTxt = fs.readFileSync(path.join(KITE_ROOT, 'llms.txt'), 'utf8');
  assert(llmsTxt.includes('llms-full.txt'), 'llms.txt links to full corpus');

  const llmsFull = fs.readFileSync(path.join(KITE_ROOT, 'llms-full.txt'), 'utf8');
  assert(llmsFull.length > 50000, `llms-full.txt contains complete documentation corpus (${llmsFull.length} bytes)`);

  // 2. Machine-readable metadata in .kite/
  const metaFiles = ['manifest.json', 'capabilities.json', 'rules.json', 'conventions.json', 'limits.json'];
  for (const file of metaFiles) {
    const filePath = path.join(KITE_ROOT, '.kite', file);
    assert(fs.existsSync(filePath), `.kite/${file} exists`);
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      assert(typeof parsed.$schema === 'string', `.kite/${file} defines $schema`);
    } catch (e) {
      assert(false, `.kite/${file} is valid JSON: ${e.message}`);
    }
  }

  // 3. Draft-07 JSON Schemas
  const schemaFiles = [
    'manifest-1.0.json',
    'capabilities-1.0.json',
    'rules-1.0.json',
    'conventions-1.0.json',
    'limits-1.0.json'
  ];
  for (const s of schemaFiles) {
    const schemaPath = path.join(KITE_ROOT, '.kite', 'schemas', s);
    assert(fs.existsSync(schemaPath), `.kite/schemas/${s} exists`);
    try {
      const parsedSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      assert(parsedSchema.$schema && parsedSchema.$schema.includes('json-schema.org'), `.kite/schemas/${s} is valid JSON schema`);
    } catch (e) {
      assert(false, `.kite/schemas/${s} parses cleanly`);
    }
  }

  // 4. IDE-specific configuration files
  assert(fs.existsSync(path.join(KITE_ROOT, 'CLAUDE.md')), 'CLAUDE.md exists');
  assert(fs.existsSync(path.join(KITE_ROOT, '.cursorrules')), '.cursorrules exists');
  assert(fs.existsSync(path.join(KITE_ROOT, '.github', 'copilot-instructions.md')), '.github/copilot-instructions.md exists');
  assert(fs.existsSync(path.join(KITE_ROOT, '.windsurfrules')), '.windsurfrules exists');
  assert(fs.existsSync(path.join(KITE_ROOT, '.aider.conf.yml')), '.aider.conf.yml exists');
  assert(fs.existsSync(path.join(KITE_ROOT, '.continue', 'config.json')), '.continue/config.json exists');

  // 5. Verification through checkAgenticFiles
  const checkRes = checkAgenticFiles({ projectRoot: KITE_ROOT, verbose: false });
  assert(checkRes.errors === 0, `kite agentic:check passes with 0 errors (errors: ${checkRes.errors})`);

  // 6. Project scaffolding with buildAgenticFiles
  const testScaffoldDir = tmpDir();
  try {
    const scaffoldRes = buildAgenticFiles({ projectRoot: testScaffoldDir });
    assert(scaffoldRes.success === true, 'buildAgenticFiles succeeds on new target directory');
    assert(fs.existsSync(path.join(testScaffoldDir, 'AGENTS.md')), 'scaffolded project has AGENTS.md');
    assert(fs.existsSync(path.join(testScaffoldDir, '.kite', 'manifest.json')), 'scaffolded project has .kite/manifest.json');
    assert(fs.existsSync(path.join(testScaffoldDir, '.kite', 'capabilities.json')), 'scaffolded project has .kite/capabilities.json');
    assert(fs.existsSync(path.join(testScaffoldDir, 'llms.txt')), 'scaffolded project has llms.txt');
    assert(fs.existsSync(path.join(testScaffoldDir, 'CLAUDE.md')), 'scaffolded project has CLAUDE.md');
    assert(fs.existsSync(path.join(testScaffoldDir, '.cursorrules')), 'scaffolded project has .cursorrules');
  } finally {
    rmDir(testScaffoldDir);
  }
});

// Summary
console.log(`\n========================================`);
console.log(`Tests Completed: ${passed + failed}`);
console.log(`Passed: \x1b[32m${passed}\x1b[0m`);
console.log(`Failed: \x1b[31m${failed}\x1b[0m`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log(`\x1b[32mAll headless tests passed successfully! 🪁\x1b[0m\n`);
}

