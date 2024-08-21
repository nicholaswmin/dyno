import test from 'node:test'
import cp from 'node:child_process'
import path from 'node:path'
import { once } from 'node:events'
import { connected, dead } from './utils/utils.js'

import { Threadpool } from '../index.js'

test('#start()', { timeout: 3000 }, async t => {
  cp.fork   = t.mock.fn(cp.fork)
  cp.spawns = cp.fork.mock.calls.map(call => call.result)

  let pool  = null 

  t.beforeEach(() => cp.fork.mock.resetCalls())
  t.afterEach(()  => pool.stop())

  await t.test('all threads spawn without errors', async t => {
    t.beforeEach(async () => {
      pool = await (new Threadpool(
        path.join(import.meta.dirname, 'task/ok.js'), 7, { foo: 'bar' }
      )).start()
    })
    
    await t.test('as many as specified', t => {
      t.assert.strictEqual(cp.forked().length, pool.size) 
    })
    
    await t.test('all threads are connected and running', t => {
      t.assert.strictEqual(cp.forked().filter(connected).length, pool.size)
    })
    
    await t.test('as independent processes', t => {
      cp.forked().forEach(s => t.assert.strictEqual(typeof s.pid, 'number'))
    })
  })
  
  
  await t.test('threads get passed correct data', async t => {
    t.before(async () => {
      pool = await (new Threadpool(
        path.join(import.meta.dirname, 'task/ok.js'), 3, { foo: 'bar' }
      )).start()
    })

    setImmediate(() => cp.forked().at(0).send('env')) 

    const [ cdata ] = await once(cp.forked().at(0), 'message')

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

  
  // @FIXME 
  // this can't work because `spawn` is emitted regardless if there 
  // is a synchronous exception on startup of the `child_process`. 
  // The NodeJS people (& some Unix people) recommend an initial 
  // IPC `ping/pong` to work around this 
  t.todo('thread fails to spawn', async t => {
    t.beforeEach(async () => {
      pool = await (new Threadpool(
        path.join(import.meta.dirname, 'task/spawn-err.js')
      )).start()
    })
    
    await t.test('start() promise rejects', async t => {
      await t.assert.rejects(() => pool.start())
    })
    
    await t.test('all threads exit', t => {  
      t.assert.strictEqual(cp.forked().filter(alive).length, 0)
    })
  })
  
  
  await t.test('emits a "thread:end" event', async t => {  
    pool = await (new Threadpool(
      path.join(import.meta.dirname, 'task/run-err.js')
    )).start()

    const [ err ] = await once(pool, 'thread:end')
    
    await t.test('with an error argument', async t => {    
      await t.test('an instance of Error', t => {      
        t.assert.ok(err instanceof Error, 'argument is not Error instance')
      })
      
      await t.test('with message as thrown in thread', t => {      
        t.assert.ok(err.message.includes('Error: Simulated Error'),
          '"Simulated Error" thrown in thread')
      })
    })
  })
  
  
  
  await t.test('all threads eventually exit', async t => {
    await once(await pool.start(), 'thread:end')

    t.assert.strictEqual(cp.forked().filter(dead).length, pool.size)
  })
})
