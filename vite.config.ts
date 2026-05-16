import analog from '@analogjs/platform';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      analog({
        ssr: false,
        static: false,
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@core': path.resolve(__dirname, './src/app/core'),
        '@shared': path.resolve(__dirname, './src/app/shared'),
        '@env': path.resolve(__dirname, './src/app/environments'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env['DISABLE_HMR'] !== 'true',
    },
  };
});
