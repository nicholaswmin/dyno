import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'
import { once } from 'node:events'
import { connected, dead } from './utils/utils.js'

import { Threadpool } from '../index.js'

test('#start()', { timeout: 1000 }, async t => {
  let pool = null, threads = []

  t.before(() => cp.fork = t.mock.fn(cp.fork))
  t.beforeEach(() => cp.fork.mock.resetCalls())

  await t.test('all threads spawn without errors', async t => {
    t.after(() => pool.stop())
    t.before(async () => {
      pool = new Threadpool(join(import.meta.dirname, 'task/ok.js'), 7, { 
        foo: 'bar' 
      })
      
      await pool.start()

      threads = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('thread processes spawn', async t => {
      await t.test('as many as specified', async t => {
        t.assert.strictEqual(threads.length, 7) 
      })
      
      await t.test('all threads are connected and running', t => {
        const connectedThreadCount = threads.filter(connected).length

        t.assert.strictEqual(connectedThreadCount, pool.size)
      })
      
      await t.test('as independent processes', t => {
        threads.forEach(c => t.assert.strictEqual(typeof c.pid, 'number'))
      })
    })  
    
    await t.test('threads get passed correct data', async t => {
      const thread = threads[0]

      setImmediate(() => thread.send('env')) 

      const [ cdata ] = await once(thread, 'message')

      await t.test('the parameters', t => {
        t.assert.deepStrictEqual(cdata.parameters, { foo: 'bar' })
      })
      
      await t.test('its spawn index relative to its siblings', t => {
        t.assert.strictEqual(typeof +cdata.childIndex, 'number')
      })

      await t.test('sets its index as "index" env. var', t => {
        t.assert.strictEqual(typeof cdata.env.index, 'string')
        t.assert.ok(cdata.env.index.length > 0, 'must have length')
      })
    })
  })
  
  // this can't work because `spawn` is emitted regardless if there 
  // is a synchronous exception on startup of the `child_process`. 
  // The NodeJS people recommend an initial IPC `ping/pong`, 
  // but I don't find that clean'
  t.todo('thread fails to spawn', async t => {
    t.beforeEach(async () => {
      pool = new Threadpool(
        join(import.meta.dirname, 'task/spawn-err.js'), 
        3, { parameters: { foo: 'bar' } 
      })      
      
      await pool.start()
      
      threads = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('start() promise rejects', async t => {
      await t.assert.rejects(() => pool.start())
    })
    
    await t.test('all threads exit', async t => {  
      t.assert.strictEqual(threads.filter(alive).length, 0)
    })
  })
  
  await t.test('thread exits != 0, after spawn', { timeout: 500 }, async t => {
    const threads = []
  
    t.beforeEach(() => {
      pool = new Threadpool(join(import.meta.dirname, 'task/run-err.js'))      
    })
    
    await t.test('cleans up', { timeout: 500 }, async t => {      
      await pool.start()
      await once(pool, 'end')

      const threads = cp.fork.mock.calls.map(c => c.result)
  
      await t.test('all threads exit', async t => {
        t.assert.strictEqual(threads.filter(dead).length, pool.size)
      })
    })
  })
})
