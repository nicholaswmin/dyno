import test from 'node:test'
import cp from 'node:child_process'
import path from 'node:path'
import { dyno } from '../../../index.js'

test('#dyno() exits gracefully on error', async t => {
  let error, duration = null
  
  t.before(() => {
    cp.fork = t.mock.fn(cp.fork)

    const start = performance.now()

    return dyno(path.join(import.meta.dirname, './tasks/exits-1.js'), {
      parameters: { CYCLES_PER_SECOND: 10, CONCURRENCY: 4, DURATION_MS: 1000 }
    })
    .catch((err = true) => {
      error = err
      duration = performance.now() - start
    })
  })

  await t.test('error thrown in thread while its executing cycles', async t => {
    await t.test('rejects immediately', async t => {
      t.assert.ok(duration, '"reject duration" is falsy, call did not reject')
      t.assert.ok(duration < 1000, `must reject in: < 500ms, took: ${duration}`)
    })

    await t.test('rejects with error', async t => {
      t.assert.ok(error, '"error" expected to be truthy but is falsy')
    })
    
    await t.test('error mentions thread exit code', async t => {
      t.assert.strictEqual(error.message, 'A thread exited with code: 1.')
    })

    await t.test('gracefully disconnects the remaining threads', async t => {   
      const threads = cp.fork.mock.calls.map(c => c.result)

      t.assert.strictEqual(threads.filter(t => t.exitCode === 0).length, 3)
      t.assert.strictEqual(threads.filter(t => t.exitCode > 0).length, 1)
    })
  })
})
