import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'
import { Threadpool } from '../../../index.js'

const fork = cp.fork
const load = file => join(import.meta.dirname, `../../child-modules/${file}`)
const mockResultMethods = fns => ({ result }) => Object.assign(
  result, Object.keys(fns).reduce((instance, fn) => ({ 
    [fn]: fns[fn].bind(instance) 
  }), result)
)

test('#emit() non-started pool', async t => {
  const pool = new Threadpool(load('pong.js'), 2)

  await t.test('rejects with error', async t => {
    await t.assert.rejects(pool.emit.bind(pool, 'foo'), {
      message: /not started/
    })
  })
})


test('#emit() stopped pool', async t => {
  const pool = new Threadpool(load('pong.js'), 2)

  t.before(async () => {
    await pool.start()
    await pool.stop()
  })  

  await t.test('rejects with error', async t => {
    await t.assert.rejects(pool.emit.bind(pool, 'foo'), {
      message: /stopped/
    })
  })
})


test('#emit() IPC has error', async t => {
  cp.fork = t.mock.fn(fork)
  
  const pool = new Threadpool(load('pong.js'), 2)

  t.before(() => pool.start()) 
  t.after(() => pool.stop())

  await t.test('rejects with error', async t => {
    cp.fork.mock.calls.map(mockResultMethods({
      send: (...args) => args.find(arg => arg instanceof Function)(
        new Error('Simulated Error')
      )
    }))

    await t.assert.rejects(pool.emit.bind(pool, 'foo'), {
      message: /Simulated Error/
    })
  })
})


test('#emit() IPC indicates rate limit', async t => {
  cp.fork = t.mock.fn(fork)
  
  const pool = new Threadpool(load('pong.js'), 2)
  
  t.afterEach(() => pool.stop())
  t.before(() => pool.start())  

  await t.test('rejects with "rate exceeded" error', async t => {
    cp.fork.mock.calls.map(mockResultMethods({
      send: () => false
    }))

    await t.assert.rejects(pool.emit.bind(pool, 'foo'), {
      message: /rate exceeded/
    })
  })
})
