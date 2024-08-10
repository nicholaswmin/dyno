// all threads block clean exit/disconnect
import { setTimeout } from 'node:timers/promises'
import { task } from '../../../../index.js'

task(async function task() {  
  
}, {
  after: () => {
    return setTimeout(5000)
  }
})
