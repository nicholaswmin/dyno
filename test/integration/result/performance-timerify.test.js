import test from 'node:test'
import path from 'node:path'

import { dyno } from '../../../index.js'

test('#dyno() custom-measurement:performance.timerify', async t => {
  let result

  t.before(async () => {
    result = await dyno(path.join(import.meta.dirname,'tasks/timerify.js'), {
      parameters: { cyclesPerSecond: 100, threads: 2, durationMs: 250 }
    })
    .then(res => res.thread)
  })

  await t.test('tracks the measurement', async t => {
    t.assert.ok(Object.hasOwn(result, 'sleep'), 
      'Cannot find tracked measurement "sleep" on thread'
    )
  })

  await t.test('records the value as a timeline histogram', async t => {
    t.assert.ok(Object.hasOwn(result.sleep, 'last'),  'missing key "last"')
    t.assert.ok(Object.hasOwn(result.sleep, 'count'), 'no prop "count"')
    t.assert.ok(Object.hasOwn(result.sleep, 'min'),   'no prop "min"')
    t.assert.ok(Object.hasOwn(result.sleep, 'mean'),  'no prop "mean"')
    t.assert.ok(Object.hasOwn(result.sleep, 'max'),   'no prop "max"')
  })
  
  await t.test('records snapshots of the histogram', async t => {
    t.assert.ok(Object.hasOwn(result.sleep, 'snapshots'), 'no prop "snapshots"')
    t.assert.ok(result.sleep.snapshots.length > 0, 'got 0 "sleep" snapshots')
  })
})
