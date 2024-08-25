import test from 'node:test'
import cp from 'node:child_process'
import path from 'node:path'
import { once } from 'node:events'
import { task, connected, alive, dead } from './utils/utils.js'

import { Threadpool } from '../index.js'

test('#start()', { timeout: 2000 }, async t => {
  let pool       = null
  cp.fork        = t.mock.fn(cp.fork)
  cp.instances   = () => cp.fork.mock.calls.map(c => c.result)
  t.afterEach(() => pool.stop())
  

  await t.test('all threads spawn', async t => {
    t.before(() => {
      cp.fork.mock.resetCalls()

      pool = new Threadpool(task('ok.js'), 4, { foo: 'bar' })
      
      return pool.start()
    })
    
    await t.test('all connected and running', t => {
      t.assert.strictEqual(cp.instances().filter(connected).length, pool.size)
    })

    await t.test('as many as specified', async t => {
      t.assert.strictEqual(cp.instances().length, pool.size) 
    })
    
    await t.test('as independent processes', t => {
      cp.instances().forEach(p => t.assert.strictEqual(typeof p.pid, 'number'))
    })
  })
  
  t.test('thread fails to spawn', async t => {
    t.beforeEach(() => {
      cp.fork.mock.resetCalls()

      pool = new Threadpool(task('spawn-err.js'))
    })
    
    await t.test('start() promise rejects', async t => {
      await t.assert.rejects(() => pool.start())
    })
    
    await t.test('all threads exit', async t => {  
      t.assert.strictEqual(cp.instances().filter(connected).length, 0)
      t.assert.strictEqual(cp.instances().filter(alive).length, 0)
    })
  })
  
  await t.test('thread spawns with blocked event loop', async t => {
    t.before(async () => {
      cp.fork.mock.resetCalls()
      pool = new Threadpool(task('blocked-loop.js'))
    })
    
    await t.test('function call rejects', async t => {   
      await t.assert.rejects(pool.start.bind(pool))
    })

    await t.test('all threads eventually exit', t => {     
      t.assert.strictEqual(cp.instances().filter(alive).length, 0)
    })
  })
  
  await t.test('thread encounters a runtime error', async t => {  
    t.before(() => {
      cp.fork.mock.resetCalls()
      pool = new Threadpool(task('run-err.js'))
    })

    queueMicrotask(() => pool.start())

    const [ err ] = await once(pool, 'thread-error')

    await t.test('with an error argument', async t => {    
      await t.test('an instance of Error', t => {
        t.assert.ok(err instanceof Error, 'argument is not Error instance')
      })
    })

    await t.test('all threads eventually exit', t => {          
      t.assert.strictEqual(cp.instances().filter(dead).length, pool.size)
      t.assert.strictEqual(cp.instances().filter(alive).length, 0)
    })
  })
})
