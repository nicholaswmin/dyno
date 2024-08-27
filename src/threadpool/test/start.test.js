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

      pool = new Threadpool(task('ok.js'))
      
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
  
  
  
  test('thread env. vars', async t => {
    const pool = new Threadpool(task('env.js'), 2, { FOO: 'BAR', BAZ: 'QUUX' })
    const envs = await pool.start()
      .then(() => new Promise(resolve => pool.on('pong', resolve).emit('ping')))
      .finally(pool.stop.bind(pool))
  
    
    await t.test('passes env. vars', async t => {
      t.assert.ok(Object.hasOwn(envs, 'FOO'), 'missing env. variable "FOO"')
      t.assert.strictEqual(envs.FOO, 'BAR')
      
      t.assert.ok(Object.hasOwn(envs, 'BAZ'), 'missing env. variable "BAZ"')
      t.assert.strictEqual(envs.BAZ, 'QUUX')
    })
  
    
    await t.test('passes a spawn index', t => {
      t.assert.ok(Object.hasOwn(envs, 'index'), 'missing env. variable "index"')
      t.assert.strictEqual(typeof +envs.index, 'number')
    })
  })

  
  
  t.test('threads throw startup exception', async t => {
    t.beforeEach(() => {
      cp.fork.mock.resetCalls()

      pool = new Threadpool(task('spawn-err.js'))
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
      pool = new Threadpool(task('blocked-loop.js'))
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
      t.before(() => pool = new Threadpool(task('run-err.js')))
  
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
