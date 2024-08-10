import test from 'node:test'
import { join } from 'node:path'

import { dyno } from '../../../index.js'

test('#dyno() records default cycle measurements', async t => {
  let result = null, primary, parameters = { 
    CYCLES_PER_SECOND: 200, CONCURRENCY: 2, DURATION_MS: 500 
  }

  t.before(async () => {
    result = await dyno({
      task: join(import.meta.dirname, 'tasks/records-foo.js'),
      parameters
    })

    primary = result[process.pid]
  })

  await t.test('tracks cycle measurements', async t => {
    t.assert.ok(Object.hasOwn(primary, 'sent'), 
      'Cannot find tracked measurement "sent" on primary thread'
    )
    
    t.assert.ok(Object.hasOwn(primary, 'done'), 
      'Cannot find tracked measurement "done" on primary thread'
    )
  })

  await t.test('tracks count of issued cycles', async t => {
    t.assert.ok(Object.hasOwn(primary.sent, 'count'), 
      'Cannot find tracked value "count" on primary measurement "sent'
    )
  })
  
  await t.test('tracks count of executed cycles', async t => {
    t.assert.ok(Object.hasOwn(primary.done, 'count'), 
      'Cannot find tracked value "count" on primary measurement "done'
    )
  })
})
