import test from 'node:test'
import cp from 'node:child_process'
import { join } from 'node:path'
import { Threadpool } from '../index.js'

const load  = filename => join(import.meta.dirname, `./threadfiles/${filename}`)

// Monkey-patch `child_process.fork()` to return a 
// `ChildProcess` which implements `ChildProcess.send` to:
// 
// - message is 'cb-error'    : call callback with `Simulated Error`
// - message is 'rate-limit'  : return `false`
// - message is anything else : works normally

const fork = cp.fork.bind(cp)

cp.fork = (...args) => {
  const child = fork(...args), send = child.send.bind(child)

  return Object.assign(child, {
    send: (msg, cb) => msg.includes('cb-error') 
      ? cb(new Error('Simulated')) 
      : msg.includes('rate-limit') 
        ? false 
        : send(msg, cb)
  })
}

test('#IPC primary-to-thread error handling', async t => { 
  const pool = new Threadpool(load('pong.js'))

  t.before(() => pool.start())
  t.after(()  => pool.stop())
  
  await t.test('process.send() returns true', async t => {
    await t.test('calling emit()', async t => {
      await t.test('resolves', async t => {
        await t.assert.doesNotReject(pool.emit.bind(pool, 'foo'))
      })
    })
  })

  
  await t.test('process.send() callback has an error', async t => {
    await t.test('calling emit()', async t => {
      await t.test('rejects with callback error', async t => {
        await t.assert.rejects(pool.emit.bind(pool, 'cb-error'), {
          message: /Simulated/
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
