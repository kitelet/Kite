/**
 * @file LocalStorage adapter for Kite API client.
 * @module api/adapters/local
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Implements a persistent offline REST backend backed by browser `localStorage`.
 * Allows developers and teams to build fully functioning CRUD applications
 * with zero server setup, switching to a remote backend simply by changing the adapter attribute.
 */

export const localAdapter = {
  name: 'local',

  /**
   * Executes an offline REST operation backed by localStorage.
   *
   * @param {Object} config - Request configuration.
   * @returns {Promise<any>}
   */
  async request(config) {
    const { base = 'kite_data', path = '', method = 'GET', body } = config;
    const storageKey = `kite_local_${base}`;

    // Read existing collection from storage
    let items = [];
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null;
      items = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(items)) items = [];
    } catch {
      items = [];
    }

    const cleanPath = path.replace(/^\/+|\/+$/g, '');
    const id = cleanPath ? cleanPath.split('/')[0] : null;


    switch (method.toUpperCase()) {
      case 'GET': {
        if (!id) {
          return items;
        }
        const found = items.find((it) => String(it.id) === String(id));
        if (!found) {
          const err = new Error(`Item with id "${id}" not found in local store "${base}".`);
          err.status = 404;
          throw err;
        }
        return found;
      }

      case 'POST': {
        const newItem = Object.assign({}, body, {
          id: body && body.id ? body.id : Date.now()
        });
        items.push(newItem);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(items));
        }
        return newItem;
      }

      case 'PUT':
      case 'PATCH': {
        if (!id) {
          const err = new Error(`Missing ID for ${method} request in local store.`);
          err.status = 400;
          throw err;
        }
        const index = items.findIndex((it) => String(it.id) === String(id));
        if (index === -1) {
          const err = new Error(`Item with id "${id}" not found.`);
          err.status = 404;
          throw err;
        }
        const updated = Object.assign({}, items[index], body, { id: items[index].id });
        items[index] = updated;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(items));
        }
        return updated;
      }

      case 'DELETE': {
        if (!id) {
          // Clear all items if no ID provided
          items = [];
        } else {
          items = items.filter((it) => String(it.id) !== String(id));
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(items));
        }
        return { success: true, id };
      }

      default:
        throw new Error(`Unsupported method "${method}" in local storage adapter.`);
    }
  }
};
