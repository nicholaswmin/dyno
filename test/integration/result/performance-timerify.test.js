import test from 'node:test'
import { join } from 'node:path'

import { dyno } from '../../../index.js'

test('#dyno() custom-measurement:performance.timerify', async t => {
  let result = null, thread, parameters = { 
    CYCLES_PER_SECOND: 200, CONCURRENCY: 2, DURATION_MS: 1000 
  }

  t.before(async () => {
    result = await dyno({
      task: join(import.meta.dirname, 'tasks/performance-timerify.js'),
      parameters
    })
    
    thread = result.thread
  })

  await t.test('tracks the measurement', async t => {
    t.assert.ok(Object.hasOwn(thread, 'sleep'), 
      'Cannot find tracked measurement "sleep" on thread'
    )
  })

  await t.test('records the value as a histogram', async t => {
    t.assert.ok(
      Object.hasOwn(thread.sleep, 'count'), 
      'cant find prop "count" on task.sleep'
    )
    
    t.assert.ok(
      Object.hasOwn(thread.sleep, 'min'), 
      'cant find prop "min" on task.sleep'
    )
    
    t.assert.ok(
      Object.hasOwn(thread.sleep, 'mean'), 
      'cant find prop "mean" on task.sleep'
    )
    
    t.assert.ok(
      Object.hasOwn(thread.sleep, 'max'), 
      'cant find prop "max" on task.sleep'
    )
  })
  
  await t.test('records snapshots of the histogram', async t => {
    t.assert.ok(thread.sleep.snapshots.length > 0, 'found 0 task.sleep snapshots')
  })
})
