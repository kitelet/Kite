/**
 * TypeScript ambient type definitions for Kite Toolkit.
 */

export interface Scope {
  [key: string]: any;
  $watch?: (key: string, callback: (newVal: any, oldVal: any) => void) => () => void;
  $subscribe?: (callback: (mutation: any) => void) => () => void;
}

export interface AdapterContext {
  config: { base: string };
  headers: Record<string, string>;
  client?: any;
}

export interface AdapterRequestOptions {
  method?: string;
  path?: string;
  query?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  base?: string;
}

export interface Adapter {
  name?: string;
  request(config: AdapterRequestOptions, ctx?: AdapterContext): Promise<any>;
}

export interface ApiClientConfig {
  base?: string;
  adapter?: string;
  headers?: Record<string, string>;
}

export interface BoundApiClient {
  get(path?: string, query?: Record<string, any>, opts?: Record<string, any>): Promise<any>;
  post(path?: string, body?: any, opts?: Record<string, any>): Promise<any>;
  put(path?: string, body?: any, opts?: Record<string, any>): Promise<any>;
  patch(path?: string, body?: any, opts?: Record<string, any>): Promise<any>;
  delete(path?: string, opts?: Record<string, any>): Promise<any>;
}

export interface ApiClient {
  base: string;
  adapterName: string;
  headers: Record<string, string>;
  setHeader(name: string, value: string): void;
  request(opts?: AdapterRequestOptions): Promise<any>;
  get(path?: string, query?: Record<string, any>, opts?: Record<string, any>): Promise<any>;
  post(path?: string, body?: any, opts?: Record<string, any>): Promise<any>;
  put(path?: string, body?: any, opts?: Record<string, any>): Promise<any>;
  patch(path?: string, body?: any, opts?: Record<string, any>): Promise<any>;
  delete(path?: string, opts?: Record<string, any>): Promise<any>;
  createBoundApi(modelScope: Scope): BoundApiClient;
}

export interface DirectiveOptions {
  priority?: number;
  isTerminal?: boolean;
  once?: boolean;
  events?: string[];
  watch?: boolean;
  scopeOnly?: boolean;
}

export interface DirectiveContext {
  attr: string;
  name: string;
  config: Record<string, any>;
  arg: string | null;
  modifiers: string[];
  warn: Function;
  error: Function;
}

export type DirectiveHandler = (
  el: HTMLElement,
  expr: string,
  scope: Scope,
  arg: string | null,
  modifiers: string[],
  scanElement?: (el: Element, scope?: Scope) => () => void,
  ctx?: DirectiveContext
) => (() => void) | void;

export interface ComponentDescriptor {
  props?: Record<string, { type?: string; required?: boolean; default?: any }>;
  template: string | HTMLTemplateElement;
  setup?: (props: Record<string, any>, ctx: { emit: (name: string, detail?: any) => CustomEvent; scope: Scope }) => Record<string, any> | void;
  style?: string;
}

export interface KiteStatic {
  version: string;
  state: (path?: string) => any;
  stateObj: Record<string, any>;
  helpers: Record<string, Function>;
  registry: {
    directives: Map<string, any>;
    helpers: Record<string, Function>;
    rules: Map<string, Function>;
    adapters: Map<string, any>;
    components: Map<string, any>;
    plugins: Map<string, any>;
    hooks: Map<string, any>;
    middlewares: Array<any>;
  };

  directive(name: string, handler: DirectiveHandler, options?: DirectiveOptions): () => void;
  component(name: string, templateOrDef: HTMLTemplateElement | Element | string | ComponentDescriptor): () => void;
  model(name: string, state: Record<string, any>, apiOption?: string | ApiClient): Scope;
  route(path: string, viewName: string, options?: { guard?: string; redirect?: string }): void;
  navigate(path: string): void;
  api(name: string, config: ApiClientConfig): ApiClient;
  adapter(name: string, adapterImpl: Adapter | ((opts: any, ctx: any) => Promise<any>)): () => void;
  middleware(name: string, fn: (opts: any, ctx: any, next: (opts?: any) => Promise<any>) => Promise<any>): () => void;
  hook(name: string, fn: Function): () => void;
  getApi(name?: string): ApiClient | undefined;
  helper(name: string, fn: Function, options?: { scope?: string }): () => void;
  store(name: string, data?: Record<string, any>): Scope;
  rule(name: string, validator: (val: any, arg?: string, ctx?: any) => boolean | string | Promise<boolean | string>): () => void;
  plugin(name: string, fn: Function): () => void;
  use(plugin: Function | { install: Function; name?: string } | string): void;
  config(options?: Record<string, any> | string): any;
  override(name: string, fn: Function): any;
  original(name: string): any;
  disable(names: string | string[]): void;
  enable(names: string | string[]): void;
  dumpState(): { global: Scope; stores: Record<string, Scope>; models: Record<string, Scope> };
  inspect(target?: string | Element | null): any;
  clear(): void;
  get(target: string | Element | Scope, key?: string): any;
  set(target: string | Element | Scope, key: string, val: any): void;
  call(modelName: string, methodName: string, ...args: any[]): any;
  on(event: string, fn: (evt: CustomEvent) => void): void;
  off(event: string, fn: (evt: CustomEvent) => void): void;
  emit(event: string, detail?: any): CustomEvent | undefined;
  pause(): void;
  resume(): void;
  unmount(el: Element): void;
  destroy(): void;
  createScope(initial?: Record<string, any>, parent?: Scope | null): Scope;
  scan(root?: Element | Document | null): () => void;
  evaluate(expr: string, scope?: Scope): any;
}

export const Kite: KiteStatic;
export default Kite;

declare global {
  interface Window {
    Kite: KiteStatic;
  }

  namespace JSX {
    interface IntrinsicElements {
      'kite-model': any;
      'kite-view': any;
      'kite-controller': any;
      'kite-action': any;
      'kite-route': any;
      'kite-outlet': any;
      'kite-include': any;
      'kite-api': any;
      'kite-header': any;
      'kite-component': any;
      'kite-use': any;
      'kite-store': any;
      'kite-link': any;
      'kite-fragment': any;
      'kite-config': any;
      'kite-try': any;
      'kite-catch': any;
      'kite-plugin': any;
    }
  }
}
