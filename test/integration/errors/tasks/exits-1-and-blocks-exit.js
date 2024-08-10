// 1st thread exits with code: 1 & all threads block clean exit/disconnect
import { setTimeout } from 'node:timers/promises'
import { run } from '../../../../index.js'

run(async function task() {   
  if (+process.env.index === 1)
    process.exit(1)
}, {
  after: () => {
    return setTimeout(5000)
  }
})
