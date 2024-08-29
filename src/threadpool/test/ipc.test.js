import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'
import { Threadpool } from '../index.js'

const load  = filename => join(import.meta.dirname, `./threadfiles/${filename}`)

// Monkey-patch `child_process.fork()` to 
// return a `ChildProcess` which implements `send(message, ...)` to:
// 
// - `message` is 'cb-has-err' : call its callback with an `err`
// - `message` is 'rate-limit' : return `false`
// - `message` is not of above : work normally

const fork = cp.fork.bind(cp)

cp.fork = (...args) => {
  const child = fork(...args), send = child.send.bind(child)

  return Object.assign(child, {
    send: function() {
      return arguments[0].includes('cb-has-error') 
        ? Array.from(arguments)
            .find(arg => arg instanceof Function)(new Error('Simulated Error')) 
        : arguments[0].includes('rate-limit') 
          ? false 
          : send.apply(child, arguments)
    }
  })
}

test('#IPC primary-to-thread error handling', async t => { 
  const pool = new Threadpool(load('pong.js'))

  t.before(() => pool.start())
  t.after(()  => pool.stop())


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
