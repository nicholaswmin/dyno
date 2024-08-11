import test from 'node:test'
import path from 'node:path'

import { dyno } from '../../../index.js'

test('#primary() records default cycle measurements', async t => {
  let primary

  t.before(async () => {
    primary = await dyno(path.join(import.meta.dirname, 'tasks/records.js'), {
      parameters: { CYCLES_PER_SECOND: 200, CONCURRENCY: 2, DURATION_MS: 500 }
    }).then(res => res.main)
  })

  await t.test('has a primary thread', async t => {
    t.assert.ok(primary, 'primary is falsy')
  })

  await t.test('tracks cycle measurements', async t => {
    await t.test('tracks count of issued cycles', async t => {
      t.assert.ok(Object.hasOwn(primary, 'sent'),  'missing key "sent"')
    })

    await t.test('tracks count of executed cycles', async t => {
      t.assert.ok(Object.hasOwn(primary, 'done'),  'missing key "done"')
    })
  })
})
