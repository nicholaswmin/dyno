import test from 'node:test'
import { EventEmitter } from 'node:events'

import { task } from './utils/utils.js'
import { Threadpool } from '../index.js'


test('#broadcast()', async t => {
  const pool = new Threadpool(task('pong.js'))
  
  t.before(() => pool.start())
  t.after(() => pool.stop())
  
  await t.test('broadcasting "n" pings', async t => {    
    let pongs = []

    t.before(async () => {
      pongs = await new Promise(resolve => {
        pool.on('pong', data => pongs.push(data) && 
          pongs.length === 10 * pool.size ? resolve(pongs) : null)
        
        for (let i = 0; i < 10; i++)
          pool.broadcast('ping', { foo: 'bar' })
      })
    })
    
    
    await t.test('gets back ("n" * pool size) pongs', t => {
      t.assert.ok(pongs.length > 0, 'no pongs received')
      t.assert.strictEqual(pongs.length, 10 * pool.size)
    })
  
    await t.test('from every thread', t => {    
      const pids = Object.keys(Object.groupBy(pongs, ({ pid }) => pid))
  
      t.assert.strictEqual(pids.length, pool.size)
    })
    
    await t.test('in an equal distribution', t => {    
      const groups = Object.values(Object.groupBy(pongs, ({ pid }) => pid))
      
      t.assert.strictEqual(groups.length, pool.size)
  
      groups.forEach(group => t.assert.strictEqual(group.length, 10))
    })
    
    await t.test('passing their set data', t => {
      pongs.forEach(pong => {
        t.assert.ok(Object.hasOwn(pong, 'foo'), 'cant find data prop. "foo" ')
        t.assert.strictEqual(pong.foo, 'bar')
      })
    })
  })
})
