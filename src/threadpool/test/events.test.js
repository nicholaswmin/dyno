import test from 'node:test'
import { join } from 'node:path'
import { once, EventEmitter } from 'node:events'
import { setTimeout } from 'node:timers/promises'

import { Threadpool } from '../index.js'
import { resolve } from 'node:url'

EventEmitter.defaultMaxListeners = 100

test('#ping()', { timeout: 500 }, async t => {
  let pool = null

  t.afterEach(() => {
    pool.removeAllListeners('pong').stop()
  })

  t.beforeEach(() => {
    pool = new Threadpool(join(import.meta.dirname, 'task/pong.js'))
  })
  
  await t.test('sending one ping', async t => {    
    await t.test('sends back one pong', async t => {
      await pool.start()

      await new Promise(resolve => pool.once('pong', resolve).ping())
    })
  })
  
  await t.test('recursively sending ping/pongs', async t => {    
    await t.test('completes at least 100 ping/pong cycles', async t => {
      await pool.start()

      await new Promise(resolve => {
        let pongs = 0

        pool.on('pong', e => ++pongs >= 100 ? resolve() : pool.ping())
        
        pool.ping()
      })
    })
  })
})
