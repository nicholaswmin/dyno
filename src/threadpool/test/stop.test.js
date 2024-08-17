import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'
import { once } from 'node:events'
import { alive, dead, exitZero, exitNonZero, sigkilled } from './utils/utils.js'

import Threads from '../index.js'

test('#stop(', async t => {
  let threads = null, children = []
  
  t.before(() => cp.fork = t.mock.fn(cp.fork))
  t.beforeEach(() => cp.fork.mock.resetCalls())
  t.afterEach(() => threads.stop())

  await t.test('children exit when signalled: "exit"', async t => {
    t.before(async () => {
      threads = new Threads(join(import.meta.dirname, '/task/ok.js'))

      await threads.start() && await threads.stop()

      children = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('with exit code: zero', t => {          
      t.assert.strictEqual(children.filter(exitZero).length, 4)
    })
    
    await t.test('all children exit', t => {          
      t.assert.strictEqual(children.filter(dead).length, 4)
      t.assert.strictEqual(children.filter(alive).length, 0)
    })
  })
 
  await t.test('children take too long to exit', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] })

    t.before(async () => {
      threads = new Threads(join(import.meta.dirname, 'task/slow-exit.js'))
      
      setImmediate(() => t.mock.timers.tick(2000))
      await threads.start() && await threads.stop()
      
      children = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('children are SIGKILL-ed', t => {
      t.assert.strictEqual(children.filter(sigkilled).length, 4)
    })
    
    await t.test('all children exit', t => {
      t.assert.strictEqual(children.filter(dead).length, 4)
      t.assert.strictEqual(children.filter(alive).length, 0)
    })
  })
  
  await t.test('child exits with non-zero during cleanups', async t => {
    t.before(async () => {
      threads = new Threads(join(import.meta.dirname, 'task/exit-err.js'))
      
      await threads.start() && await threads.stop()

      children = cp.fork.mock.calls.map(c => c.result)
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
  
  await t.test('child does not listen for "exit" signals', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] })

    t.before(async () => {
      threads = new Threads(join(import.meta.dirname, 'task/no-exit-fn.js'))
      
      setImmediate(() => t.mock.timers.tick(2000))
      await threads.start() && await threads.stop()

      children = cp.fork.mock.calls.map(c => c.result)
    })

    await t.test('children are SIGKILL-ed', t => {
      t.assert.strictEqual(children.filter(sigkilled).length, 4)
    })

    await t.test('all children exit', t => {
      t.assert.strictEqual(children.filter(dead).length, 4)
      t.assert.strictEqual(children.filter(alive).length, 0)
    })
  })
  
  await t.test('child has a blocked event loop', async t => {
    t.before(async () => {
      threads = new Threads(join(import.meta.dirname, 'task/blocked-loop.js'))
      
      await threads.start() && await threads.stop()

      children = cp.fork.mock.calls.map(c => c.result)
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
