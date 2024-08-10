// records a custom-value via `performance.timerify`
import { run } from '../../../../index.js'

run(async function task() {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

  for (let i = 0; i < 10; i++) {
    performance.mark('start')
    await sleep(Math.round(Math.random() * 5))
    performance.mark('end')

    performance.measure('sleep', 'start', 'end')
  }
})
