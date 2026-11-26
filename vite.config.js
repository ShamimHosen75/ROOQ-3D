import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// One HTML entry per page.
const pages = ['index', 'collections', 'product', 'about', 'contact'];

export default defineConfig({
  build: {
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(import.meta.dirname, `${p}.html`)])),
    },
  },
});
