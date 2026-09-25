/**
 * @file Standard REST adapter for Kite API client.
 * @module api/adapters/rest
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Implements standard RESTful HTTP methods (GET, POST, PUT, PATCH, DELETE, UPLOAD)
 * using the native browser `fetch()` API with JSON serialization and query string formatting.
 */

/**
 * Standard REST API Adapter implementation.
 */
export const restAdapter = {
  name: 'rest',

  /**
   * Executes an HTTP request against a REST endpoint.
   *
   * @param {Object} config - Request configuration.
   * @param {string} config.base - Base URL.
   * @param {string} config.path - Endpoint path.
   * @param {string} [config.method='GET'] - HTTP method.
   * @param {Object} [config.headers={}] - Request headers.
   * @param {any} [config.body] - Request body.
   * @param {Object} [config.query] - URL query parameters.
   * @returns {Promise<any>} Parsed response data.
   */
  async request(config) {
    const { base = '', path = '', method = 'GET', headers = {}, body, query } = config;

    // 1. Build clean target URL
    let fullUrl = base ? `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}` : path;

    // 2. Append query parameters if provided
    if (query && typeof query === 'object') {
      const qParams = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) {
          qParams.append(k, String(v));
        }
      }
      const qs = qParams.toString();
      if (qs) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
      }
    }

    const reqHeaders = Object.assign({}, headers);
    let reqBody = body;

    // 3. Format request body
    if (body !== undefined && body !== null) {
      if (typeof FormData !== 'undefined' && body instanceof FormData) {
        // Let browser set multipart boundary
        delete reqHeaders['Content-Type'];
      } else if (typeof body === 'object') {
        if (!reqHeaders['Content-Type']) {
          reqHeaders['Content-Type'] = 'application/json';
        }
        reqBody = JSON.stringify(body);
      }
    }

    // 4. Dispatch fetch request
    const response = await fetch(fullUrl, {
      method,
      headers: reqHeaders,
      body: reqBody
    });

    // 5. Parse response content
    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // 6. Handle HTTP error statuses
    if (!response.ok) {
      const errorMsg = typeof data === 'object' && data && (data.message || data.error)
        ? (data.message || data.error)
        : `HTTP ${response.status} ${response.statusText}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.response = data;
      throw err;
    }

    return data;
  }
};
