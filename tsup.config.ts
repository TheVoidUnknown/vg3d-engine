import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  loader: {
    '.vert': 'text',
    '.frag': 'text',
    '.glsl': 'text'
  }
});
