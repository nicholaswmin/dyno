// records a custom-value via `performance.timerify`
import { task } from '../../../../index.js'

task(async function cycle() {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

  // performance.timerify
  const sleep_timerify = sleep
  for (let i = 0; i < 10; i++)
    await performance.timerify(sleep_timerify)(2)
  
  // performance.measure
  const sleep_measure = sleep_timerify
  for (let i = 0; i < 10; i++) {
    performance.mark('start')
    await sleep_measure(2)
    performance.mark('end')
    performance.measure('sleep', 'start', 'end')
  }
})
