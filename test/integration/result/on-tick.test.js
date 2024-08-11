import test from 'node:test'
import path from 'node:path'

import { dyno } from '../../../index.js'

test('#onTick() callback', async t => {
  const onTick = t.mock.fn(function() {})

  t.before(() => dyno(path.join(import.meta.dirname, 'tasks/perf_apis.js'), {
    parameters: { cyclesPerSecond: 200, threads: 3, durationMs: 500 },
    onTick: onTick
  }))

  await t.test('is called', t => {
    t.assert.ok(onTick.mock.calls.length > 0, '"onTick" was not called')
  })
  
  await t.test('is called many times', t => {
    t.assert.ok(
      onTick.mock.calls.length > 50, 
      `"onTick" was called: ${onTick.mock.calls.length} times, expected: > 50`
    )
  })
  
  await t.test('arguments', async t => {
    const arg1 = onTick.mock.calls[0].arguments[0]

    await t.test('first argument is an object', t => {
      t.assert.strictEqual(typeof arg1, 'object')
    })

    await t.test('with main stats', async t => {
      const main = arg1.main
      
      await t.test('is an array', t => {
        t.assert.ok(Array.isArray(arg1.main), '"main" is not an Array')
      })
      
      await t.test('with only 1 item', t => {
        t.assert.strictEqual(main.length, 1)
      })
      
      await t.test('tracks issued cycles', t => {
        t.assert.ok(main.at(0).issued > 0, '"issued" must be: > 0')
      })
      
      await t.test('tracks completed cycles', t => {
        t.assert.ok(main.at(0).completed > 0, '"completed" must be: > 0')
      })

      await t.test('tracks cycles backlog', t => {
        t.assert.ok(!isNaN(main.at(0).backlog), 'backlog is NaN')
      })
    })
  
    await t.test('with task timings', async t => {
      const tasks = arg1.tasks
      
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
})
