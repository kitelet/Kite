/**
 * @file Plain JSON adapter for Kite API client.
 * @module api/adapters/json
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Enforces JSON payloads and responses for simple RPC or JSON document endpoints.
 */

import { restAdapter } from './rest.js';

export const jsonAdapter = {
  name: 'json',

  /**
   * Executes a request with strict application/json headers.
   *
   * @param {Object} config - Request configuration.
   * @returns {Promise<any>}
   */
  async request(config) {
    const headers = Object.assign({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }, config.headers);

    return restAdapter.request(Object.assign({}, config, { headers }));
  }
};
