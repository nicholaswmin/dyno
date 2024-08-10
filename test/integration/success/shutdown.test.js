import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'

import { dyno } from '../../../index.js'

test('#dyno() exits gracefully', async t => {
  t.beforeEach(() => t.mock.reset())

  t.before(() => {
    cp.fork = t.mock.fn(cp.fork)

    dyno({
      task: join(import.meta.dirname, 'tasks/records-bar.js'),
      parameters: {  CYCLES_PER_SECOND: 500, CONCURRENCY: 4, DURATION_MS: 500 }
    })
  })
  
  await t.test('no thread has exit code > 0', async t => {
    const exitCodes = {
      zero: cp.fork.mock.calls.map(c => c.result).filter(t => !t.exitCode),
      nonZero: cp.fork.mock.calls.map(c => c.result).filter(t => t.exitCode > 0)
    }

    t.assert.strictEqual(exitCodes.zero.length, 4)
    t.assert.strictEqual(exitCodes.nonZero.length, 0)
  })
})
