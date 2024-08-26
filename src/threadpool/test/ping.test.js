import test from 'node:test'
import path from 'node:path'
import { once, EventEmitter } from 'node:events'
import { task, connected, alive, dead } from './utils/utils.js'
import { setTimeout } from 'node:timers/promises'
import { Threadpool } from '../index.js'

EventEmitter.defaultMaxListeners = 50

test('#ping()', { timeout: 2000 }, async t => {
  let pool = null

  t.beforeEach(() => pool = new Threadpool(task('pong.js'), 10))
  t.afterEach(() => pool.removeAllListeners('pong').stop())
  
  
  await t.test('sending 1 ping', async t => {
    t.beforeEach(() => pool.start())

    await t.test('sends back 1 pong', async t => {
      await new Promise(resolve => pool.on('pong', resolve).ping())
    })
  })
  
  
  await t.test('sending recursive ping/pongs', async t => {
    await t.test('completes ~1000 cycles', async t => {
      await pool.start()
  
      await new Promise(resolve => {
        let pongs = 0
  
        pool.on('pong', e => ++pongs >= 1000 ? resolve() : pool.ping())
        
        pool.ping()
      })
    })
    
    await t.test('cycles in round-robin', async t => {
      await pool.start()
      const pids = pool.threads.map(thread => thread.pid)
      const pongs = await new Promise(resolve => {
        const _pongs = []
  
        pool.on('pong', data => _pongs.length === pool.size 
          ? resolve(_pongs) : pool.ping(_pongs.push(data.pid)))
        
        pool.ping()
      })
  
      t.assert.strictEqual(pongs.length, 10)
      t.assert.ok(pongs.every(_pid => pids.find(p => p === _pid)),
        'cannot find all thread PIDs (or none at all) in sent pongs')
    })
  })
})
