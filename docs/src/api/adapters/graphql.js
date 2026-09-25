/**
 * @file GraphQL network protocol adapter for Kite API client.
 * @module api/adapters/graphql
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Dispatches GraphQL operations over HTTP POST, encoding `{ query, variables }`.
 *
 * @example
 * <kite-api name="gql" base="https://api.example.com/graphql" adapter="graphql"></kite-api>
 */

import { error } from '../../utils/log.js';

export const graphqlAdapter = {
  name: 'graphql',

  /**
   * Dispatches a GraphQL request.
   *
   * @param {Object} config - Request configuration.
   * @returns {Promise<any>}
   */
  async request(config) {
    const { base = '', path = '', headers = {}, body } = config;
    const url = `${base.replace(/\/+$/, '')}${path ? '/' + path.replace(/^\/+/, '') : ''}`;

    const mergedHeaders = Object.assign({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }, headers);

    const payload = typeof body === 'string' ? { query: body } : body;

    const response = await fetch(url, {
      method: 'POST',
      headers: mergedHeaders,
      body: JSON.stringify(payload)
    });

    const json = await response.json();
    if (json.errors && json.errors.length > 0) {
      const err = new Error(json.errors[0].message);
      err.errors = json.errors;
      throw err;
    }

    return json.data !== undefined ? json.data : json;
  }
};
