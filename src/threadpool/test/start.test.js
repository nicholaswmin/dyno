import test from 'node:test'
import cp from 'node:child_process'
import { task, connected, alive, dead } from './utils/utils.js'

import { Threadpool } from '../index.js'


test('#start()', async t => {
  let pool       = null
  cp.fork        = t.mock.fn(cp.fork)
  cp.instances   = () => cp.fork.mock.calls.map(c => c.result)
  t.afterEach(() => pool.stop())


  await t.test('threads spawn normally', async t => {
    t.before(() => {
      cp.fork.mock.resetCalls()

      pool = new Threadpool(task('ok.js'), 2)
      
      return pool.start()
    })
    
    await t.test('all running ok', t => {
      t.assert.strictEqual(cp.instances().filter(connected).length, pool.size)
    })

    await t.test('as many as specified', async t => {
      t.assert.strictEqual(cp.instances().length, pool.size) 
    })
    
    await t.test('as independent processes', t => {
      cp.instances().forEach(p => t.assert.strictEqual(typeof p.pid, 'number'))
    })
  })
  
  t.test('threads throw startup exception', async t => {
    t.beforeEach(() => {
      cp.fork.mock.resetCalls()

      pool = new Threadpool(task('spawn-err.js'), 2)
    })
    
    await t.test('start() promise rejects', async t => {
      await t.assert.rejects(() => pool.start(), { message: /SIGKILL/ })
    })
    
    await t.test('all threads exit', async t => {  
      t.assert.strictEqual(cp.instances().filter(connected).length, 0)
      t.assert.strictEqual(cp.instances().filter(alive).length, 0)
    })
  })
  
  await t.test('threads with blocked event loop', async t => {
    t.before(() => {
      cp.fork.mock.resetCalls()
      pool = new Threadpool(task('blocked-loop.js'), 2)
    })
    
    await t.test('function call rejects', async t => {   
      await t.assert.rejects(pool.start.bind(pool), {
        message: /SIGKILL/
      })
    })

    await t.test('all threads exit', t => {     
      t.assert.strictEqual(cp.instances().filter(alive).length, 0)
    })
  })
  
  await t.test('threads throw runtime error', async t => {  
    await t.test('emits a "thread-error" event', (t, done) => {
      t.before(() => pool = new Threadpool(task('run-err.js'), 2))
  
      pool.once('thread-error', err => {
        t.assert.ok(err instanceof Error, 'argument is not an Error instance')
        t.assert.ok(
          err.message.includes('Runtime Error'), 
          `err.message is: "${err.message}" instead of "Runtime Error"`
        )
        
        done()
      })
      
      pool.start()
    })
  })
})
