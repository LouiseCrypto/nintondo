import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    // Target modern browsers only — Telegram clients are always up-to-date
    target: 'es2022',
    // Inline assets under 10 KB so the first paint doesn't wait on extra requests
    assetsInlineLimit: 10_240,
  },
});
