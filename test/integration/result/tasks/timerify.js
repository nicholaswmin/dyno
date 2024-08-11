// records a custom-value via `performance.timerify`
import { task } from '../../../../index.js'

task(async function task() {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  const t_sleep = performance.timerify(sleep)

  for (let i = 0; i < 10; i++)
    await t_sleep(Math.round(Math.random() * 20))
})
