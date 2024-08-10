// all threads block clean exit/disconnect
import { setTimeout } from 'node:timers/promises'
import { run } from '../../../../index.js'

run(async function task() {  
  
}, {
  after: () => {
    return setTimeout(5000)
  }
})
