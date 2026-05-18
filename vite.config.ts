import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const hmrEnabled = process.env.DISABLE_HMR !== 'true';
  const hmrConfig = hmrEnabled
    ? {
        protocol: process.env.HMR_PROTOCOL || 'ws',
        host: process.env.HMR_HOST || 'localhost',
        port: Number(process.env.HMR_PORT || 24678),
        clientPort: Number(process.env.HMR_CLIENT_PORT || process.env.HMR_PORT || 24678),
      }
    : false;
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // We explicitly configure HMR to allow overriding host/port via env vars.
      host: '0.0.0.0',
      hmr: hmrConfig,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: hmrEnabled ? {} : null,
    },
  };
});
