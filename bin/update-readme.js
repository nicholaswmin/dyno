#!/usr/bin/env node

import path from 'node:path'
import { replaceTokensInFile } from './builder/index.js'

await replaceTokensInFile({
  srcfolder: './example',
  filepath: path.join(import.meta.dirname, '../README.md'),
  entrypath: '@nicholaswmin/dyno',
  tokens: [
    { target: 'benchmark.js', start: '// example', end: '```' }
  ]
})

console.log('done!')
