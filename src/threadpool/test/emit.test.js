import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { Threadpool } from '../index.js'

const fork = cp.fork
const load = file => join(import.meta.dirname, `./child-modules/${file}`)
const dbouncer = t => (fn, ms) => t = clearTimeout(t) || setTimeout(fn, ms)
const mockResultMethods = fns => ({ result }) => Object.assign(
  result, Object.keys(fns).reduce((instance, fn) => ({ 
    [fn]: fns[fn].bind(instance) 
  }), result)
)

test('#emit()', async t => {
  const pool = new Threadpool(load('pong.js'))

  t.after(() => pool.stop())
  t.before(() => pool.start())    

  await t.test('resolves true', async t => {
    t.assert.strictEqual(await pool.emit('ping'), true)
  })

  await t.test('sends event', async t => {
    const result = await new Promise((resolve, reject) =>  
      pool.once('pong', resolve).emit('ping').catch(reject))

    t.assert.ok(result)
  })

  await t.test('sends event, only once', async t => {
    const dbounce = t.mock.fn(dbouncer(t._timer)), pingID = randomUUID()
    
    await new Promise((resolve, reject) => {
      pool.on('pong', ({ pongID }) => pongID === pingID 
        ? dbounce(resolve, 50) 
        : null
      ).emit('ping', { pongID: pingID }).catch(reject)
    })

    t.assert.strictEqual(dbounce.mock.callCount(), 1, 'got back > 1 pong')
  })
  
  await t.test('sends event uniformly across threads', async t => {
    t.plan(pool.size)

    const pids = await new Promise((resolve, reject) => {
      const pids = [], pingID = randomUUID()

      pool.on('pong', ({ pid, pongID }) => {
        if (pongID !== pingID) return
        
        return pids.push({ pid }) % pool.size === 0
          ? resolve(pids)
          : pool.emit('ping', { pongID: pingID }).catch(reject)
      }).emit('ping', { pongID: pingID }).catch(reject)
    })
    
    const pongsPerPID = Object.values(Object.groupBy(pids, ({ pid }) => pid))
  
    pongsPerPID.forEach(group => t.assert.strictEqual(group.length, 1))
  })
  
  await t.test('sends event data', async t => {
    const data = await new Promise((resolve, reject) => {
      pool.once('pong', resolve).emit('ping', { foo: 123 }).catch(reject)
    })
    
    t.assert.strictEqual(typeof data.foo, 'number')
    t.assert.strictEqual(data.foo, 123)
  })
})



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
