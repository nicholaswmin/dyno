import test from 'node:test'
import path from 'node:path'

import { dyno } from '../../../index.js'

test('#onTick() arguments: tasks', async t => {
  const onTick = t.mock.fn(function() {})

  t.before(() => dyno(path.join(import.meta.dirname, 'tasks/perf_apis.js'), {
    parameters: { cyclesPerSecond: 200, threads: 3, durationMs: 500 },
    onTick: onTick
  }))

  await t.test('with task timings', async t => {
    const tasks = onTick.mock.calls[0].arguments[0].tasks
    
    await t.test('is an array', t => {
      t.assert.ok(Array.isArray(tasks), '"tasks" is not an Array')
    })
    
    await t.test('includes all threads', t => {
      t.assert.strictEqual(tasks.length, 3)
    })
    
    await t.test('tracks cycle duration', t => {
      t.assert.ok(!isNaN(tasks.at(0).cycle), '"cycle" is NaN')
    })
    
    await t.test('tracks event loop delay', t => {
      t.assert.ok(!isNaN(tasks.at(0).evt_loop), '"evt_loop" is NaN')
    })
    
    await t.test('tracks custom "performance.timerify" measures', t => {
      t.assert.ok(!isNaN(tasks.at(0).sleep), '"sleep_timerify" is NaN')
    })
    
    await t.test('tracks custom "performance.measure" measures', t => {
      t.assert.ok(!isNaN(tasks.at(0).sleep), '"sleep_measure" is NaN')
    })
  })
})
