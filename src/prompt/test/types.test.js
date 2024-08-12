import test from 'node:test'

import Writeline from './utils/writeline.js'
import prompt from '../index.js'

test('#prompt() types', async t => {
  let res 
  const writeline = new Writeline()

  t.beforeEach(() => writeline.reset())
  t.after(() => writeline.restore())
  
  await t.test('parameter type: Number', { timeout: 250 }, async t => {
    await t.test('typing a positive integer', async t => {
      t.beforeEach(async() => {
        res = await writeline.on(prompt({ FOO: 20 }))
          .type(500).pressEnter().done()
      })

      await t.test('sets the value', async t => {
        t.assert.strictEqual(typeof res.value.FOO, 'number')
        t.assert.strictEqual(res.value.FOO, 500)
      })
    })

    await t.test('entering a fractional number', async t => {
      t.beforeEach(async() => {
        res = await writeline.on(prompt({ FOO: 10 }))
          .type(15.5).pressEnter().done()
      })

      await t.test('displays validation error', async t => {
        t.assert.ok(res.stderr.includes('invalid'), 'no "invalid" in stderr')
      })
    })
    
    await t.test('typing non-numeric value', async t => {
      t.beforeEach(async() => {
        res = await writeline.on(prompt({ FOO: 10 }))
          .type('helloworld').pressEnter().done()
      })

      await t.test('displays validation error', async t => {
        t.assert.ok(res.stderr.includes('invalid'), 'no "invalid" in stderr')
      })
    })
    
    await t.test('entering a negative value', async t => {
      t.beforeEach(async() => {
        res = await writeline.on(prompt({ FOO: 10 }))
          .type('helloworld').pressEnter().done()
      })

      await t.test('displays validation error', async t => {
        t.assert.ok(res.stderr.includes('invalid'), 'no "invalid" in stderr')
      })
    })
  })
  
  await t.test('parameter type: String', { timeout: 250 }, async t => {
    await t.test('entering an empty value', async t => {
      t.beforeEach(async() => {
        res = await writeline.on(prompt({ FOO: '' }))
          .type('').pressEnter().done()
      })

      await t.test('displays validation error', async t => {
        t.assert.ok(res.stderr.includes('invalid'), 'no "invalid" in stderr')
      })
    })
    
    await t.test('entering a numeric value', async t => {
      t.beforeEach(async() => {
        res = await writeline.on(prompt({ FOO: '' }))
          .type(15).pressEnter().done()
      })

      await t.test('allows it', async t => {
        t.assert.strictEqual(res.resolved, true)
      })
      
      await t.test('casts the value as a String', async t => {
        t.assert.strictEqual(res.value.FOO, '15')
      })
    })
  })
  
  await t.test('parameter type: Boolean', { timeout: 250 }, async t => {    
    await t.test('entering a string with some length', async t => {
      t.beforeEach(async() => {
        res = await writeline.on(prompt({ FOO: false }))
          .type('helloworld').pressEnter().done()
      })

      await t.test('displays relevant validation error', async t => {
        t.assert.ok(
          res.stderr.includes('"true" or "false"'), 
          'no "true" or "false" in stderr'
        )
      })
    })
    
    await t.test('entering an empty value', async t => {
      t.beforeEach(async() => {
        res = await writeline.on(prompt({ FOO: false }))
          .type('').pressEnter().done()
      })

      await t.test('allows it', async t => {
        t.assert.strictEqual(res.resolved, true)
      })
      
      await t.test('sets value as false', async t => {
        t.assert.strictEqual(res.value.FOO, false)
      })
    })
    
    await t.test('entering "true"', async t => {
      t.beforeEach(async() => {
        res = await writeline.on(prompt({ FOO: false }))
          .type('true').pressEnter().done()
      })
      
      await t.test('keeps type as Boolean', async t => {
        t.assert.strictEqual(typeof res.value.FOO, 'boolean')
      })

      await t.test('allows it', async t => {
        t.assert.strictEqual(res.resolved, true)
      })
      
      await t.test('sets value as "true"', async t => {
        t.assert.strictEqual(res.value.FOO, true)
      })
    })
    
    await t.test('entering "false"', async t => {
      t.beforeEach(async() => {
        res = await writeline.on(prompt({ FOO: false }))
          .type('true').pressEnter().done()
      })

      await t.test('allows it', async t => {
        t.assert.strictEqual(res.resolved, true)
      })
      
      await t.test('keeps type as Boolean', async t => {
        t.assert.strictEqual(typeof res.value.FOO, 'boolean')
      })

      await t.test('sets value as "false"', async t => {
        t.assert.strictEqual(res.value.FOO, true)
      })
    })
  })
})
