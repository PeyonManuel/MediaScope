// src/setupTests.ts
import { expect, beforeEach, afterEach } from 'vitest'; // <-- ADD THIS LINE
import matchers from '@testing-library/jest-dom/matchers'; // <-- Use specific matchers import

// --- Mock localStorage ---
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem(key: string): string | null {
      return store[key] || null;
    },
    setItem(key: string, value: string): void {
      store[key] = value.toString();
    },
    removeItem(key: string): void {
      delete store[key];
    },
    clear(): void {
      store = {};
    },
    // Add other localStorage methods if your code uses them (key, length)
  };
})();

// Assign the mock to the global window object before tests run
if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true, // Allow potential modification if needed by tests
  });
  console.log('Mock localStorage attached to globalThis.');
} else {
  console.log('globalThis.localStorage already exists.');
  // Optionally, you could still assign methods if needed for consistency
  // globalThis.localStorage.getItem = localStorageMock.getItem;
  // globalThis.localStorage.setItem = localStorageMock.setItem;
  // ... etc ...
}

// --- End Mock localStorage ---

// Optional: Reset localStorage before each test (good practice)
beforeEach(() => {
  globalThis.localStorage.clear();
  // You could also set default values here if needed for tests
  // window.localStorage.setItem('theme', 'dark');
});

// You can add other global configurations or imports here
