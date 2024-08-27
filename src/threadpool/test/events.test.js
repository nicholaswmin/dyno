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


test('#off()', async t => {
  const pool = new Threadpool(task('pinger.js'))

  t.before(() => pool.start())
  t.after(() => pool.stop())
  
  await t.test('stop listening for event across threads', (t, done) => {
    let timer = null, listener = () => {
      clearTimeout(timer)
      timer = setTimeout(done, 20)
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
        timer = setTimeout(done, 20)
        pool.removeAllListeners('ping')
      }

    pool.on('ping', listener1).on('ping', listener2)
  })
})


test('#emit()', async t => {
  const pool = new Threadpool(task('pong.js'), 4), pongs = []
  
  t.before(() => pool.start())
  t.after(() => pool.stop())
  
  await t.test('emits the event', (t, done) => {    
    pool.on('pong', data => 
      pongs.length < pool.size * 2 
        ? pongs.push(data)
        : done()
    )
    
    for (let i = 0; i <= pool.size * 2; i++)
      pool.emit('ping', { foo: 'bar' })
  })
  
  await t.test('to one thread', t => {
    t.assert.ok(pongs.length > 0, 'no pongs received')
    t.assert.strictEqual(pongs.length, pool.size * 2)
  })

  await t.test('in round-robin', t => {
    const pids = Object.keys(Object.groupBy(pongs, ({ pid }) => pid))
    
    t.assert.strictEqual(pids.length, pool.size)
  })
  
  await t.test('passing data', t => {
    pongs.forEach(pong => {
      t.assert.ok(Object.hasOwn(pong, 'foo'), 'cant find data prop. "foo" ')
      t.assert.strictEqual(pong.foo, 'bar')
    })
  })
})
