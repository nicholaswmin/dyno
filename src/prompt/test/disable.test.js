import test from 'node:test'

import Writeline from './utils/writeline.js'
import prompt from '../index.js'

test('#prompt() disable:true ', async t => {
  let res

  await t.test('passing disabled: true', { timeout: 250 }, async t => {
    t.beforeEach(async () => {
      res = await prompt({
        FOO: 10
      }, { disabled: true })
    })

    await t.test('returns result without prompting for user-input', async t => {
      t.assert.ok(res, 'result is falsy')
      t.assert.ok(Object.hasOwn(res, 'FOO'), 'result does not have a FOO prop.')
      t.assert.strictEqual(res.FOO, 10)
    })
  })
})
