import test from 'node:test'
import Threads from '../index.js'

test('#constructor()', async t => {
  await t.test('no arguments provided', async t => {
    await t.test('does not throw', t => {
      t.assert.doesNotThrow(() => new Threads())
    })
    
    await t.test('uses defaults', async t => {
      const { task, threadCount } = new Threads()

      await t.test('task set to current file path', t => {
        t.assert.strictEqual(task, process.argv.at(-1))
      })

      await t.test('thread count set to a positive integer', t => {
        t.assert.ok(threadCount > 0, 'thread count is: <= 0')
        t.assert.ok(Number.isInteger(threadCount), 'thread count !== integer')
      })
    })
  })
  
  await t.test('task is provided', async t => {
    await t.test('empty', async t => {
      await t.test('throws a RangeError', t => {
        t.assert.throws(() => new Threads(null, 'abc'), { name: 'RangeError' })
      })
    })
  })
  
  await t.test('thread count provided', async t => {
    await t.test('as not a positive integer', async t => {
      await t.test('throws RangeError', t => {
        t.assert.throws(() => new Threads(null, 'abc'), { name: 'RangeError' })
      })
    })
  })
  
  await t.test('parameters set', async t => {
    await t.test('as a non-object', async t => {
      await t.test('throws TypeError', t => {
        t.assert.throws(() => new Threads(null, 3, 'f'), { name: 'TypeError' })
      })
    })
    
    await t.test('without any properties', async t => {
      await t.test('is ok', t => {
        t.assert.doesNotThrow(() => new Threads(null, 3, {}))
      })
    })
  })
})
