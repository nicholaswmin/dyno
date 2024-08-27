import test from 'node:test'
import { EventEmitter } from 'node:events'

import { task } from './utils/utils.js'
import { Threadpool } from '../index.js'


test('#emit()', async t => {
  const pool = new Threadpool(task('pong.js'))
  
  t.before(() => pool.start())
  t.after(() => pool.stop())
  
  await t.test('emitting "n" pings', async t => {    
    let pongs = []

    t.before(async () => {
      pongs = await new Promise(resolve => {
        pool.on('pong', data => pongs.push(data) && 
          pongs.length === pool.size * 2 ? resolve(pongs) : null)
        
        for (let i = 0; i < pool.size * 2; i++)
          pool.emit('ping', { foo: 'bar' })
      })
    })

    await t.test('gets back "n" pongs', t => {    
      t.assert.ok(pongs.length > 0, 'no pongs received')
      t.assert.strictEqual(pongs.length, pool.size * 2)
    })
  
    await t.test('from every thread', t => {    
      const pids = Object.keys(Object.groupBy(pongs, ({ pid }) => pid))
  
      t.assert.strictEqual(pids.length, pool.size)
    })
    
    await t.test('in an equal distribution', t => {    
      const groups = Object.values(Object.groupBy(pongs, ({ pid }) => pid))
      
      t.assert.strictEqual(groups.length, pool.size)
  
      groups.forEach(group => t.assert.strictEqual(group.length, 2))
    })
    
    await t.test('correctly passing their set data', t => {
      pongs.forEach(pong => {
        t.assert.ok(Object.hasOwn(pong, 'foo'), 'cant find data prop. "foo" ')
        t.assert.strictEqual(pong.foo, 'bar')
      })
    })
  })    
})
