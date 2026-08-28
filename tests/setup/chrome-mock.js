/**
 * Chrome Extension API Mock for Jest testing.
 *
 * Provides a realistic mock of chrome.storage.local with in-memory Map-based
 * round-trip storage, chrome.storage.onChanged listener dispatch, chrome.tabs,
 * chrome.scripting, chrome.runtime, and chrome.commands.
 */

// Internal storage backing
const storageData = new Map();
const storageListeners = [];

const chromeMock = {
  runtime: {
    id: "mock-extension-id-000",
    lastError: null,
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onConnect: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn()
  },

  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        if (keys === null || keys === undefined) {
          // Return all items
          const result = {};
          storageData.forEach((value, key) => {
            result[key] = JSON.parse(JSON.stringify(value));
          });
          if (callback) callback(result);
          return;
        }
        if (typeof keys === "string") keys = [keys];
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach((k) => {
            if (storageData.has(k)) {
              result[k] = JSON.parse(JSON.stringify(storageData.get(k)));
            }
          });
          if (callback) callback(result);
          return;
        }
        // keys is an object with defaults
        const result = {};
        Object.keys(keys).forEach((k) => {
          result[k] = storageData.has(k)
            ? JSON.parse(JSON.stringify(storageData.get(k)))
            : keys[k];
        });
        if (callback) callback(result);
      }),

      set: jest.fn((items, callback) => {
        const changes = {};
        Object.keys(items).forEach((key) => {
          const oldValue = storageData.has(key)
            ? JSON.parse(JSON.stringify(storageData.get(key)))
            : undefined;
          storageData.set(key, JSON.parse(JSON.stringify(items[key])));
          changes[key] = {
            oldValue: oldValue,
            newValue: JSON.parse(JSON.stringify(items[key]))
          };
        });
        // Dispatch onChanged listeners
        storageListeners.forEach((listener) => {
          try {
            listener(changes, "local");
          } catch (e) {
            // Silence listener errors in tests
          }
        });
        if (callback) callback();
      }),

      remove: jest.fn((keys, callback) => {
        const arr = Array.isArray(keys) ? keys : [keys];
        const changes = {};
        arr.forEach((key) => {
          if (storageData.has(key)) {
            changes[key] = {
              oldValue: JSON.parse(JSON.stringify(storageData.get(key)))
            };
            storageData.delete(key);
          }
        });
        // Dispatch onChanged listeners
        storageListeners.forEach((listener) => {
          try {
            listener(changes, "local");
          } catch (e) {
            // Silence listener errors in tests
          }
        });
        if (callback) callback();
      }),

      clear: jest.fn((callback) => {
        storageData.clear();
        if (callback) callback();
      })
    },

    onChanged: {
      addListener: jest.fn((listener) => {
        storageListeners.push(listener);
      }),
      removeListener: jest.fn((listener) => {
        const idx = storageListeners.indexOf(listener);
        if (idx > -1) storageListeners.splice(idx, 1);
      })
    }
  },

  tabs: {
    query: jest.fn((queryInfo, callback) => {
      callback([
        {
          id: 1,
          url: "https://example.com/page",
          active: true,
          windowId: 1
        }
      ]);
    }),
    sendMessage: jest.fn(() => Promise.resolve()),
    connect: jest.fn(() => ({
      name: "z-webkeybind-popup",
      onMessage: { addListener: jest.fn() },
      onDisconnect: { addListener: jest.fn() },
      postMessage: jest.fn()
    })),
    create: jest.fn((options, callback) => {
      if (callback) callback({ id: 99 });
    })
  },

  scripting: {
    executeScript: jest.fn((options, callback) => {
      if (callback) callback([{ result: true }]);
    })
  },

  commands: {
    onCommand: {
      addListener: jest.fn()
    }
  }
};

// Expose globally
global.chrome = chromeMock;

// Expose helper utilities for tests to manipulate mock state
global.__chromeMock = {
  /**
   * Clear all storage data and reset listeners. Call in beforeEach.
   */
  resetStorage: () => {
    storageData.clear();
    storageListeners.length = 0;
    chrome.runtime.lastError = null;
  },

  /**
   * Directly inspect raw storage map (bypasses mock callbacks).
   */
  getStorageData: () => storageData,

  /**
   * Get count of registered storage change listeners.
   */
  getListenerCount: () => storageListeners.length,

  /**
   * Reset all jest.fn() call counts without clearing storage.
   */
  resetMockCalls: () => {
    Object.values(chrome.storage.local).forEach((fn) => {
      if (typeof fn === "function" && fn.mockClear) fn.mockClear();
    });
    chrome.tabs.query.mockClear();
    chrome.tabs.sendMessage.mockClear();
    chrome.scripting.executeScript.mockClear();
  }
};
