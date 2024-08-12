// `before/after` hooks and the `taskFn` write a file with `Date.now()`, 
// so we can compare in the test file if they have run and in what order.

import fs from 'node:fs'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { task } from '../../../../index.js'

let hasWritten = false, folderpath = join(import.meta.dirname, 'temp/')

task(async function task() {
  await setTimeout(5)

  if  (!hasWritten)
    fs.writeFileSync(join(folderpath, 'task.json'), JSON.stringify({ 
      hook: 'task', created: Date.now() 
    }))

  hasWritten = true  
}, {
  before: async () => {
    await setTimeout(10)
    fs.writeFileSync(join(folderpath, 'before.json'), JSON.stringify({ 
      hook: 'before', created: Date.now() 
    }))
  },
  after: async () => {
    await setTimeout(5)
    fs.writeFileSync(join(folderpath, 'after.json'), JSON.stringify({ 
      hook: 'after', created: Date.now() 
    }))
  }
})
