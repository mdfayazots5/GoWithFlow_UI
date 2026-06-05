import angular from '@analogjs/vite-plugin-angular';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // API_TARGET env var controls which backend the Vite dev proxy forwards to.
  // Default: production API — dev APK + live reload works without local backend.
  // Override: API_TARGET=https://localhost:44378 npm run dev — uses local .NET backend.
  const apiTarget = process.env['API_TARGET'] ?? 'https://gowithflow-api.onrender.com';
  const isLocalTarget = apiTarget.includes('localhost');

  // HTTPS on the dev server is REQUIRED for mobile/tablet browser testing.
  // The Web Speech API and getUserMedia only work in a *secure context*; a LAN IP
  // over plain HTTP (e.g. http://10.x.x.x:4200) is NOT secure, so speech recognition
  // silently fails in mobile Chrome/Edge even though the API surface exists.
  // basic-ssl serves a self-signed cert → https://<LAN-IP>:4200 is a secure context
  // (tap through the one-time "not private" warning on the device). Disable with
  // HTTPS=false npm run dev for the rare case a plain-HTTP dev server is needed.
  const useHttps = process.env['HTTPS'] !== 'false';

  return {
    plugins: [
      angular(),
      tailwindcss(),
      ...(useHttps ? [basicSsl()] : [])
    ],
    resolve: {
      mainFields: ['module'],
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@core': path.resolve(__dirname, './src/app/core'),
        '@modules': path.resolve(__dirname, './src/app/modules'),
        '@shared': path.resolve(__dirname, './src/app/shared'),
        '@env': path.resolve(__dirname, './src/app/environments'),
      },
    },
    build: {
      outDir: 'dist/analog/public',
    },
    server: {
      port: 4200,
      strictPort: true,
      host: '0.0.0.0',
      hmr: process.env['DISABLE_HMR'] !== 'true',
      watch: {
        ignored: ['**/android/**', '**/node_modules/**', '**/dist/**'],
      },
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: !isLocalTarget,
        },
        '/hubs': {
          target: apiTarget,
          changeOrigin: true,
          secure: !isLocalTarget,
          ws: true,
        },
      },
    },
  };
});
