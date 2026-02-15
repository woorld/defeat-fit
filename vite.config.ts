import { defineConfig } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import vue from '@vitejs/plugin-vue';
import license from 'rollup-plugin-license';
import { fileURLToPath, URL } from 'node:url';

const outDirRoot = 'dist';
const outDirMain = path.join(outDirRoot, 'main');
const outDirRenderer = path.join(outDirRoot, 'renderer');

const getLicenseConfig = (filename: string) => license({
  thirdParty: {
    output: [
      {
        file: path.join(outDirRoot, 'license', filename + '.json'),
        template: deps => JSON.stringify(
          deps.map(dep => ({
            name: dep.name,
            version: dep.version,
            licenseText: dep.licenseText,
          }))
        ),
      },
      {
        // アプリ外からも読めるように通常のテキストファイルも出力する
        file: path.join(outDirRoot, 'license', filename + '.txt'),
        template: deps => deps.map(dep =>
          `${dep.name} ${dep.version}\n\n${dep.licenseText}`
        ).join('\n--------------------------------\n')
      },
    ],
  },
});

const getAliasPath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

const commonAliases = {
  '@common': getAliasPath('./common'),
  '@prisma-generated-client': getAliasPath('./prisma/generated/client.ts'),
};

const electronViteConfig = {
  plugins: [
    getLicenseConfig('license.main'),
  ],
  build: {
    outDir: outDirMain,
    target: 'ESNext',
  },
  resolve: {
    alias: {
      '@electron': getAliasPath('./electron'),
      ...commonAliases,
    },
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
    getLicenseConfig('license.renderer'),
  ],
  build: {
    outDir: outDirRenderer,
    target: 'ESNext',
  },
  define: {
    // NOTE: JSON.stringifyは"を付与するため
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      '@src': getAliasPath('./src'),
      ...commonAliases,
    },
  },
});
