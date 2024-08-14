import test from 'node:test'
import path from 'node:path'

import { dyno } from '../../../index.js'

test('#onTick() callback', async t => {
  const onTick = t.mock.fn(function() {})

  t.before(() => dyno(path.join(import.meta.dirname, 'tasks/perf_apis.js'), {
    parameters: { cyclesPerSecond: 100, threads: 3, durationMs: 250 },
    onTick: onTick
  }))

  await t.test('is called at least once', t => {
    t.assert.ok(onTick.mock.calls.length > 0, '"onTick" was not called')
  })
  
  await t.test('is called more than once', t => {
    t.assert.ok(
      onTick.mock.calls.length > 50, 
      `"onTick" was called: ${onTick.mock.calls.length} times, expected: > 50`
    )
  })
})
