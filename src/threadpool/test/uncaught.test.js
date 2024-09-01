import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'
import { Threadpool } from '../index.js'

const alive = cp => !cp.killed
const load  = file => join(import.meta.dirname, `./child-modules/${file}`)

test('threads throw runtime error', async t => {
  cp.fork      = t.mock.fn(cp.fork)
  cp.instances = () => cp.fork.mock.calls.map(call => call.result)

  let pool = null
  let err  = null

  t.beforeEach(() => {
    pool = new Threadpool(load('run-err.js'), 2)
    cp.fork.mock.resetCalls()
  })
  
  await t.test('emits a "pool-error" event', async t => {
    err = await new Promise((resolve, reject) => 
      pool.once('pool-error', resolve).start().catch(reject))
  })
  
  await t.test('event includes an Error instance', t => {
    t.assert.ok(err, 'error is falsy or undefined')
    t.assert.ok(err instanceof Error, 'error is not an Error instance')
  })

  await t.test('shutdown succeeds', async t => {      
    await t.test('error message includes thread error', t => {
      t.assert.ok(err.message.includes('Simulated Runtime Error'), 
        `error: "${err.message}", expected "Simulated Runtime Error"`
      )
    })
  })
  
  await t.test('shutdown fails', async t => {
    t.before(async () => {
      pool.stop = t.mock.fn(pool.stop)
      pool.stop.mock.mockImplementationOnce(() => 
        Promise.reject(new Error('simulated stop() error')))

      err = await new Promise((resolve, reject) => 
        pool.once('pool-error', resolve).start().catch(reject))
    })
    
    await t.test('error message includes pool stop error', t => {
      t.assert.ok(err.message.includes('simulated stop() error'), 
        `error: "${err.message}", expected "simulated stop() error"`
      )
    })
    
    await t.test('error cause includes the thread error', t => {
      t.assert.ok(err.cause, 'Error does not have a cause set')
      t.assert.ok(err.cause.message.includes('Runtime Error'), 
        `error.cause: "${err.cause.message}", expected "Runtime Error"`
      )
    })
  })
  
  await t.test('all threads exit', t => {     
    t.assert.strictEqual(cp.instances().filter(alive).length, 0)
  })
})

test('child_process emits "error" event', async t => {
  const pool = new Threadpool(load('ok.js'))

  cp.fork = t.mock.fn(cp.fork)
  cp.instances = () => cp.fork.mock.calls.map(call => call.result)
  t.afterEach(() => pool.stop())

  // @TODO
  // - change `t.todo(..` to `await t.test(...`
  // - fix test failing on `ChildProcess` emitting 'error' event, 
  //   seems like 'error' is crashing the process
  t.todo('re-emitted as "thread-error" w/o crashing', async t => {
    t.before(() => pool.start())

    const err = await new Promise((resolve, reject) => {
      pool.once('thread-error', resolve)
      cp.instances().at(0).emit('error', new Error('Simulated CP Error'))
    })

    t.assert.ok(err.message.includes('Simulated CP Error'), 
      `error: "${err.message}", expected "Simulated CP Error"`
    )
  })
})
