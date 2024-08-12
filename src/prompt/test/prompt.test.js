import test from 'node:test'

import Writeline from './utils/writeline.js'
import prompt from '../index.js'

test('#prompt()', async t => {
  let res 
  const writeline = new Writeline()

  t.beforeEach(() => writeline.reset())
  t.after(() => writeline.restore())

  await t.test('prompts for input', { timeout: 250 }, async t => {
    t.beforeEach(async () => {
      res = await writeline.on(prompt({ FOO: 10 })).done()
    })
    
    await t.test('shows prompt', async t => {
      t.assert.strictEqual(res.resolved, false)
    })
    
    await t.test('displays label', async t => {
      t.assert.ok(res.stdout.includes('FOO'), 'no "FOO" in stdout')
    })
    
    await t.test('displays default value', async t => {
      t.assert.ok(res.stdout.includes('(10)'), 'no "(10)" in stdout')
    })
  })
  
  await t.test('pressing Enter without entering anything', async t => {
    t.beforeEach(async () => {
      res = await writeline.on(prompt({ FOO: 10 }))
        .pressEnter().done()
    })

    await t.test('ends the prompt', async t => {
      t.assert.strictEqual(res.resolved, true)
    })

    await t.test('uses the default value', async t => {
      t.assert.strictEqual(res.value.FOO, 10)
    })
  })
  
  await t.test('entering an invalid value', { timeout: 250 }, async t => {
    t.beforeEach(async() => {
      res = await writeline.on(prompt({ FOO: 10, BAR: 20 }))
        .type('non-numeric')
        .pressEnter().done()
    })
    
    await t.test('keeps the prompt open', async t => {
      t.assert.strictEqual(res.resolved, false)
    })
    
    await t.test('on the same question', async t => {
      t.assert.ok(res.stdout.includes('FOO'), 'no "FOO" in stdout')
    })

    await t.test('displays validation error', async t => {
      t.assert.ok(res.stderr.includes('invalid'), 'no "invalid" in stderr')
    })
  })

  await t.test('entering valid after invalid', { timeout: 250 }, async t => {
    await t.test('when its the only/last property', async t => {
      t.beforeEach(async () => {
        res = await writeline.on(prompt({ FOO: 20 }))
          .type(15.5).pressEnter()
          .type(25).pressEnter().done()
      })
      
      await t.test('closes prompt', async t => {
        t.assert.strictEqual(res.resolved, true)
      })
      
      await t.test('sets the typed value', async t => {
        t.assert.strictEqual(res.value.FOO, 25)
      })
    })
    
    await t.test('when it has a subsequent unconfigured property', async t => {
      t.beforeEach(async () => {
        res = await writeline.on(prompt({ FOO: 20, BAR: 30 }))
          .type(15.5).pressEnter()
          .type(25).pressEnter().done()
      })
      
      await t.test('keeps prompt open', async t => {
        t.assert.strictEqual(res.resolved, false)
      })
      
      await t.test('proceeds to the next property', async t => {
        t.assert.ok(res.stdout.includes('BAR'), 'no "BAR" in stdout')
      })
      
      await t.test('if subsequent input is also valid', async t => {
        t.beforeEach(async () => {
          res = await writeline.on(prompt({ FOO: 20, BAR: 30 }))
            .type(15.5).pressEnter()
            .type(100).pressEnter()
            .type(200).pressEnter().done()

        })
        
        await t.test('closes the prompt', async t => {
          t.assert.strictEqual(res.resolved, true)
        })
        
        await t.test('returns both properties', async t => {
          t.assert.ok(Object.hasOwn(res.value, 'FOO'), 'no prop. FOO in result')
          t.assert.ok(Object.hasOwn(res.value, 'BAR'), 'no prop. FOO in result')
          
          await t.test('with their inputted values', async t => {
            t.assert.strictEqual(res.value.FOO, 100)
            t.assert.strictEqual(res.value.BAR, 200)
          })
        })
      })
    })
  })
})
