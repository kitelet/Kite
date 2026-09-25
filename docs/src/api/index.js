/**
 * @file API bridge module entry point for Kite.
 * @module api
 * @author Kite Contributors
 * @license MIT
 */

export {
  ApiClient,
  registerAdapter,
  getAdapter,
  unregisterAdapter,
  getOriginalAdapter,
  getAllAdapters
} from './client.js';
export { registerApi, getApi, processApiDefinition } from './api-element.js';
export { restAdapter } from './adapters/rest.js';
export { jsonAdapter } from './adapters/json.js';
export { localAdapter } from './adapters/local.js';
