import test from 'node:test'
import path from 'node:path'

import { dyno } from '../../../index.js'

test('#dyno() records a default task measurement', async t => {
  let result

  t.before(async () => {
    result = await dyno(path.join(import.meta.dirname, 'tasks/records.js'), {
      parameters: { cyclesPerSecond: 100, threads: 2, durationMs: 250 }
    }).then(res => res.thread)
  })

  await t.test('tracks a task measurement', async t => {
    t.assert.ok(result.task, 'Cannot find tracked measurement "task" on thread')
  })

  await t.test('records the value as a timeline histogram', async t => {
    t.assert.ok(Object.hasOwn(result.task, 'last'),  'missing key "last"')
    t.assert.ok(Object.hasOwn(result.task, 'count'), 'no prop "count"')
    t.assert.ok(Object.hasOwn(result.task, 'min'),   'no prop "min"')
    t.assert.ok(Object.hasOwn(result.task, 'mean'),  'no prop "mean"')
    t.assert.ok(Object.hasOwn(result.task, 'max'),   'no prop "max"')
  })

  await t.test('records snapshots of the histogram', async t => {
    t.assert.ok(result.task.snapshots.length > 0, 'no task snapshots found')
  })
})
