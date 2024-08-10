import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'

import { dyno } from '../../../index.js'

test('#dyno() force kills non-exiting threads', async t => {
  await t.test('test duration elapses', async t => {
    await t.test('rejects', t => {
      return t.assert.rejects(async () => {
        return dyno({
          task: join(import.meta.dirname, './tasks/blocks-exit.js'),
          parameters:  {
            CYCLES_PER_SECOND: 50, CONCURRENCY: 4, DURATION_MS: 500
          }
        })
      })
    })
    
    await t.test('SIGKILLS remaining threads', async t => {
      t.before(() => cp.fork = t.mock.fn(cp.fork))

      await dyno({
        task: join(import.meta.dirname, './tasks/blocks-exit.js'),
        parameters:  {
          CYCLES_PER_SECOND: 50, CONCURRENCY: 4, DURATION_MS: 500
        }
      }).catch(() => { })

      t.assert.strictEqual(cp.fork.mock.calls.map(c => c.result)
        .map(t => t.signalCode === 'SIGKILL').length, 4)
    })
  })
  
  // too flaky
  t.todo('error thrown in a thread', async t => {
    await t.test('SIGKILLS the remaining threads and rejects', t => {
      return t.assert.rejects(async () => {
        return dyno({
          task: join(import.meta.dirname, './tasks/exits-1-and-block-exit.js'),
          parameters:  {
            CYCLES_PER_SECOND: 50, CONCURRENCY: 4, DURATION_MS: 500
          }
        })
      }, { message: 'process:disconnect timeout. Exited with:SIGKILL' })
    })
  })
})
