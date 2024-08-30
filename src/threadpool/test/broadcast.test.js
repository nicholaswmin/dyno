import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'
import { Threadpool } from '../index.js'

const fork = cp.fork
const load = filename => join(import.meta.dirname, `./child/${filename}`)
const dbouncer = t => (fn, ms) => t = clearTimeout(t) || setTimeout(fn, ms)
const mockResultMethods = fns => ({ result }) => Object.assign(
  result, Object.keys(fns).reduce((instance, fn) => ({ 
    [fn]: fns[fn].bind(instance) 
  }), result)
)

test('#broadcast()', async t => {
  let pool = null

  t.afterEach(() => pool.stop())
  t.beforeEach(() => {
    pool = new Threadpool(load('pong.js'), 2)
    return pool.start()
  })    

  await t.test('resolves array of IPC send results', async t => {
    const results = await pool.broadcast('ping')

    t.assert.ok(Array.isArray(results), 'resolved results is not an Array')
    results.forEach((result, i) => 
      t.assert.strictEqual(result, true, `result: ${i} is not true`))
  })

  await t.test('sends event', async t => {
    await new Promise((resolve, reject) =>  
      pool.once('pong', resolve).broadcast('ping').catch(reject))
  })

  await t.test('sends event to all threads', async t => {
    const dbounce = t.mock.fn(dbouncer(t._timer))
    
    await new Promise((resolve, reject) => {
      pool.on('pong', () => dbounce(resolve, 50))
        .broadcast('ping').catch(reject)
    })

    t.assert.strictEqual(dbounce.mock.callCount(), pool.size,
      `expected: ${pool.size} pongs`)
  })
  
  await t.test('event sent uniformly across threads', async t => {
    t.plan(pool.size)

    const pids = await new Promise((resolve, reject) => {
      let _pids = []

      pool.on('pong', ({ pid, startup_ping }) => 
        startup_ping === false
          ? _pids.push({ pid }) % (pool.size * 2) === 0
            ? resolve(_pids)
          : null
        : pool.broadcast('ping', { startup_ping: false }).catch(reject)
      ).broadcast('ping', { startup_ping: true }).catch(reject)
    })

    Object.values(Object.groupBy(pids, ({ pid }) => pid)).forEach(pongs => {
      t.assert.strictEqual(pongs.length, 2)
    })
  })
  
  await t.test('sends event data', async t => {
    const data = await new Promise((resolve, reject) => {
      pool.once('pong', resolve)
        .broadcast('ping', { foo: 123 }).catch(reject)
    })
    
    t.assert.strictEqual(typeof data.foo, 'number')
    t.assert.strictEqual(data.foo, 123)
  })
})

test('#broadcast() non-started pool', async t => {
  const pool = new Threadpool(load('pong.js'), 2)

  await t.test('rejects with error', async t => {
    await t.assert.rejects(pool.broadcast.bind(pool, 'foo'), {
      message: /not started/
    })
  })
})

test('#broadcast() stopped pool', async t => {
  const pool = new Threadpool(load('pong.js'), 2)

  t.before(async () => {
    await pool.start()
    await pool.stop()
  })  

  await t.test('rejects with error', async t => {
    await t.assert.rejects(pool.broadcast.bind(pool, 'foo'), {
      message: /stopped/
    })
  })
})

test('#broadcast() IPC has error', async t => {
  cp.fork = t.mock.fn(fork)

  const pool = new Threadpool(load('pong.js'), 2)

  t.before(() => pool.start()) 
  t.after(() => pool.stop())

  await t.test('rejects with callback error', async t => {
    cp.fork.mock.calls.map(mockResultMethods({
      send: (...args) => args.find(arg => arg instanceof Function)(
        new Error('Simulated Error')
      )
    }))

    await t.assert.rejects(pool.broadcast.bind(pool, 'foo'), {
      message: /Simulated Error/
    })
  })
})


test('#broadcast() IPC indicates rate limit', async t => {
  cp.fork = t.mock.fn(fork)

  const pool = new Threadpool(load('pong.js'), 2)
  
  t.after(() => pool.stop())
  t.before(() => pool.start())  

  await t.test('rejects with "rate exceeded" error', async t => {
    cp.fork.mock.calls.map(mockResultMethods({
      send: () => false
    }))

    await t.assert.rejects(pool.broadcast.bind(pool, 'foo'), {
      message: /rate exceeded/
    })
  })
})
