#!/usr/bin/env node

// replace example code snippets in README.md

import path from 'node:path'
import { styleText } from 'node:util'
import { replaceTokensInFile } from './builder/index.js'

await replaceTokensInFile({
  srcfolder: './example',
  filepath: path.join(import.meta.dirname, '../README.md'),
  entrypath: '@nicholaswmin/dyno',
  tokens: [
    { target: 'benchmark-simple.js', start: '// example', end: '```' },
    { target: 'benchmark.js', start: '// complete example', end: '```'  }
  ]
})

console.log(styleText(['green'], 'done:success'))
