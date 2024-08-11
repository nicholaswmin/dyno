#!/usr/bin/env node

// create a simple, locally-runnable benchmark example

import path from 'node:path'
import { createExample } from './builder/index.js'
import { styleText } from 'node:util'

await createExample({
  srcfolder: './example',
  entrypath: path.relative(process.cwd(), './index.js'),
  fragments: [
    { target: 'benchmark.js' }
  ]
})

console.log(styleText(['green'], 'done:success'))
