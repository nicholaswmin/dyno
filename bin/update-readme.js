#!/usr/bin/env node

import path from 'node:path'
import { replaceTokensInFile } from './builder/index.js'

await replaceTokensInFile({
  srcfolder: './example',
  filepath: path.join(import.meta.dirname, '../README.md'),
  entrypath: '@nicholaswmin/dyno',
  tokens: [
    { target: 'benchmark.js', start: '// benchmark.js', end: '```' },
    { 
      target: 'timerify.js', 
      start: '// performance.timerify()', 
      end: '```' },
    { 
      target: 'measure.js', 
      start: '// performance.measure()', 
      end: '```' },
    { 
      target: 'plottable.js', 
      start: '// Requires: ', 
      end: '```' 
    }
  ]
})

console.log('\x1b[32mREADME updated!\x1b[0m')
