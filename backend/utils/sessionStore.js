/**
 * Simple in-memory session store.
 *
 * Interface mirrors what a Redis/BullMQ store would expose,
 * so swapping to Redis later requires only changing this file.
 *
 * Future: replace Map with ioredis calls inside each method.
 */

const store = new Map();

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const sessionStore = {
  /** @returns {object|undefined} */
  get(sessionId) {
    const entry = store.get(sessionId);
    if (!entry) return undefined;

    // Auto-expire
    if (Date.now() - new Date(entry.createdAt).getTime() > SESSION_TTL_MS) {
      store.delete(sessionId);
      return undefined;
    }

    return entry;
  },

  /** @param {string} sessionId @param {object} data */
  set(sessionId, data) {
    store.set(sessionId, {
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  /** Merge partial updates into an existing session */
  update(sessionId, partial) {
    const existing = store.get(sessionId);
    if (!existing) return;
    store.set(sessionId, {
      ...existing,
      ...partial,
      updatedAt: new Date().toISOString(),
    });
  },

  delete(sessionId) {
    store.delete(sessionId);
  },

  has(sessionId) {
    return store.has(sessionId);
  },

  /** Diagnostic: number of active sessions */
  size() {
    return store.size;
  },
};

module.exports = { sessionStore };
