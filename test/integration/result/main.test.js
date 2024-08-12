import test from 'node:test'
import path from 'node:path'

import { dyno } from '../../../index.js'

test('#onTick() arguments: main', async t => {
  const onTick = t.mock.fn(function() {})

  t.before(() => dyno(path.join(import.meta.dirname, 'tasks/perf_apis.js'), {
    parameters: { cyclesPerSecond: 200, threads: 3, durationMs: 500 },
    onTick: onTick
  }))

  await t.test('with main stats', async t => {
    const main = onTick.mock.calls[0].arguments[0].main

    await t.test('is an array', t => {
      t.assert.ok(Array.isArray(main), '"main" is not an Array')
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
})
