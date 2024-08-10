// records a custom-value via `performance.timerify`
import { run } from '../../../../index.js'

run(async function task() {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  const t_sleep = performance.timerify(sleep)

  for (let i = 0; i < 10; i++)
    await t_sleep(Math.round(Math.random() * 20))
})
