import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, loadEnv } from 'vite';
import generateFile from 'vite-plugin-generate-file';
import manifestFile from './manifest.json.js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    svelte(),
    generateFile([
      {
        type: 'json',
        output: './manifest.json',
        data: manifestFile({ env: loadEnv(mode, process.cwd(), '') })
      }
    ])
  ],
  publicDir: 'static',
  build: {
    outDir: 'build'
  },
  worker: {
    rollupOptions: {
      output: {
        // do not include hash in worker files. (instead of 'assets/[name]-[hash].js')
        entryFileNames: 'assets/[name].js'
      }
    }
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : []
  }
}));
