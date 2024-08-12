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
})
