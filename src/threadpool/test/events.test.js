import test from 'node:test'
import { EventEmitter } from 'node:events'

import { task } from './utils/utils.js'
import { Threadpool } from '../index.js'

EventEmitter.defaultMaxListeners = 50


test('#on()', { timeout: 500 }, async t => {
  const pool = new Threadpool(task('ping.js'))

  t.after(() => pool.removeAllListeners('ping').stop())
  t.before(() => pool.start())

  await t.test('listens for event, across threads', (t, done) => {
    const pids = {}

    pool.on('ping', ({ pid }) => {
      Object.keys(pids).length === pool.size ? done() : pids[pid] = true
    })
  })
})


// @FIXME `once()` implementation is wrong, 
// it sends an event once but from *every* thread, 
// thus making it non-once.
test('#once()', { timeout: 1000, todo: true }, async t => {
  let pool = new Threadpool(task('ping.js')),
    timer = null, 
    count = 0

  // t.after(() => pool.removeAllListeners('ping').stop())
  // t.before(() => pool.start())
  
  await t.todo('listens for event once, across threads', (t, done) => {
    function listener() {
      ++count
      clearTimeout(timer)
      timer = setTimeout(done, 20)
    }

    pool.once('ping', listener)
  })
  
  await t.todo('listener fires only once', async t => {
    t.assert.strictEqual(count, 1)
  })
})


test('#off()', { timeout: 500 }, async t => {
  const pool = new Threadpool(task('ping.js'))

  t.after(() => pool.removeAllListeners('ping').stop())
  t.before(() => pool.start())
  
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


test('#removeAllListeners()', { timeout: 500 }, async t => {
  const pool = new Threadpool(task('ping.js'))

  t.after(() => pool.removeAllListeners('ping').stop())
  t.before(() => pool.start())
  
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


test('#emit()', { timeout: 500 }, async t => {
  const pool = new Threadpool(task('pong.js'), 4), 
        pongs = []
  
  t.after(() => pool.removeAllListeners('pong').stop())
  t.before(() => pool.start())
  
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
