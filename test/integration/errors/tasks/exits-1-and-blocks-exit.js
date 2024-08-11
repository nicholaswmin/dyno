// 1st thread exits with code: 1 & all threads block clean exit/disconnect
import { setTimeout } from 'node:timers/promises'
import { task } from '../../../../index.js'

task(async function task() {   
  if (+process.env.THREAD_INDEX === 1)
    process.exit(1)
}, {
  after: () => {
    return setTimeout(5000)
  }
})
