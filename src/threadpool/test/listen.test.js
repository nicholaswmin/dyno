import test from 'node:test'
import { EventEmitter } from 'node:events'

import { task } from './utils/utils.js'
import { Threadpool } from '../index.js'


test('#on()', async t => {
  const pool = new Threadpool(task('pinger.js'))
  t.before(() => pool.start())
  t.after(() => pool.stop())

  await t.test('listens for event, across threads', (t, done) => {
    const pids = new Map()

    pool.on('ping', ({ pid }) => pids.size < pool.size 
      ? pids.set(pid, true) 
      : done()
    )
  })
})


test('#once()', async t => {
  const pool = new Threadpool(task('pinger.js'))

  t.before(() => pool.start())
  t.after(() => pool.stop())

  await t.test('listens for event once, across threads', (t, done) => {
    let timer  = null, 
      calls    = 0,
      listener = () => {
        ++calls > 1 ? done('listener fired > 1 times') : null
        clearTimeout(timer)
        timer = setTimeout(done, 50)
      }
    
    pool.once('ping', listener)
  })
})


test('#off()', async t => {
  const pool = new Threadpool(task('pinger.js'))

  t.before(() => pool.start())
  t.after(() => pool.stop())
  
  await t.test('stops listening for event, across threads', (t, done) => {
    let timer = null, listener = () => {
      clearTimeout(timer)
      timer = setTimeout(done, 50)
      pool.off('ping', listener)
    }
    
    pool.on('ping', listener)
  })
})


test('#removeAllListeners()', async t => {
  const pool = new Threadpool(task('pinger.js'))

  t.before(() => pool.start())
  t.after(() => pool.stop())
  
  await t.test('stops listening, all listeners, across threads', (t, done) => {
    let timer = null, 
      listener1 = () => listener2(), 
      listener2 = () => {
        clearTimeout(timer)
        timer = setTimeout(done, 50)
        pool.removeAllListeners('ping')
      }

    pool.on('ping', listener1).on('ping', listener2)
  })
})
