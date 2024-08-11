import test from 'node:test'
import path from 'node:path'
import cp from 'node:child_process'

import { dyno } from '../../../index.js'

test('#dyno() exits gracefully', async t => {
  t.before(() => {
    cp.fork = t.mock.fn(cp.fork)

    return dyno(path.join(import.meta.dirname, 'tasks/runs.js'), {
      parameters: { CYCLES_PER_SECOND: 500, CONCURRENCY: 2, DURATION_MS: 250 }
    })
  })
  
  await t.test('all threads exit with code: 0', async t => {
    const exit0 = cp.fork.mock.calls.map(c => c.result).filter(t => !t.exitCode)
    t.assert.strictEqual(exit0.length, 2)
  })
})
