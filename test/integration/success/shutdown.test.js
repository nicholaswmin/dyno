import test from 'node:test'
import path from 'node:path'
import cp from 'node:child_process'

import { dyno } from '../../../index.js'

test('#dyno() exits gracefully', async t => {
  t.before(async () => {
    cp.fork = t.mock.fn(cp.fork)
    t.mock.reset()

    await dyno(path.join(import.meta.dirname, 'tasks/runs.js'), {
      parameters: { cyclesPerSecond: 500, threads: 2, durationMs: 250 }
    })
  })
  
  await t.test('all threads exit with code: 0', async t => {
    const exit0 = cp.fork.mock.calls
      .map(call => call.result)
      .filter(thread => Object.hasOwn(thread, 'exitCode') && !thread.exitCode)

    t.assert.strictEqual(exit0.length, 2)
  })
})
