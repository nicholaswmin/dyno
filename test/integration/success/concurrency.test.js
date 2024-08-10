import test from 'node:test'
import { join } from 'node:path'

import { dyno } from '../../../index.js'

test('#dyno() cycles in x amount of threads', async t => {
  let result = null
  
  t.before(async () => {
    result = await dyno({
      task: join(import.meta.dirname, 'tasks/records-bar.js'),
      parameters: {  CYCLES_PER_SECOND: 500, CONCURRENCY: 2, DURATION_MS: 750 }
    })
  })

  await t.test('returns an object', async t => {
    const pids = Object.keys(result).sort((a, b) => a - b) 
    const t1 = result[pids[1]], t2 = result[pids[2]]
  
    await t.test('with 1 property per-thread', async t => {
      await t.test('spawns at least 1 thread', async t => {
        t.assert.ok(pids.length > 0, 'result has 0 threads')
      })

      await t.test('1st property is the main process', async t => {
        t.assert.strictEqual(pids[0], process.pid.toString())
      })
    })
    
    await t.test('with child thread measurements', async t => {
      await t.test('spawns specified number of threads', async t => {
        t.assert.strictEqual(pids.length, 2 + 1)
      })

      await t.test('each thread runs at least 1 cycle', t => {
        t.assert.ok(Object.hasOwn(t1, 'bar'), 'thread 1 did not log a cycle')
        t.assert.ok(Object.hasOwn(t2, 'bar'), 'thread 2 did not log a cycle')
      })
  
      await t.test('each is run for a number of cycles', async t => {
        await t.test('thread_1 run > 50 cycles', async t => {
          t.assert.ok(t1.bar.count > 50)
        })

        await t.test('thread_2 run > 50 cycles', async t => {
          t.assert.ok(t2.bar.count > 50)
        })
      })
        
      await t.test('threads run an approximately equal number of cycles', t => {
        const diff = Math.abs(t1.bar.count - t2.bar.count)
        const maxdiff = 20

        t.assert.ok(diff < maxdiff, `threads call-count diff. is > ${maxdiff}`) 
      })
    })
  })
})
