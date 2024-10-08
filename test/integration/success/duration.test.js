import test from 'node:test'
import path from 'node:path'
import perf from 'node:perf_hooks'

import { dyno } from '../../../index.js'

test('#dyno() cycles in x amount of threads', async t => {
  const histogram = perf.createHistogram()

  t.before(async () => {
    await performance.timerify(dyno, { histogram })(
      path.join(import.meta.dirname, 'tasks/runs.js'), {
      parameters: { cyclesPerSecond: 300, threads: 2, durationMs: 250 }
    })
  })
  
  await t.test('runs for specified duration', async t => {
    await t.test('ends soon after specified duration', t => {
      const diff = Math.abs(Math.round(histogram.mean / 1000000) - 250)

      // @NOTE '50ms' is just an abitrarily chosen value on lateness
      t.assert.ok(diff < 50, `test run diff is ${diff} ms, expected < 50 ms`)
    })
    
    await t.test('ends no earlier than specified duration', t => {
      const ms = Math.round(histogram.min / 1000000)

      t.assert.ok(ms >= 250, `test ended in: ${ms} ms, expected > 250 ms`)
    })
  })
})
