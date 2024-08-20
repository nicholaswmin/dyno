import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'
import { alive, dead, exitZero, exitNonZero, sigkilled } from './utils/utils.js'

import { Threadpool } from '../index.js'

test('#stop()', { timeout: 3000 }, async t => {
  let pool = null, threads = []
  
  t.before(() => cp.fork = t.mock.fn(cp.fork))
  t.beforeEach(() => cp.fork.mock.resetCalls())

  await t.test('threads exit normally', async t => {
    t.before(async () => {
      pool = new Threadpool(join(import.meta.dirname, '/task/ok.js'))

      await pool.start()

      threads = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('resolves an array of exit codes: zero', async t => {   
      const exitCodes = await pool.stop()

      t.assert.deepStrictEqual(exitCodes, [0,0,0,0])
    })
    
    await t.test('threads have exit code: zero', t => {          
      t.assert.strictEqual(threads.filter(exitZero).length, pool.size)
    })
    
    await t.test('all threads exit', t => {          
      t.assert.strictEqual(threads.filter(dead).length, pool.size)
      t.assert.strictEqual(threads.filter(alive).length, 0)
    })
  })
 
  await t.test('threads take too long to exit', async t => {
    t.before(async () => {
      pool = new Threadpool(join(import.meta.dirname, 'task/lag-exit.js'))
      
      await pool.start()
      
      threads = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('rejects the returned promise', async t => {   
      pool.on('error', err => { console.log(err) })
      await t.assert.rejects(async () => {
        await pool.stop()
      })
    })
    
    await t.test('threads are force killed', t => {
      t.assert.strictEqual(threads.filter(sigkilled).length, pool.size)
    })
    
    await t.test('all threads exit', t => {
      t.assert.strictEqual(threads.filter(dead).length, pool.size)
      t.assert.strictEqual(threads.filter(alive).length, 0)
    })
  })

  await t.test('threads exit wih non-zero during cleanups', async t => {
    t.before(async () => {
      pool = new Threadpool(join(import.meta.dirname, 'task/exit-err.js'))
      pool.on('error', () => {})
      await pool.start()

      threads = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('rejects the returned promise', async t => {          
      await t.assert.rejects(pool.stop.bind(pool))
    })
    
    // @FIXME flaky
    t.todo('thread exits with exit code: non-zero', t => {
      t.assert.strictEqual(threads.filter(exitNonZero).length, 1)
    })

    // @FIXME flaky
    t.todo('remaining exit with exit code: zero', t => {
      t.assert.strictEqual(threads.filter(exitZero).length, pool.size - 1)
    })
    
    await t.test('all threads exit', t => {
      t.assert.strictEqual(threads.filter(dead).length, pool.size)
      t.assert.strictEqual(threads.filter(alive).length, 0)
    })
  })

  await t.test('threads unresponsive to shutdown signals', async t => {
    t.before(async () => {
      pool = new Threadpool(
        join(import.meta.dirname, 'task/no-exit-fn.js')
      )
      
      await pool.start()

      threads = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('rejects the returned promise', async t => { 
      await t.assert.rejects(pool.stop.bind(pool))
    })

    await t.test('threads are SIGKILL-ed', t => {
      t.assert.strictEqual(threads.filter(sigkilled).length, pool.size)
    })

    await t.test('all threads exit', t => {
      t.assert.strictEqual(threads.filter(dead).length, pool.size)
      t.assert.strictEqual(threads.filter(alive).length, 0)
    })
  })

  await t.test('threads with a blocked event loop', async t => {
    t.before(async () => {
      pool = new Threadpool(
        join(import.meta.dirname, 'task/blocked-loop.js')
      )
      
      await pool.start()

      threads = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('rejects the returned promise', async t => { 
      await t.assert.rejects(pool.stop.bind(pool))
    })

    await t.test('threads are SIGKILL-ed', t => {
      t.assert.strictEqual(threads.filter(sigkilled).length, 4)
    })

    await t.test('all threads exit', t => {
      t.assert.strictEqual(threads.filter(dead).length, 4)
      t.assert.strictEqual(threads.filter(alive).length, 0)
    })
  })
})
