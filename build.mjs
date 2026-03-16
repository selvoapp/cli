import { build } from 'esbuild'

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  minify: true,
  outfile: 'dist/cli.cjs',
  banner: { js: '#!/usr/bin/env node' },
  define: {
    '__CLI_VERSION__': '"0.1.0"',
  },
})

console.log('Built dist/cli.cjs')
