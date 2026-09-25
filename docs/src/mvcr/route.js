/**
 * @file Router and Outlet primitives for Kite MVCR architecture.
 * @module mvcr/route
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Provides zero-JS hash routing via `<kite-route>` and `<kite-outlet>`.
 * Supports dynamic route parameters (`/users/:id`), route guards (`guard="isLoggedIn"`),
 * view swapping, and automatic unbinder teardown on route transitions.
 *
 * @example
 * <kite-route path="/" view="home-view"></kite-route>
 * <kite-route path="/users/:id" view="user-view" guard="isLoggedIn" redirect="/login"></kite-route>
 * <kite-outlet></kite-outlet>
 */

import { getView } from './view.js';
import { getModel, getAllModels } from './model.js';
import { globalStore } from '../core/store.js';
import { createScope } from '../core/scope.js';
import { evaluateExpression } from '../utils/expr.js';
import { warn } from '../utils/log.js';

/**
 * @typedef {Object} RouteEntry
 * @property {string} path - Raw path pattern.
 * @property {string} viewName - Target view identifier.
 * @property {RegExp|null} regex - Compiled regex for parameterized matching.
 * @property {string[]} paramNames - List of parameter keys (e.g. ['id']).
 * @property {string|null} guard - Guard expression to evaluate.
 * @property {string|null} redirect - Redirect path if guard check fails.
 */

/**
 * List of registered routes in registration order.
 * @type {RouteEntry[]}
 */
const routeList = [];

let activeOutlet = null;
let activeUnbinder = null;
let scannerCallback = null;
let isRouterInitialized = false;

/**
 * Normalizes route path strings (strips trailing slashes, ensures leading slash).
 *
 * @param {string} p - Raw path.
 * @returns {string} Normalized path.
 */
function normalizePath(p) {
  if (!p) return '/';
  let path = p.trim();
  if (path.startsWith('#')) path = path.slice(1);
  if (!path.startsWith('/')) path = '/' + path;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path;
}

/**
 * Compiles a path pattern containing parameters (`/users/:id`) into a regular expression.
 *
 * @param {string} path - Route pattern.
 * @returns {{ regex: RegExp, paramNames: string[] }}
 */
function compileRoutePattern(path) {
  const paramNames = [];
  const pattern = path.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  const regex = new RegExp(`^${pattern}$`, 'i');
  return { regex, paramNames };
}

/**
 * Registers a route mapping a URL path to a view name with optional guard and redirect.
 *
 * @param {string} path - URL path (e.g. '/' or '/users/:id').
 * @param {string} viewName - Target view identifier.
 * @param {Object} [options={}] - Additional route configuration.
 * @param {string} [options.guard=null] - Guard expression.
 * @param {string} [options.redirect=null] - Fallback path if guard is falsy.
 */
export function registerRoute(path, viewName, options = {}) {
  const normalized = normalizePath(path);
  let regex = null;
  let paramNames = [];

  if (normalized.includes(':')) {
    const compiled = compileRoutePattern(normalized);
    regex = compiled.regex;
    paramNames = compiled.paramNames;
  }

  // Remove existing duplicate registration if present
  const existingIndex = routeList.findIndex((r) => r.path === normalized);
  const entry = {
    path: normalized,
    viewName,
    regex,
    paramNames,
    guard: options.guard || null,
    redirect: options.redirect || null
  };

  if (existingIndex !== -1) {
    routeList[existingIndex] = entry;
  } else {
    routeList.push(entry);
  }
}

/**
 * Matches a current URL path against registered routes.
 *
 * @param {string} currentPath - The active path from location hash.
 * @returns {{ route: RouteEntry, params: Object } | null}
 */
export function matchRoute(currentPath) {
  const norm = normalizePath(currentPath);

  // 1. Exact match pass
  for (const r of routeList) {
    if (!r.regex && r.path === norm) {
      return { route: r, params: {} };
    }
  }

  // 2. Parameterized regex pass
  for (const r of routeList) {
    if (r.regex) {
      const match = norm.match(r.regex);
      if (match) {
        const params = {};
        r.paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });
        return { route: r, params };
      }
    }
  }

  // 3. Fallback to 404 wildcard route ('*' or '/*')
  for (const r of routeList) {
    if (r.path === '/*' || r.path === '*') {
      return { route: r, params: {} };
    }
  }

  // 4. Fallback to '/'
  if (norm !== '/') {
    for (const r of routeList) {
      if (r.path === '/') {
        return { route: r, params: {} };
      }
    }
  }

  return null;
}

/**
 * Gets the current active route path from the browser location hash.
 *
 * @returns {string}
 */
export function getCurrentPath() {
  if (typeof window === 'undefined') return '/';
  const hash = window.location.hash || '#/';
  return normalizePath(hash);
}

