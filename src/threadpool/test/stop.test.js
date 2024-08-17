import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'
import { alive, dead, exitZero, exitNonZero, sigkilled } from './utils/utils.js'

import Threads from '../index.js'

test('#stop(', async t => {
  let threads = null, children = []
  
  t.before(() => cp.fork = t.mock.fn(cp.fork))
  t.beforeEach(() => cp.fork.mock.resetCalls())
  t.afterEach(() => threads.stop())

  await t.test('children behaving ideally', async t => {
    t.before(async () => {
      threads = new Threads(join(import.meta.dirname, '/task/ok.js'))

      await threads.start()

      children = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('resolves an array of exit codes: zero', async t => {   
      const exitCodes = await threads.stop()

      t.assert.deepStrictEqual(exitCodes, [0,0,0,0])
    })
    
    await t.test('children have exit code: zero', t => {          
      t.assert.strictEqual(children.filter(exitZero).length, 4)
    })
    
    await t.test('all children exit', t => {          
      t.assert.strictEqual(children.filter(dead).length, 4)
      t.assert.strictEqual(children.filter(alive).length, 0)
    })
  })
 
  await t.test('children take too long to exit', async t => {
    t.before(async () => {
      threads = new Threads(join(import.meta.dirname, 'task/slow-exit.js'))
      
      await threads.start()
      
      children = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('rejects the returned promise', async t => {   
      threads.on('error', t => { console.log(err) })
      await t.assert.rejects(async () => {
        await threads.stop()
      })
    })
    
    await t.test('children are SIGKILL-ed', t => {
      t.assert.strictEqual(children.filter(sigkilled).length, 4)
    })
    
    await t.test('all children exit', t => {
      t.assert.strictEqual(children.filter(dead).length, 4)
      t.assert.strictEqual(children.filter(alive).length, 0)
    })
  })
  
  await t.test('children exit wih non-zero during cleanups', async t => {
    t.before(async () => {
      threads = new Threads(join(import.meta.dirname, 'task/exit-err.js'))
      
      await threads.start()

      children = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('resolves the returned promise', async t => {          
      await t.assert.doesNotReject(threads.stop.bind(threads))
    })
    
    await t.test('child exits with exit code: non-zero', t => {
      t.assert.strictEqual(children.filter(exitNonZero).length, 1)
    })
    
    await t.test('remaining exit with exit code: zero', t => {
      t.assert.strictEqual(children.filter(exitZero).length, 3)
    })
    
    await t.test('all children exit', t => {
      t.assert.strictEqual(children.filter(dead).length, 4)
      t.assert.strictEqual(children.filter(alive).length, 0)
    })
  })
  
  await t.test('children unresponsive to shutdown signals', async t => {
    t.before(async () => {
      threads = new Threads(join(import.meta.dirname, 'task/no-exit-fn.js'))
      
      await threads.start()

      children = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('rejects the returned promise', async t => { 
      await t.assert.rejects(threads.stop.bind(threads))
    })

    await t.test('children are SIGKILL-ed', t => {
      t.assert.strictEqual(children.filter(sigkilled).length, 4)
    })

    await t.test('all children exit', t => {
      t.assert.strictEqual(children.filter(dead).length, 4)
      t.assert.strictEqual(children.filter(alive).length, 0)
    })
  })
  
  await t.test('children with a blocked event loop', async t => {
    t.before(async () => {
      threads = new Threads(join(import.meta.dirname, 'task/blocked-loop.js'))
      
      await threads.start()

      children = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('rejects the returned promise', async t => { 
      await t.assert.rejects(threads.stop.bind(threads))
    })

    await t.test('children are SIGKILL-ed', t => {
      t.assert.strictEqual(children.filter(sigkilled).length, 4)
    })

    await t.test('all children exit', t => {
      t.assert.strictEqual(children.filter(dead).length, 4)
      t.assert.strictEqual(children.filter(alive).length, 0)
    })
  })
})
