import test from 'node:test'
import path from 'node:path'

import { dyno } from '../../../index.js'

test('#onTick() metrics result', async t => {
  const onTick = t.mock.fn(function() {})

  t.before(() => dyno(path.join(import.meta.dirname, 'tasks/perf_apis.js'), {
    parameters: { cyclesPerSecond: 500, threads: 2, durationMs: 250 },
    onTick: onTick
  }))

  await t.test('result', async t => {
    let result
    
    t.beforeEach(t => {
      result = onTick.mock.calls[0].arguments[0]()
    })

    await t.test('is an Array', t => {
      t.assert.ok(Array.isArray(result), 'result is not an Array')
    })

    // @FIXME, result has a stray pid
    await t.todo('with metrics for all threads + primary', t => {
      t.assert.strictEqual(result.length, 2 + 1)
    })
    
    await t.test('first thread is the primary', t => {
      const metrics = Object.keys(result[0])

      t.assert.ok(metrics.includes('issued'), '"issued" metric missing')
    })
    
    await t.test('the rest are the task threads', t => {
      const metrics = Object.keys(result[1])

      t.assert.ok(metrics.includes('cycle'), '"cycle" metric missing')
    })
    
    await t.test('each thread has a number of Metrics', t => {
      const metrics = Object.keys(result[1])

      t.assert.ok(metrics.length > 0, 'result has no properties')
    })
    
    await t.test('a Metric has histogram-like properties', t => {
      const metric = result[1].cycle, props = Object.keys(metric || {})

      t.assert.ok(props.includes('min'), 'metric has no "min"')
      t.assert.ok(props.includes('max'), 'metric has no "max"')
      
      t.assert.ok(metric.min > 0, 'metric.min is 0')
      t.assert.ok(metric.max > 0, 'metric.max is 0')
    })
    
    await t.test('A Metric has snapshots', t => {  
      const metric = result[1].cycle, props = Object.keys(metric || {})

      t.assert.ok(props.includes('snapshots'), 'no "snapshots" prop')
      t.assert.ok(metric.snapshots.length > 0, "snapshots is empty")
    })
  })
})
