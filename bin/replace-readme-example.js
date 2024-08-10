#!/usr/bin/env node

import path from 'node:path'
import { styleText } from 'node:util'
import { replaceTokensInFile } from './builder/index.js'

await replaceTokensInFile({
  srcfolder: './example',
  filepath: path.join(import.meta.dirname, '../README.md'),
  entrypath: '@nicholaswmin/dyno',
  fragments: [
    { target: 'run.js',  startToken: '// run.js', endToken: '```'  },
    { target: 'task.js', startToken: '// task.js', endToken: '```' }
  ]
})

console.log(styleText(['green'], 'done! replaced README.md examples'))
