import test from 'node:test'
import path from 'node:path'
import cp from 'node:child_process'

import { dyno } from '../../../index.js'

test('#dyno() runs cycles on multiple threads', async t => {
  let result = null
  
  t.before(async () => {
    cp.fork = t.mock.fn(cp.fork)

    result = await dyno(path.join(import.meta.dirname, 'tasks/runs.js'), {
      parameters: { cyclesPerSecond: 500, threads: 5, durationMs: 1000 }
    })
  })

  await t.test('creates 4 threads', async t => {
    const threads = cp.fork.mock.calls.map(call => call.result)

    t.assert.strictEqual(threads.length, 5)
  })
  
  await t.test('all threads exit normally', async t => {
    const exit0 = cp.fork.mock.calls
      .map(call => call.result)
      .filter(thread => Object.hasOwn(thread, 'exitCode') && !thread.exitCode)

    t.assert.strictEqual(exit0.length, 5)
  })
})
