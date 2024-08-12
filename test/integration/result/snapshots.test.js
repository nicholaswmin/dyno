import test from 'node:test'
import path from 'node:path'

import { dyno } from '../../../index.js'

test('#onTick() arguments: snapshots', async t => {
  const onTick = t.mock.fn(function() {})

  t.before(() => dyno(path.join(import.meta.dirname, 'tasks/perf_apis.js'), {
    parameters: { cyclesPerSecond: 500, threads: 2, durationMs: 750 },
    onTick: onTick
  }))

  await t.test('with task snapshots', async t => {
    const snapshots = onTick.mock.calls[0].arguments[0].snapshots
    
    await t.test('is an object', t => {
      t.assert.ok(typeof snapshots === 'object', '"snapshots" not an obj.')
    })
    
    await t.test('tracks snapshots of cycles duration', async t => {
      t.assert.ok(Object.hasOwn(snapshots, 'cycle'), '"cycle" is missing')

      await t.test('as a 1-D array of numbers', t => {
        t.assert.ok(Array.isArray(snapshots.cycle), '"cycle" not an Array')
        t.assert.ok(snapshots.cycle.length > 0, '"cycle" has 0 snapshots')
        t.assert.strictEqual(typeof snapshots.cycle[0], 'number')
      })
      
      await t.test('limits the count of saved snapshots', t => {
        // `25` is the limit when NODE_ENV=test
        t.assert.strictEqual(snapshots.cycle.length, 25)
      })
    })
    
    await t.test('tracks snapshots of custom measures', async t => {
      t.assert.ok(Object.hasOwn(snapshots, 'sleep'), '"sleep" is missing')
      
      await t.test('as a 1-D array of numbers', t => {
        t.assert.ok(Array.isArray(snapshots.sleep), '"sleep" not an Array')
        t.assert.ok(snapshots.sleep.length > 0, '"sleep" has 0 snapshots')
        t.assert.strictEqual(typeof snapshots.cycle[0], 'number')
      })
      
      await t.test('limits the count of saved snapshots', t => {
        // `25` is the limit when NODE_ENV=test
        t.assert.strictEqual(snapshots.sleep.length, 25)
      })
    })
  })
})
