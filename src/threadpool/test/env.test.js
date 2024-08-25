import test from 'node:test'
import cp from 'node:child_process'
import path from 'node:path'
import { once } from 'node:events'
import { task, connected, alive, dead } from './utils/utils.js'

import { Threadpool } from '../index.js'

test('Thread environment variables', { timeout: 2000 }, async t => {
  let pool = null, 
      env = null

  cp.fork      = t.mock.fn(cp.fork)
  cp.instances = () => cp.fork.mock.calls.map(c => c.result)

  t.after(()  => pool.stop())
  t.before(async () => {
    cp.fork.mock.resetCalls()

    pool = new Threadpool(task('ok.js'), 2, { FOO: 'BAR' })

    await pool.start()
    
    queueMicrotask(() => cp.instances().at(0).send('env')) 

    const message = await new Promise(resolve => {
      const onEnv = message => {
        if (message[0] !== 'env') return
        cp.instances().at(0).off('message', onEnv)
        resolve(message)
      }
      
      cp.instances().at(0).on('message', onEnv)
    })
    
    env = message[1]
  })

  await t.test('passes parameters', async t => {
    t.assert.ok(Object.hasOwn(env, 'FOO'), 'missing thread env. var "FOO"')
    t.assert.deepStrictEqual(env.FOO, 'BAR')
  })

  await t.test('passes a spawn index', t => {
    t.assert.strictEqual(typeof +env.INDEX, 'number')
  })
})
