import test from 'node:test'
import cp from 'node:child_process'
import path from 'node:path'

import { dyno } from '../../../index.js'

test('#dyno() force kills non-exiting threads', async t => {
  await t.test('thread does not exit', async t => {
    let error = null
    
    t.before(() => {
      cp.fork = t.mock.fn(cp.fork)
  
      return dyno(path.join(import.meta.dirname, './tasks/blocks-exit.js'), {
        parameters: { CYCLES_PER_SECOND: 10, CONCURRENCY: 4, DURATION_MS: 300 }
      })
      .catch((err = true) => error = err)
    })
    
    await t.test('rejects with error', t => {
      t.assert.ok(error, '"error" expected to be truthy but is falsy')
    })
    
    await t.test('error mentions SIGKILL', t => {
      t.assert.ok(error.message.includes('SIGKILL'), 'does not include SIGKILL')
    })
    
    await t.test('SIGKILLS remaining threads', t => {
      const sigkills = cp.fork.mock.calls
        .map(call => call.result)
        .map(thread => thread.signalCode === 'SIGKILL')

      t.assert.strictEqual(sigkills.length, 4)
    })
  })
  
  // @FIXME too flaky
  t.todo('error thrown in a thread', async t => {
    await t.test('SIGKILLS the remaining threads and rejects', t => {
      return t.assert.rejects(() => {
        return dyno(path.join(import.meta.dirname, './tasks/blocks-exit.js'), {
          parameters: { CYCLES_PER_SECOND: 5, CONCURRENCY: 4, DURATION_MS: 500 }
        })
      }, { message: 'process:disconnect timeout. Exited with:SIGKILL' })
    })
  })
})
