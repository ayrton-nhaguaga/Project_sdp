import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
  value: function () {
    this.setAttribute('open', '');
  },
  configurable: true,
});
Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  value: function () {
    this.removeAttribute('open');
  },
  configurable: true,
});
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
