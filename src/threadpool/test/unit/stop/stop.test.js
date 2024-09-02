import test from 'node:test'

import { cp, load } from '../../utils/index.js'
import { Threadpool } from '../../../index.js'


const dead  = cp => !alive(cp)
const alive = cp => cp.exitCode === null & cp.signalCode === null


test('#stop()', async t => {
  cp.fork      = t.mock.fn(cp.fork)
  cp.instances = () => cp.fork.mock.calls.map(call => call.result)

  let pool     = null 

  t.afterEach(() => pool.stop())
  
  await t.test('threads exit normally', async t => {    
    t.before(() => {
      cp.fork.mock.resetCalls()
      pool = new Threadpool(load('ok.js'))

      return pool.start()
    })

    await t.test('resolves array of exit codes: 0', async t => {   
      const exitCodes = await pool.stop()
      
      t.assert.strictEqual(exitCodes.length, pool.size)
      t.assert.ok(exitCodes.every(code => code === 0), 'some exit codes !== 0')
    })

    await t.test('all threads exit', t => {          
      t.assert.strictEqual(cp.instances().filter(dead).length, pool.size)
      t.assert.strictEqual(cp.instances().filter(alive).length, 0)
    })
  })
})

test('#stop() listeners', async t => {
  cp.fork      = t.mock.fn(cp.fork)
  cp.instances = () => cp.fork.mock.calls.map(call => call.result)

  let pool     = null 

  t.afterEach(() => pool.stop())
  
  await t.test('threads exit normally', async t => {    
    t.before(() => {
      cp.fork.mock.resetCalls()
      pool = new Threadpool(load('pinger.js'))

      return pool.start()
    })

    await t.test('resolves array of exit codes: 0', async t => {   
      
    })

    await t.test('all threads exit', t => {          
      t.assert.strictEqual(cp.instances().filter(dead).length, pool.size)
      t.assert.strictEqual(cp.instances().filter(alive).length, 0)
    })
  })
})
