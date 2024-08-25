import test from 'node:test'
import cp from 'node:child_process'

import { task, alive, dead } from './utils/utils.js'
import { Threadpool } from '../index.js'

test('#stop()', { timeout: 2000 }, async t => {
  let pool = null 

  cp.fork   = t.mock.fn(cp.fork)
  cp.forked = () => cp.fork.mock.calls.map(call => call.result)
  t.afterEach(() => pool.stop())

  await t.test('threads exit normally', async t => {    
    t.before(() => {
      cp.fork.mock.resetCalls()
      pool = new Threadpool(task('ok.js'))
      pool.on('error', () => {})

      return pool.start()
    })

    await t.test('resolves array of exit codes: 0', async t => {   
      const exitCodes = await pool.stop()
      
      t.assert.strictEqual(exitCodes.length, pool.size)
      t.assert.ok(exitCodes.every(code => code === 0), 'some exit codes !== 0')
    })

    await t.test('all threads exit', t => {          
      t.assert.strictEqual(cp.forked().filter(dead).length, pool.size)
      t.assert.strictEqual(cp.forked().filter(alive).length, 0)
    })
  })

  
  await t.test('thread SIGTERM handler never exits', async t => {
    t.before(() => {
      cp.fork.mock.resetCalls()
      pool = new Threadpool(task('lag-exit.js'))
      
      return pool.start()
    })
    
    await t.test('resolves array of exit codes: 1', async t => {   
      const exitCodes = await pool.stop()

      t.assert.strictEqual(exitCodes.length, pool.size)
      t.assert.ok(exitCodes.every(code => code === 1), 'some exit codes !== 1')
    })
    
    await t.test('all threads exit', async t => {     
      t.assert.strictEqual(cp.forked().filter(dead).length, pool.size)
      t.assert.strictEqual(cp.forked().filter(alive).length, 0)
    })
  })
  
  
  await t.test('thread SIGTERM handler exits with code: 1', async t => {
    t.before(() => {
      cp.fork.mock.resetCalls()
      pool = new Threadpool(task('exit-err.js'))
      
      return pool.start()
    })
    
    await t.test('resolves array of exit codes: 1', async t => {   
      const exitCodes = await pool.stop()
      
      t.assert.strictEqual(exitCodes.length, pool.size)
      t.assert.ok(exitCodes.every(code => code === 1), 'some exit codes !== 1')
    })
    
    await t.test('all threads exit', t => {      
      t.assert.strictEqual(cp.forked().filter(dead).length, pool.size)
      t.assert.strictEqual(cp.forked().filter(alive).length, 0)
    })
  })
})
