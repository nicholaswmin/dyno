import test from 'node:test'
import cp from 'node:child_process'
import path from 'node:path'
import { alive, dead, exitZero, exitNonZero, sigkilled } from './utils/utils.js'

import { Threadpool } from '../index.js'

test('#stop()', { timeout: 3000 }, async t => {
  cp.fork   = t.mock.fn(cp.fork)
  cp.forked = () => cp.fork.mock.calls.map(call => call.result)

  let pool = null 

  t.afterEach(() => pool.stop())

  await t.test('threads exit normally', async t => {    
    t.before(async () => {
      cp.fork.mock.resetCalls()

      pool = await (
        new Threadpool(path.join(import.meta.dirname, 'task/ok.js')).start()
      )
    })

    await t.test('resolves an array of exit codes: zero', async t => {   
      const exitCodes = await pool.stop()
      
      t.assert.deepStrictEqual(exitCodes, [0,0,0,0])
    })
    
    await t.test('threads have exit code: zero', t => {          
      t.assert.strictEqual(cp.forked().filter(exitZero).length, pool.size)
    })

    await t.test('all threads eventually exit', t => {          
      t.assert.strictEqual(cp.forked().filter(dead).length, pool.size)
      t.assert.strictEqual(cp.forked().filter(alive).length, 0)
    })
  })

  
  await t.test('threads take too long to exit', async t => {
    t.before(async () => {
      cp.fork.mock.resetCalls()

      pool = await (new Threadpool(
        path.join(import.meta.dirname, 'task/lag-exit.js'))).start()
    })
    
    await t.test('rejects the returned promise', async t => {   
      return t.assert.rejects(() => pool.stop())
    })
    
    await t.test('threads are force killed', t => {
      t.assert.strictEqual(cp.forked().filter(sigkilled).length, pool.size)
    })
    
    await t.test('all threads eventually exit', t => {          
      t.assert.strictEqual(cp.forked().filter(dead).length, pool.size)
      t.assert.strictEqual(cp.forked().filter(alive).length, 0)
    })
  })
  
  
  await t.test('threads exit wih non-zero during cleanups', async t => {
    t.before(async () => {
      cp.fork.mock.resetCalls()

      pool = await (new Threadpool(
        path.join(import.meta.dirname, 'task/exit-err.js')
      ).start())
    })
    
    await t.test('rejects the returned promise', async t => { 
      await t.assert.rejects(pool.stop.bind(pool))
    })
    
    await t.test('all threads eventually exit', t => {      
      t.assert.strictEqual(cp.forked().filter(dead).length, pool.size)
      t.assert.strictEqual(cp.forked().filter(alive).length, 0)
    })

    // @FIXME flaky
    t.todo('thread exits with exit code: non-zero', t => {
      t.assert.strictEqual(cp.forked().filter(exitNonZero).length, 1)
    })

    // @FIXME flaky
    t.todo('remaining exit with exit code: zero', t => {
      t.assert.strictEqual(cp.forked().filter(exitZero).length, pool.size - 1)
    })
  })

  
  await t.test('threads unresponsive to shutdown signals', async t => {
    t.before(async () => {
      cp.fork.mock.resetCalls()
      pool = await (new Threadpool(
        path.join(import.meta.dirname, 'task/no-exit-fn.js'), 2)
      ).start()
    })
    
    await t.test('rejects the returned promise', async t => { 
      await t.assert.rejects(pool.stop.bind(pool))
    })

    await t.test('threads are SIGKILL-ed', t => {
      t.assert.strictEqual(cp.forked().filter(sigkilled).length, pool.size)
    })

    await t.test('all threads eventually exit', t => {          
      t.assert.strictEqual(cp.forked().filter(dead).length, pool.size)
      t.assert.strictEqual(cp.forked().filter(alive).length, 0)
    })
  })

  
  await t.test('threads with a blocked event loop', async t => {
    t.before(async () => {
      cp.fork.mock.resetCalls()
      pool = await (new Threadpool(
        path.join(import.meta.dirname, 'task/blocked-loop.js'), 2)
      ).start()
    })
    
    await t.test('rejects the returned promise', async t => { 
      await t.assert.rejects(pool.stop.bind(pool))
    })

    await t.test('threads are SIGKILL-ed', t => {
      t.assert.strictEqual(cp.forked().filter(sigkilled).length, 2)
    })

    await t.test('all threads eventually exit', t => {          
      t.assert.strictEqual(cp.forked().filter(dead).length, 2)
      t.assert.strictEqual(cp.forked().filter(alive).length, 0)
    })
  })
})
