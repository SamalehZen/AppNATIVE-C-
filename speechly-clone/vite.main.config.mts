import { defineConfig } from 'vite';
import { builtinModules } from 'module';

export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        'electron',
        'sql.js',
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`),
      ],
      output: {
        entryFileNames: 'main.js',
      },
    },
    commonjsOptions: {
      ignoreDynamicRequires: true,
    },
  },
  resolve: {
    browserField: false,
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
});
