import test from 'node:test'
import { join } from 'node:path'

import { dyno } from '../../../index.js'

test('#dyno() custom-measurement:performance.measure', async t => {
  let result = null, task, parameters = { 
    CYCLES_PER_SECOND: 200, CONCURRENCY: 2, DURATION_MS: 1000 
  }

  t.before(async () => {
    result = await dyno({
      task: join(import.meta.dirname, 'tasks/performance-measure.js'),
      parameters
    })
    
    const pids = Object.keys(result).sort((a, b) => a - b) 

    task = result[pids[1]]
  })

  await t.test('tracks the measurement', async t => {
    t.assert.ok(Object.hasOwn(task, 'sleep'), 
      'Cannot find tracked measurement "sleep" on thread'
    )
  })

  await t.test('records the value as a histogram', async t => {
    t.assert.ok(
      Object.hasOwn(task.sleep, 'count'), 
      'cant find prop "count" on task.sleep'
    )
    
    t.assert.ok(
      Object.hasOwn(task.sleep, 'min'), 
      'cant find prop "min" on task.sleep'
    )
    
    t.assert.ok(
      Object.hasOwn(task.sleep, 'mean'), 
      'cant find prop "mean" on task.sleep'
    )
    
    t.assert.ok(
      Object.hasOwn(task.sleep, 'max'), 
      'cant find prop "max" on task.sleep'
    )
  })
  
  await t.test('records snapshots of the histogram', async t => {
    t.assert.ok(task.sleep.snapshots.length > 0, 'found 0 task.sleep snapshots')
  })
})
