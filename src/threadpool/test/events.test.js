import test from 'node:test'
import { EventEmitter } from 'node:events'

import { task } from './utils/utils.js'
import { Threadpool } from '../index.js'

EventEmitter.defaultMaxListeners = 50


test('#on()', async t => {
  const pool = new Threadpool(task('emit.js'))
  t.before(() => pool.start())
  t.after(() => pool.stop())

  await t.test('listens for event, across threads', (t, done) => {
    const uniqPIDs = {}

    pool.on('ping', ({ pid }) => {
      Object.keys(uniqPIDs).length === pool.size ? done() : uniqPIDs[pid] = 1
    })
  })
})


test('#off()', async t => {
  const pool = new Threadpool(task('emit.js'))

  t.before(() => pool.start())
  t.after(() => pool.stop())
  
  await t.test('stop listening for event across threads', (t, done) => {
    let timer = null

    function listener() {
      clearTimeout(timer)
      timer = setTimeout(done, 20)

      pool.off('ping', listener)
    }
    
    pool.on('ping', listener)
  })
})


test('#removeAllListeners()', async t => {
  const pool = new Threadpool(task('emit.js'))

  t.before(() => pool.start())
  t.after(() => pool.stop())
  
  await t.test('stops listening, all listeners, across threads', (t, done) => {
    let timer = null

    function listener() {
      clearTimeout(timer)
      timer = setTimeout(done, 20)

      pool.removeAllListeners('ping')
    }
    
    function listener2() {
      listener()
    }
    
    pool.on('ping', listener).on('ping', listener2)
  })
})


test('#emit()', async t => {
  const pool = new Threadpool(task('pong.js'), 4), 
        pongs = []
  
  t.before(() => pool.start())
  t.after(() => pool.stop())
  
  await t.test('emits the event', (t, done) => {    
    for (let i = 0; i < pool.size * 2; i++)
      pool.emit('ping', { foo: 'bar' })

    pool.on('pong', data => pongs.push(data))
    
    setTimeout(done, 20)
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


test('#emit() ping/pong 1000 times', async t => {
  const pool = new Threadpool(task('pong.js'), 4), 
        pongs = []
  
  t.before(() => pool.start())
  t.after(() => pool.stop())
  
  await t.test('completes in < 1 second', { timeout: 1 * 1000 }, (t, done) => {    
    pool.on('pong', data => {
      pongs.length >= 1000 
        ? done() 
        : pongs.push(setImmediate(() => pool.emit('ping')))
    })
    
    pool.emit('ping')
  })
  
  await t.test('completes 1000 ping/pongs', t => {
    t.assert.ok(pongs.length > 0, 'no pongs received')
    t.assert.strictEqual(pongs.length, 1000)
  })
})
