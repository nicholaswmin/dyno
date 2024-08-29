import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'
import { Threadpool } from '../index.js'

const alive = cp => !cp.killed
const dead  = cp =>  cp.killed
const load  = filename => join(import.meta.dirname, `./child/${filename}`)


test('#start()', async t => {
  let pool     = null 

  cp.fork      = t.mock.fn(cp.fork)
  cp.instances = () => cp.fork.mock.calls.map(call => call.result)

  t.afterEach(() => pool.stop())

  await t.test('threads spawn normally', async t => {
    t.before(() => {
      cp.fork.mock.resetCalls()

      pool = new Threadpool(load('ok.js'))
      
      return pool.start()
    })
    
    await t.test('all running ok', t => {
      t.assert.strictEqual(cp.instances().filter(alive).length, pool.size)
    })

    await t.test('as many as specified', async t => {
      t.assert.strictEqual(cp.instances().length, pool.size) 
    })
    
    await t.test('as independent processes', t => {
      cp.instances().forEach(p => t.assert.strictEqual(typeof p.pid, 'number'))
    })
  })
  
  
  test('thread env. vars', async t => {
    const pool = new Threadpool(load('env.js'), 2, { FOO: 'BAR', BAZ: 'QUUX' })
    const envs = await pool.start()
      .then(() => new Promise(resolve => pool.on('pong', resolve).emit('ping')))
      .finally(pool.stop.bind(pool))
  
    
    await t.test('passes env. vars', async t => {
      t.assert.ok(envs.FOO, 'missing env. variable "FOO"')
      t.assert.strictEqual(envs.FOO, 'BAR')
      
      t.assert.ok(envs.BAZ, 'missing env. variable "BAZ"')
      t.assert.strictEqual(envs.BAZ, 'QUUX')
    })
  
    
    await t.test('passes a spawn index', t => {
      t.assert.ok(Object.hasOwn(envs, 'index'), 'missing env. variable "index"')
      t.assert.strictEqual(typeof +envs.index, 'number')
    })
  })


  t.test('threads throw error on startup', async t => {
    t.beforeEach(() => {
      cp.fork.mock.resetCalls()

      pool = new Threadpool(load('spawn-err.js'))
    })
    
    await t.test('start() promise rejects', async t => {
      await t.assert.rejects(() => pool.start(), { message: /SIGKILL/ })
    })
    
    await t.test('all threads exit', async t => {  
      t.assert.strictEqual(cp.instances().filter(alive).length, 0)
    })
  })
  
  
  await t.test('threads with blocked event loop', async t => {
    t.before(() => {
      cp.fork.mock.resetCalls()
      pool = new Threadpool(load('blocked-loop.js'))
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
})
