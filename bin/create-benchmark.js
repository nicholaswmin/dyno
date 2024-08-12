#!/usr/bin/env node

import path from 'node:path'
import { createExample } from './builder/index.js'

await createExample({
  srcfolder: './example',
  entrypath: path.relative(process.cwd(), './index.js'),
  fragments: [
    { target: 'benchmark.js' }
  ]
})

console.log('\x1b[32mbenchmark created!\x1b[0m')
