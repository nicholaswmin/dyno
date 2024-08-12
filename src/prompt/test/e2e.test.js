import test from 'node:test'

import Writeline from './utils/writeline.js'
import prompt from '../index.js'

test('#prompt() set 2 values and a default, back to back', async t => {
  let res 
  const writeline = new Writeline()

  t.beforeEach(() => writeline.reset())
  t.after(() => writeline.restore())

  await t.test('prompts for input', { timeout: 250 }, async t => {
    t.before(async () => {
      res = await writeline.on(prompt({ 
        FOO: 35,
        BAR: false
      }, {
        defaults: {
          BAZ: 55
        }
      }))
      .type(20)
      .pressEnter()
      .pressEnter()
      .type('true')
      .pressEnter()
      .done()
    })

    await t.test('closes prompt', async t => {
      t.assert.strictEqual(res.resolved, true)
    })
    
    await t.test('returns an object with correct values', async t => {
      t.assert.deepStrictEqual(res.value, { BAZ: 20, FOO: 35, BAR: true })
    })
  })
})
