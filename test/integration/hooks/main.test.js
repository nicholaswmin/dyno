import test from 'node:test'
import path from 'node:path'
import { dyno } from '../../../index.js'

test('#dyno() main before/after hooks', async t => {
  let before = t.mock.fn(function before() {})
  let after = t.mock.fn(function before() {})

  t.beforeEach(() => t.mock.reset())
  
  await t.test('#before hook function is provided', async t => {   
    t.before(() => dyno(path.join(import.meta.dirname, 'tasks/runs.js'), {
      parameters: { cyclesPerSecond: 50, threads: 2, durationMs: 350 },
      before
    }))
 
    await t.test('runs the hook once, before starting the test', async t => {
      t.assert.strictEqual(before.mock.calls.length, 1)
    })

    await t.test('passes the test parameters as the 1st argument', async t => {
      const args = before.mock.calls[0].arguments

      t.assert.strictEqual(args.length, 1)
      t.assert.strictEqual(typeof args[0], 'object')
    })
  })
  
  await t.test('#after hook function is provided', async t => {    
    await t.test('#dyno() resolves', async t => {
      t.before(() => dyno(path.join(import.meta.dirname, 'tasks/runs.js'), {
        parameters: { cyclesPerSecond: 50, threads: 2, durationMs: 350 },
        after
      }))
    
      await t.test('runs the hook once', async t => {
        t.assert.strictEqual(after.mock.calls.length, 1)
      })
      
      await t.test('passes arguments', async t => {
        const args = after.mock.calls[0].arguments
        
        await t.test('has 2 arguments', async t => {
          t.assert.strictEqual(args.length, 2)
        })

        await t.test('test parameters as 1st argument', async t => {
          t.assert.strictEqual(typeof args[0], 'object')
          t.assert.ok(Object.hasOwn(
            args[0], 'cyclesPerSecond'), 
            'no "cyclesPerSecond" prop found'
          )
        })
        
        await t.test('collected stats as 2nd argument', async t => {
          t.assert.strictEqual(typeof args[1], 'object')
          t.assert.ok(Object.keys(args[1]).includes('main'), 'no "main" prop')
        })
      })
    })
    
    await t.test('#dyno() rejects because of nonzero thread exit', async t => {
      t.before(async () => {
        after = t.mock.fn(function before() {})

        await dyno(path.join(import.meta.dirname, 'tasks/exits-1.js'), {
          parameters: { cyclesPerSecond: 50, threads: 2, durationMs: 350 },
          after
        }).catch(err => 
          err.message.includes('thread exited with code: 1')
            ? Promise.resolve() : Promise.reject(err)
        )
      })
    
      await t.test('runs the hook once', async t => {
        t.assert.strictEqual(after.mock.calls.length, 1)
      })
      
      await t.test('passes 2 arguments', async t => {
        const args = after.mock.calls[0].arguments
        
        t.assert.strictEqual(args.length, 2)
        
        await t.test('test parameters as 1st argument', async t => {
          t.assert.strictEqual(typeof args[0], 'object')
        })
        
        await t.test('collected stats as 2nd argument', async t => {
          t.assert.strictEqual(typeof args[1], 'object')
          t.assert.ok(Object.keys(args[1]).includes('main'), 'no "main" prop')
        })
      })
    })
  })
})
