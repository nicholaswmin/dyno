#!/usr/bin/env node

// create a Heroku-deployable benchmark example

import path from 'node:path'
import { createExample } from './builder/index.js'
import { styleText } from 'node:util'

await createExample({
  srcfolder: './example',
  targetfolder: './benchmark',
  entrypath: path.relative(process.cwd(), '../index.js'),
  fragments: [
    { target: 'benchmark.js' },
    { target: 'bind.js'      },
    { target: 'package.json' },
    { target: 'README.md'    }
  ]
})

console.log(styleText(['green'], 'done:success'))
