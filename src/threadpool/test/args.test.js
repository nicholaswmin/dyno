import test from 'node:test'
import { Threadpool } from '../index.js'

test('#constructor()', async t => {
  await t.test('all arguments provided in valid format', async t => {
    await t.test('does not throw', t => {
      t.assert.doesNotThrow(() => new Threadpool('task.js', 4, { foo: 'bar' }))
      t.assert.ok(() => new Threadpool('task.js', 4, { foo: 'bar' }))
    })
  })

  await t.test('no arguments provided', async t => {
    await t.test('instantiates', t => {
      t.assert.doesNotThrow(() => new Threadpool())
      t.assert.ok(() => new Threadpool())
    })

    await t.test('uses defaults', async t => {
      const { modulePath, size } = new Threadpool()

      await t.test('module path set to current file path', t => {
        t.assert.strictEqual(modulePath, process.argv.at(-1))
      })

      await t.test('pool size set to a positive integer', t => {
        t.assert.ok(size > 0, 'thread size is: <= 0')
        t.assert.ok(Number.isInteger(size), 'thread size !== integer')
      })
    })
  })
  
  
  await t.test('module path is provided', async t => {
    await t.test('empty', async t => {
      await t.test('throws a RangeError', t => {
        t.assert.throws(() => new Threadpool(null, 'abc'), { 
          name: 'RangeError' 
        })
      })
    })
  })
  
  
  await t.test('pool size provided', async t => {
    await t.test('as a string', async t => {
      await t.test('throws RangeError', t => {
        t.assert.throws(() => new Threadpool(null, 'abc'), { 
          name: 'RangeError'
        })
      })
    })
    
    await t.test('as a positive fractional number', async t => {
      await t.test('throws RangeError', t => {
        t.assert.throws(() => new Threadpool(null, 3.1), { 
          name: 'RangeError'
        })
      })
    })
    
    await t.test('as a negative integer', async t => {
      await t.test('throws RangeError', t => {
        t.assert.throws(() => new Threadpool(null, -3), { 
          name: 'RangeError'
        })
      })
    })
    
    await t.test('as 0', async t => {
      await t.test('throws RangeError', t => {
        t.assert.throws(() => new Threadpool(null, 0), { 
          name: 'RangeError'
        })
      })
    })
  })
  
  
  await t.test('parameters set', async t => {
    await t.test('as a non-object', async t => {
      await t.test('throws TypeError', t => {
        t.assert.throws(() => new Threadpool(null, 3, 'f'), { 
          name: 'TypeError' 
        })
      })
    })
    
    await t.test('without any properties', async t => {
      await t.test('is ok', t => {
        t.assert.doesNotThrow(() => new Threadpool(null, 3, {}))
      })
    })
  })
})
