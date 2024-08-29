import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'
import { Threadpool } from '../index.js'

const load = filename => join(import.meta.dirname, `./child/${filename}`)

// Monkey-patch `child_process.fork()` to return a `ChildProcess` 
// implementing its `child.send(message, ...)` method as:
// 
// - `message` is 'cb-has-err'  : call its callback with an `err`
// - `message` is 'rate-limit'  : return `false`
// - `message` is none of above : work normally

cp._original_fork = cp.fork.bind(cp), cp.fork = function() {
  const child = cp._original_fork.apply(cp, arguments)
  child._original_send = child.send.bind(child)

  return Object.assign(child, {
    send: function(...args) {
      return args.some(arg => !!arg.includes && arg.includes('cb-has-error'))
          ? args.find(arg => arg instanceof Function)(Error('Simulated Error')) 
          : args.some(arg => !!arg.includes && arg.includes('rate-limit'))
            ? false 
            : this._original_send.apply(child, arguments)
    }
  })
}

test('#IPC primary-to-thread error handling', async t => { 
  const pool = new Threadpool(load('pong.js'))

  t.before(() => pool.start())
  t.after(()  => pool.stop())
  
  
  await t.test('process.send() returns true', async t => {
    await t.test('calling emit()', async t => {
      await t.test('resolves', async t => {
        await t.assert.doesNotReject(() => pool.emit('foo', { foo: 'bar' }))
      })
    })
  })


  await t.test('process.send() callback called with error', async t => {
    await t.test('calling emit()', async t => {
      await t.test('rejects with callback error', async t => {
        await t.assert.rejects(pool.emit.bind(pool, 'cb-has-error'), {
          message: /Simulated Error/
        })
      })
    })
  })
  
  
  await t.test('process.send() returns false', async t => {
    await t.test('calling emit()', async t => {
      await t.test('rejects with "rate exceeded" error', async t => {
        await t.assert.rejects(pool.emit.bind(pool, 'rate-limit'), {
          message: /rate exceeded/
        })
      })
    })
  })
})
