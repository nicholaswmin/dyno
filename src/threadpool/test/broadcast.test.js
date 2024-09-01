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

test('#broadcast()', async t => {
  const pool = new Threadpool(load('pong.js'))

  t.before(() => pool.start())    
  t.after(() => pool.stop())

  await t.test('resolves IPC send result list', async t => {
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
      const _pingid = randomUUID()

      pool.on('pong', ({ id }) => {
        if (id === _pingid) 
          dbounce(resolve, 50)
      })
      .broadcast('ping', { id: _pingid }).catch(reject)
    })

    t.assert.strictEqual(dbounce.mock.callCount(), pool.size,
      `expected: ${pool.size} pongs`)
  })
  
  await t.test('event sent uniformly across threads', async t => {
    t.plan(pool.size)
    
    const pids = await new Promise((resolve, reject) => {
      const _pids = [], _pingid = randomUUID()

      pool.on('pong', ({ pid, id }) => {
        if (id === _pingid && _pids.push({ pid }) % pool.size * 2 === 0)
          resolve(_pids)
      }).broadcast('ping', { id: _pingid }).catch(reject)
    })

    Object.values(Object.groupBy(pids, ({ pid }) => pid)).forEach(pongs => {
      t.assert.strictEqual(pongs.length, 1)
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

test('#broadcast() parallel instances', async t => {  
  const pools = [
    new Threadpool(load('pong.js'), 2),
    new Threadpool(load('pong.js'), 5),
    new Threadpool(load('pong.js'))
  ]
  
  t.before(() => Promise.all(pools.map(pool => pool.start())))  
  t.after(() => Promise.all(pools.map(pool => pool.stop())))  

  await t.test('each pool gets its own pongs, only', async t => {
    const pongs = await Promise.all(pools.map((pool, i) => 
      new Promise((resolve, reject) => {
        const dbounce = t.mock.fn(dbouncer(t._timer))
  
        pool.on('pong', () => dbounce(() => resolve({ 
            got: dbounce.mock.callCount(), 
            exp: pool.size 
          }), 50)
        )
        .broadcast('ping')
        .catch(reject)
  
      })
    ))
    
    t.plan(pools.length)

    pongs.forEach(({ got, exp }, i) => {
      t.assert.strictEqual(got, exp, `${i}, expected: ${exp}, got: ${got}`)
    })
  })
})

test('#broadcast() non-started pool', async t => {
  const pool = new Threadpool(load('pong.js'))

  await t.test('rejects with error', async t => {
    await t.assert.rejects(pool.broadcast.bind(pool, 'foo'), {
      message: /not started/
    })
  })
})

test('#broadcast() stopped pool', async t => {
  const pool = new Threadpool(load('pong.js'))

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

  const pool = new Threadpool(load('pong.js'))

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

  const pool = new Threadpool(load('pong.js'))
  
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
