import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'
import { once } from 'node:events'
import { connected, dead, exitZero } from './utils/utils.js'

import { Threadpool } from '../index.js'

test('#start()', async t => {
  let threadpool = null, children = []

  t.before(() => cp.fork = t.mock.fn(cp.fork))
  t.beforeEach(() => cp.fork.mock.resetCalls())

  await t.test('all children spawn without errors', async t => {
    t.after(() => threadpool.stop())
    t.before(async () => {
      threadpool = new Threadpool(join(import.meta.dirname, 'task/ok.js'), 7, { 
        foo: 'bar' 
      })
      
      await threadpool.start()

      children = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('child processes spawn', async t => {
      await t.test('as many as specified', async t => {
        t.assert.strictEqual(children.length, 7) 
      })
      
      await t.test('all children are connected and running', t => {
        const connectedChildrenCount = children.filter(connected).length

        t.assert.strictEqual(connectedChildrenCount, threadpool.count)
      })
      
      await t.test('as independent processes', t => {
        children.forEach(c => t.assert.strictEqual(typeof c.pid, 'number'))
      })
    })  
    
    await t.test('children get passed correct data', async t => {
      const child = children[0]

      setImmediate(() => child.send('env')) 

      const [ cdata ] = await once(child, 'message')

      await t.test('the parameters', t => {
        t.assert.deepStrictEqual(cdata.parameters, { foo: 'bar' })
      })
      
      await t.test('its spawn index relative to its siblings', t => {
        t.assert.strictEqual(typeof +cdata.childIndex, 'number')
      })

      await t.test('sets its index as "SPAWN_INDEX" env. var', t => {
        t.assert.strictEqual(typeof cdata.env.SPAWN_INDEX, 'string')
        t.assert.ok(cdata.env.SPAWN_INDEX.length > 0, 'must have length')
      })
    })
  })
  
  // this can't work because `spawn` is emitted regardless if there 
  // is a synchronous exception on startup of the `child_process`. 
  // The NodeJS people recommend an initial IPC `ping/pong`, 
  // but I don't find that clean'
  t.todo('child fails to spawn', async t => {
    t.beforeEach(async () => {
      threadpool = new Threadpool(join(import.meta.dirname, 'task/spawn-err.js'), { 
        parameters: { foo: 'bar' },  count: 3 
      })      
      
      await threadpool.start()
      
      children = cp.fork.mock.calls.map(c => c.result)
    })
    
    await t.test('start() promise rejects', async t => {
      await t.assert.rejects(() => threadpool.start())
    })
    
    await t.test('all children exit', async t => {  
      t.assert.strictEqual(children.filter(alive).length, 0)
    })
  })
  
  await t.test('child exits != 0, after spawn', { timeout: 500 }, async t => {
    const children = []
  
    t.beforeEach(() => {
      threadpool = new Threadpool(join(import.meta.dirname, 'task/run-err.js'), 4)      
    })
    
    await t.test('emits an "error" event', async t => {
      queueMicrotask(() => threadpool.start())
  
      await once(threadpool, 'error')
    })
    
    await t.test('cleans up', { timeout: 500 }, async t => {
      queueMicrotask(() => threadpool.start())
        
      await once(threadpool, 'error')
  
      const children = cp.fork.mock.calls.map(c => c.result)
  
      await t.test('all children exit', async t => {
        t.assert.strictEqual(children.filter(dead).length, threadpool.count)
      })
  
      await t.test('with zero exit codes', t => {
        t.assert.strictEqual(
          children.filter(exitZero).length, 
          threadpool.count - 1
        )
      })
    })
  })
})