/**
 * Renders the active route into the registered `<kite-outlet>`.
 */
export function renderActiveRoute() {
  if (!activeOutlet) return;

  const currentPath = getCurrentPath();
  const matched = matchRoute(currentPath);

  if (!matched) {
    if (currentPath && currentPath !== '/') {
      warn(`No route matched for path: "${currentPath}"`);
    }
    return;
  }

  const { route, params } = matched;

  // Evaluate route guard if configured
  if (route.guard) {
    // Check against active models or global state
    const allModels = getAllModels();
    const guardScope = createScope(Object.assign({}, globalStore, allModels), null, globalStore);
    const guardResult = evaluateExpression(route.guard, guardScope);
    if (!guardResult) {
      const redirectPath = route.redirect || '/';
      if (typeof window !== 'undefined') {
        window.location.hash = `#${redirectPath.startsWith('/') ? redirectPath : '/' + redirectPath}`;
      }
      return;
    }
  }

  const viewEl = getView(route.viewName);
  if (!viewEl) {
    warn(`Route "${currentPath}" points to view "${route.viewName}", but view was not found.`);
    return;
  }

  // 1. Tear down previous view unbinders
  if (typeof activeUnbinder === 'function') {
    activeUnbinder();
    activeUnbinder = null;
  }

  // 2. Clone view contents into outlet
  activeOutlet.innerHTML = '';
  const clone = viewEl.cloneNode(true);
  clone.style.display = ''; // Reveal view

  while (clone.firstChild) {
    activeOutlet.appendChild(clone.firstChild);
  }

  // 3. Bind with associated model scope or create scoped params container
  const modelName = viewEl.getAttribute('model');
  let scope = modelName ? getModel(modelName) : null;

  if (!scope && Object.keys(params).length > 0) {
    scope = createScope({ params, $params: params });
  } else if (scope) {
    scope.params = params;
    scope.$params = params;
  }

  if (typeof scannerCallback === 'function') {
    const cleanups = [];
    let child = activeOutlet.firstElementChild;
    while (child) {
      const nextSibling = child.nextElementSibling;
      const u = scannerCallback(child, scope);
      if (typeof u === 'function') cleanups.push(u);
      child = nextSibling;
    }
    activeUnbinder = () => {
      for (const u of cleanups) u();
    };
  }

  updateActiveLinks(currentPath);
}

/**
 * Updates CSS active classes on links matching the current route.
 *
 * @param {string} currentPath
 */
export function updateActiveLinks(currentPath) {
  if (typeof document === 'undefined') return;
  const norm = normalizePath(currentPath);
  const links = document.querySelectorAll('kite-link, a[kite-active-class], a[href^="#"]');

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const activeClass = link.getAttribute('kite-active-class') || 'active';
    const target = link.getAttribute('to') || (link.getAttribute('href') ? link.getAttribute('href').replace(/^#/, '') : '');
    const normTarget = normalizePath(target);

    if (normTarget === norm || (normTarget !== '/' && norm.startsWith(normTarget))) {
      link.classList.add(activeClass);
    } else {
      link.classList.remove(activeClass);
    }
  }
}

/**
 * Binds a `<kite-link>` custom element for declarative navigation.
 *
 * @param {Element} el
 */
export function processLinkElement(el) {
  el.style.cursor = 'pointer';
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const to = el.getAttribute('to') || '/';
    if (typeof window !== 'undefined') {
      window.location.hash = `#${to.startsWith('/') ? to : '/' + to}`;
    }
  });
}

/**
 * Registers an element as the active `<kite-outlet>` and mounts the initial route.
 *
 * @param {Element} outletEl - The `<kite-outlet>` DOM element.
 * @param {Function} scanElement - Scanner callback to bind mounted views.
 */
export function setOutlet(outletEl, scanElement) {
  if (activeOutlet === outletEl && isRouterInitialized) return;
  activeOutlet = outletEl;
  scannerCallback = scanElement;

  initRouter();
  renderActiveRoute();
}

/**
 * Attaches the window hashchange listener once.
 */
export function initRouter() {
  if (isRouterInitialized || typeof window === 'undefined') return;
  isRouterInitialized = true;

  window.addEventListener('hashchange', () => {
    renderActiveRoute();
  });
}

/**
 * Scans a `<kite-route>` element and registers it into the route table.
 *
 * @param {Element} el - The `<kite-route>` DOM element.
 */
export function processRouteDefinition(el) {
  const path = el.getAttribute('path');
  const view = el.getAttribute('view');
  const guard = el.getAttribute('guard') || el.getAttribute('kite-guard');
  const redirect = el.getAttribute('redirect');

  if (path && view) {
    registerRoute(path, view, { guard, redirect });
  }
  el.style.display = 'none';
}
