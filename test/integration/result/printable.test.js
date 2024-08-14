import test from 'node:test'
import path from 'node:path'

import { dyno } from '../../../index.js'

test('#onTick() getting metrics in printable formats', async t => {
  const onTick = t.mock.fn(function() {})

  t.before(() => dyno(path.join(import.meta.dirname, 'tasks/perf_apis.js'), {
    parameters: { cyclesPerSecond: 200, threads: 3, durationMs: 500 },
    onTick: onTick
  }))

  await t.test('returns "console.table()-printable" metrics', async t => {
    let result
    
    t.beforeEach(t => {
      const queryFn = onTick.mock.calls[0].arguments[0]
      result = queryFn().threads().pick('mean')
    })

    await t.test('is an Array', t => {
      t.assert.ok(Array.isArray(result), 'result is not an Array')
    })

    await t.test('array items are objects with properties', t => {
      t.assert.ok(result.length > 0, 'result is empty')
      t.assert.ok(typeof result[0] === 'object', 'item is not an object')
      t.assert.ok(Object.keys(result[0]).length > 0, 'item has 0 properties')
    })
    
    await t.test('item values are positive numbers', t => {
      t.assert.ok(
        typeof Object.values(result[0])[0] === 'number', 
        'item value is not a number'
      )
      
      t.assert.ok(Object.values(result[0])[0] > 0, 'number <= 0')
    })
  })
  
  // @NOTE: https://github.com/nicholaswmin/console-plot
  await t.test('returns "console.plot()-printable" metrics', async t => {
    let result
    
    t.beforeEach(t => {
      const queryFn = onTick.mock.calls[0].arguments[0]
      result = queryFn().threads().pick('snapshots').of('mean').group()
    })

    await t.test('is an Object', t => {
      t.assert.ok(!Array.isArray(result), 'result is an Array, not Object')
      t.assert.ok(typeof result === 'object', 'result is not an Object')
    })

    await t.test('with metric names as properties', t => {
      t.assert.ok(Object.keys(result).length > 0, 'item has 0 properties')
    })
    
    await t.test('and property values::', async t => {
      const prop1 = Object.keys(result)[0]

      await t.test('as Arrays', t => {
        t.assert.ok(Array.isArray(result[prop1]), 'value is not an Array')
      })
      
      await t.test('array items are positive numbers', t => {
        t.assert.ok(result[prop1].length > 0, 'array is empty')
        t.assert.strictEqual(typeof result[prop1][0], 'number')
        t.assert.ok(result[prop1][0] > 0, 'number <= 0')
      })
    })
  })
})
