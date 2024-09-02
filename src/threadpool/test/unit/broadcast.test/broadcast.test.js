import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { Threadpool } from '../../../index.js'

const load = file => join(import.meta.dirname, `../../child-modules/${file}`)
const dbouncer = t => (fn, ms) => t = clearTimeout(t) || setTimeout(fn, ms)

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
      const _id = randomUUID()

      pool.on('pong', ({ id }) => {
        if (id === _id) 
          dbounce(resolve, 50)
      })
      .broadcast('ping', { id: _id }).catch(reject)
    })

    t.assert.strictEqual(dbounce.mock.callCount(), pool.size,
      `expected: ${pool.size} pongs`)
  })
  
  await t.test('event sent uniformly across threads', async t => {
    t.plan(pool.size)
    
    const pids = await new Promise((resolve, reject) => {
      const pids = [], pingID = randomUUID()

      pool.on('pong', ({ pid, pongID }) => {
        if (pongID !== pingID) 
          return

        if (pids.push({ pid }) % pool.size * 2 === 0)
          resolve(pids)
      }).broadcast('ping', { pongID: pingID }).catch(reject)
    })

    Object.values(Object.groupBy(pids, ({ pid }) => pid)).forEach(pongs => {
      t.assert.strictEqual(pongs.length, 1)
    })
  })
  
  await t.test('sends event data', async t => {
    const data = await new Promise((resolve, reject) => {
      pool.once('pong', resolve).broadcast('ping', { foo: 123 }).catch(reject)
    })
    
    t.assert.strictEqual(typeof data.foo, 'number')
    t.assert.strictEqual(data.foo, 123)
  })
})
