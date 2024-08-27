import test from 'node:test'
import { EventEmitter } from 'node:events'

import { task } from './utils/utils.js'
import { Threadpool } from '../index.js'


test('#broadcast()', async t => {
  const pool = new Threadpool(task('pong.js'), 5), pongs = []
  
  t.before(() => pool.start())
  t.after(() => pool.stop())
  
  await t.test('broadcasts "n" pings', (t, done) => {    
    pool.on('pong', data => pongs.push(data) && 
      pongs.length === 10 * pool.size ? done() : null)
    
    for (let i = 0; i < 10; i++)
      pool.broadcast('ping', { foo: 'bar' })
  })
  
  await t.test('... getting back ("n" * pool size) pongs', t => {
    t.assert.ok(pongs.length > 0, 'no pongs received')
    t.assert.strictEqual(pongs.length, 10 * pool.size)
  })

  await t.test('... from every thread', t => {    
    const pids = Object.keys(Object.groupBy(pongs, ({ pid }) => pid))

    t.assert.strictEqual(pids.length, pool.size)
  })
  
  await t.test('... distributed equally between threads', t => {    
    const pidPongs = Object.values(Object.groupBy(pongs, ({ pid }) => pid))
    
    t.assert.strictEqual(pidPongs.length, pool.size)

    pidPongs.forEach(group => t.assert.strictEqual(group.length, 10))
  })
  
  await t.test('... and correctly passing their set data', t => {
    pongs.forEach(pong => {
      t.assert.ok(Object.hasOwn(pong, 'foo'), 'cant find data prop. "foo" ')
      t.assert.strictEqual(pong.foo, 'bar')
    })
  })
})
