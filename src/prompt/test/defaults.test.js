import test from 'node:test'

import Writeline from './utils/writeline.js'
import prompt from '../index.js'

test('#prompt() defaults', async t => {
  let res 
  const writeline = new Writeline()

  t.beforeEach(() => writeline.reset())
  t.after(() => writeline.restore())

  await t.test('has a non-conflicting default', { timeout: 250 }, async t => {
    t.beforeEach(async () => {
      res = await writeline.on(prompt({
        FOO: 10
      }, { defaults: { BAR: 50 } })).done()
    })
    
    await t.test('prompts to configure it', async t => {
      t.assert.strictEqual(res.resolved, false)
      t.assert.ok(res.stdout.includes('BAR'), 'no "BAR" in stdout')
    })
    
    await t.test('has correct default value', async t => {
      t.assert.ok(res.stdout.includes('50'), 'no "50" in stdout')
    })
  })
  
  await t.test('has a conflicting default', { timeout: 250 }, async t => {
    t.beforeEach(async () => {
      res = await writeline.on(prompt({
        FOO: 10
      }, { defaults: { FOO: 50 } })).done()
    })
    
    await t.test('prompts to configure it', async t => {
      t.assert.strictEqual(res.resolved, false)
      t.assert.ok(res.stdout.includes('FOO'), 'no "FOO" in stdout')
    })
    
    await t.test('promps to configure the non-default', async t => {
      t.assert.ok(res.stdout.includes('10'), 'no "10" in stdout')
    })
    
    await t.test('pressing Enter without typing anything', async t => {
      t.beforeEach(async () => {
        res = await writeline.on(prompt({
          FOO: 10
        }, { defaults: { FOO: 50 } })).pressEnter().done()
      })
      
      await t.test('closes prompt', async t => {
        t.assert.strictEqual(res.resolved, true)
      })
      
      await t.test('uses the default-value of the non-default', async t => {
        t.assert.strictEqual(res.value.FOO, 10)
      })
    })
    
    await t.test('typing a value', async t => {
      t.beforeEach(async () => {
        res = await writeline.on(prompt({
          FOO: 10
        }, { defaults: { FOO: 50 } })).type(100).pressEnter().done()
      })
      
      await t.test('closes prompt', async t => {
        t.assert.strictEqual(res.resolved, true)
      })
      
      await t.test('uses the typed value', async t => {
        t.assert.strictEqual(res.value.FOO, 100)
      })
    })
  })
})
