import test from 'node:test'

import Writeline from './utils/writeline.js'
import prompt from '../index.js'

test('#prompt()', async t => {
  let res 
  const writeline = new Writeline()

  t.beforeEach(() => writeline.reset())
  t.after(() => writeline.restore())

  await t.test('returns an immutable object', { timeout: 250 }, async t => {
    t.beforeEach(async () => {
      res = await writeline.on(prompt({ FOO: 20, BAR: 'hello' }))
        .type('20').pressEnter()
        .type('helloworld')
        .pressEnter().done()
    })
    
    await t.test('returns the correct result', async t => {
      t.assert.deepStrictEqual(res.value, { FOO: 20, BAR: 'helloworld' })
    })

    await t.test('result not allow property overwrites', async t => {
      t.assert.throws(() => {
        res.value.BAR = 3
      }, {  name: 'TypeError' })
    })
    
    await t.test('result does not allow property deletions', async t => {
      t.assert.throws(() => {
        delete res.value.FOO
      }, {  name: 'TypeError' })
    })
  })
})
