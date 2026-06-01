import angular from '@analogjs/vite-plugin-angular';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      angular(),
      tailwindcss()
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
      proxy: {
        '/api': {
          target: 'https://localhost:44378',
          changeOrigin: true,
          secure: false,
        },
        '/hubs': {
          target: 'https://localhost:44378',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  };
});
