import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'
import { alive, dead, exitZero, exitNonZero, sigkilled } from './utils/utils.js'

import { Threadpool } from '../index.js'

test('#stop(', async t => {
  let threadpool = null, threads = []
  
  t.before(() => cp.fork = t.mock.fn(cp.fork))
  t.beforeEach(() => cp.fork.mock.resetCalls())
  t.afterEach(() => threadpool.stop().catch(err => {}))

  await t.test('threads exit normally', async t => {
    t.before(async () => {
      threadpool = new Threadpool(join(import.meta.dirname, '/task/ok.js'))

      await threadpool.start()

      threads = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('resolves an array of exit codes: zero', async t => {   
      const exitCodes = await threadpool.stop()

      t.assert.deepStrictEqual(exitCodes, [0,0,0,0])
    })
    
    await t.test('threads have exit code: zero', t => {          
      t.assert.strictEqual(threads.filter(exitZero).length, threadpool.size)
    })
    
    await t.test('all threads exit', t => {          
      t.assert.strictEqual(threads.filter(dead).length, threadpool.size)
      t.assert.strictEqual(threads.filter(alive).length, 0)
    })
  })
 
  await t.test('threads take too long to exit', async t => {
    t.before(async () => {
      threadpool = new Threadpool(join(import.meta.dirname, 'task/lag-exit.js'))
      
      await threadpool.start()
      
      threads = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('rejects the returned promise', async t => {   
      threadpool.on('error', err => { console.log(err) })
      await t.assert.rejects(async () => {
        await threadpool.stop()
      })
    })
    
    await t.test('threads are SIGKILL-ed', t => {
      t.assert.strictEqual(threads.filter(sigkilled).length, threadpool.size)
    })
    
    await t.test('all threads exit', t => {
      t.assert.strictEqual(threads.filter(dead).length, threadpool.size)
      t.assert.strictEqual(threads.filter(alive).length, 0)
    })
  })

  await t.test('threads exit wih non-zero during cleanups', async t => {
    t.before(async () => {
      threadpool = new Threadpool(join(import.meta.dirname, 'task/exit-err.js'))
      threadpool.on('error', () => {})
      await threadpool.start()

      threads = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('rejects the returned promise', async t => {          
      await t.assert.rejects(threadpool.stop.bind(threadpool))
    })
    
    // flaky
    await t.skip('thread exits with exit code: non-zero', t => {
      t.assert.strictEqual(threads.filter(exitNonZero).length, 1)
    })

    // flaky
    await t.skip('remaining exit with exit code: zero', t => {
      t.assert.strictEqual(threads.filter(exitZero).length, threadpool.size - 1)
    })
    
    await t.test('all threads exit', t => {
      t.assert.strictEqual(threads.filter(dead).length, threadpool.size)
      t.assert.strictEqual(threads.filter(alive).length, 0)
    })
  })

  await t.test('threads unresponsive to shutdown signals', async t => {
    t.before(async () => {
      threadpool = new Threadpool(
        join(import.meta.dirname, 'task/no-exit-fn.js')
      )
      
      await threadpool.start()

      threads = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('rejects the returned promise', async t => { 
      await t.assert.rejects(threadpool.stop.bind(threadpool))
    })

    await t.test('threads are SIGKILL-ed', t => {
      t.assert.strictEqual(threads.filter(sigkilled).length, threadpool.size)
    })

    await t.test('all threads exit', t => {
      t.assert.strictEqual(threads.filter(dead).length, threadpool.size)
      t.assert.strictEqual(threads.filter(alive).length, 0)
    })
  })

  await t.test('threads with a blocked event loop', async t => {
    t.before(async () => {
      threadpool = new Threadpool(
        join(import.meta.dirname, 'task/blocked-loop.js')
      )
      
      await threadpool.start()

      threads = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('rejects the returned promise', async t => { 
      await t.assert.rejects(threadpool.stop.bind(threadpool))
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
