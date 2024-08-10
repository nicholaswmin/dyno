import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'
import { main } from '../../../index.js'

test('#main() exits gracefully on error', async t => {
  const parameters = {
    CYCLES_PER_SECOND: 50, CONCURRENCY: 4, DURATION_MS: 500
  }
  
  t.before(() => cp.fork = t.mock.fn(cp.fork))

  await t.test('error thrown in thread while its executing cycles', async t => {
    await t.test('main() call rejects with an error', async t => {
      return t.assert.rejects(async () => {
        return main({
          task: join(import.meta.dirname, './tasks/exits-1.js'),
          parameters
        })
      }, { name: 'Error' })
    })
    
    await t.test('main() call rejects immediately', async t => {
      const start = performance.now()

      return main({
        task: join(import.meta.dirname, './tasks/exits-1.js'),
        parameters: parameters
      })
      .catch(() => {
        const duration = performance.now() - start

        t.assert.ok(
          duration < parameters.DURATION_MS,
          [
            `Expected to rejected earlier than: ${parameters.DURATION_MS} ms`,
            `Rejected in: ${duration} ms`
          ].join('. '),
        )
      })
    })

    await t.test('gracefully disconnects the remaining threads', async t => {   
      t.before(() => main({
        task: join(import.meta.dirname, './tasks/exits-1.js'),
        parameters: { CYCLES_PER_SECOND: 50, CONCURRENCY: 4, DURATION_MS: 500 }
      }))

      const threads = cp.fork.mock.calls.map(c => c.result)

      t.assert.strictEqual(threads.filter(t => t.exitCode === 0).length, 3)
      t.assert.strictEqual(threads.filter(t => t.exitCode > 0).length, 1)
    })
  })
})
