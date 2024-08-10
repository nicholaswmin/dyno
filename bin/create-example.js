#!/usr/bin/env node

import path from 'node:path'
import { createExample } from './builder/index.js'
import { styleText } from 'node:util'

await createExample({
  srcfolder: './example',
  targetfolder: './benchmark',
  entrypath: path.relative(process.cwd(), '../index.js'),
  fragments: [
    { target: 'run.js'         },
    { target: 'task.js'        },
    { target: 'bind.js'        },
    { target: 'package.json'   },
    { target: 'README.md'      }
  ]
})

console.log(styleText(['green'], `Created example in: ./benchmark`))
