#!/usr/bin/env node

import path from 'node:path'
import { replaceTokensInFile } from './builder/index.js'

await replaceTokensInFile({
  srcfolder: './example',
  filepath: path.join(import.meta.dirname, '../README.md'),
  entrypath: '@nicholaswmin/dyno',
  tokens: [
    { target: 'benchmark.js', start: '// example', end: '```' },
    { target: 'benchmark-plot.js', start: '// plottable', end: '```' }
  ]
})

console.log('\x1b[32mREADME updated!\x1b[0m')
