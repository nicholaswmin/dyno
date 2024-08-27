import test from 'node:test'
import { join } from 'node:path'
import { Threadpool } from '../index.js'

const load = filename => join(import.meta.dirname, `./threadfiles/${filename}`)

test('#broadcast()', { timeout: 1000 }, async t => {
  const pool = new Threadpool(load('pong.js'), 4)

  const pingpong = (times = 1, pongs = []) => new Promise(resolve => {
    pool.on('pong', data => pongs.push(data) === Math.floor(times * pool.size) 
      ? resolve(pongs) 
      : null
    )

    for (let i = 0; i < times; i++) 
      pool.broadcast('ping', { foo: 'bar' })
  })
  
  t.after(() => pool.stop())
  
  await t.test('ping/pongs across 4 threads', async t => {    
    const pongs = []
    
    await t.test('starts up', () => pool.start())

    await t.test('sends 250 pings, gets 1000 pongs', async t => {
      await pingpong(250, pongs)

      t.assert.ok(pongs.length > 0, 'no pongs received')
      t.assert.strictEqual(pongs.length, 1000)
    })

    await t.test('equally distributed', t => {  
      t.plan(pool.size)
  
      const groups = Object.values(Object.groupBy(pongs, ({ pid }) => pid))

      groups.forEach(g => t.assert.strictEqual(g.length, 1000 / pool.size))
    })
    
    await t.test('from every thread', t => {    
      const pids = Object.keys(Object.groupBy(pongs, ({ pid }) => pid))
  
      t.assert.strictEqual(pids.length, pool.size)
    })
    
    await t.test('passes included data', t => {
      t.plan(2000)

      pongs.forEach(pong => {
        t.assert.strictEqual(typeof pong.foo, 'string')
        t.assert.strictEqual(pong.foo, 'bar')
      })
    })
  })    
})
