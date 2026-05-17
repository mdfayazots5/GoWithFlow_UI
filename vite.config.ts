import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      analog({
        ssr: false,
        static: false,
        nitro: {
          devProxy: {
            '/api': {
              target: 'https://localhost:44378/api',
              changeOrigin: true,
            },
            '/hubs': {
              target: 'wss://localhost:44378/hubs',
              changeOrigin: true,
            },
          },
        },
      }),
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@core': path.resolve(__dirname, './src/app/core'),
        '@modules': path.resolve(__dirname, './src/app/modules'),
        '@shared': path.resolve(__dirname, './src/app/shared'),
        '@env': path.resolve(__dirname, './src/app/environments'),
      },
    },
    server: {
      port: 4200,
      strictPort: true,
      host: '0.0.0.0',
      hmr: process.env['DISABLE_HMR'] !== 'true',
    },
  };
});
