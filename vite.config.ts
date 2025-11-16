import { defineConfig } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import vue from '@vitejs/plugin-vue';

const outDirRoot = 'dist';
const outDirMain = path.join(outDirRoot, 'main');
const outDirRenderer = path.join(outDirRoot, 'renderer');

const electronViteConfig = {
  build: {
    outDir: outDirMain,
  },
};

export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: electronViteConfig,
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
        vite: electronViteConfig,
      },
      renderer: process.env.NODE_ENV === 'test'
        ? undefined
        : {},
    }),
  ],
  build: {
    outDir: outDirRenderer,
  },
});
