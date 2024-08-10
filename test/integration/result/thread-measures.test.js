import test from 'node:test'
import { join } from 'node:path'

import { main } from '../../../index.js'

test('#main() records a default task measurement', async t => {
  let result = null, task, parameters = { 
    CYCLES_PER_SECOND: 200, CONCURRENCY: 2, DURATION_MS: 1000 
  }

  t.before(async () => {
    result = await main({
      task: join(import.meta.dirname, 'tasks/records-foo.js'),
      parameters
    })

    task = result.thread.task
  })

  await t.test('tracks a task measurement', async t => {
    t.assert.ok(task, 'Cannot find tracked measurement "task" on thread')
  })

  await t.test('records the value as a histogram', async t => {
    t.assert.ok(task.count > 0, `task.count: ${task.count}, not > 0`)

    t.assert.ok(task.min > 0, `task.min: ${task.min}, not > 0`)
    t.assert.ok(task.min < 20, `task.min: ${task.min}, not < 20`)

    t.assert.ok(task.mean > 0, `task.mean: ${task.mean}, not > 0`)
    t.assert.ok(task.mean < 20, `task.mean: ${task.mean}, not < 20`)

    t.assert.ok(task.max > 0, `task.max: ${task.max}, not > 0`)
    t.assert.ok(task.max < 20, `task.mean: ${task.max}, not < 20`)
  })
  
  await t.test('records snapshots of the histogram', async t => {
    t.assert.ok(task.snapshots.length > 0, 'no task snapshots found')
  })
})
