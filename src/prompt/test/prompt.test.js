import test from 'node:test'
import prompt from '../index.js'

test('#prompt()', async t => {
  let result
  
  t.beforeEach(async () => {
    result = await prompt({ FOO: 30, BAR: 'BAR', BAZ: false }, {
      skipUserInput: true
    }) 
  })

  t.todo('asks for user input', async t => {
    // @TODO 
    // - Test actual user input
    // - note: when run using `node --test`, 
    //  `inquirer/input` does not register  keypress answers
    t.todo('parameter type: Number', () => {
      t.todo('allows only whole numbers', () => {})
      t.todo('allows only positive numbers ', () => {})
    })
    
    t.todo('parameter type: String', () => {
      t.todo('allows only strings with some length', () => {})
    })
    
    t.todo('parameter type: Boolean', () => {
      t.todo('allows only "true" or "false" input', () => { }) 
    })
  })
  
  await t.test('returns a parameters object', async t => {
    await t.test('has the correct properties', async t => {
      t.assert.deepStrictEqual(Object.keys(result), [
        'FOO', 'BAR', 'BAZ'
      ])
    })

    await t.test('type: Number', async t => {
      await t.test('has expected value', async t => {
        t.assert.strictEqual(result.FOO, 30)
      })

      await t.test('is a Number', async t => {
        t.assert.strictEqual(typeof result.FOO, 'number')
      })
      
      await t.test('is > 0', async t => {
        t.assert.ok(
          result.FOO > 0, 
          `expected 'result.FOO' to be > 0, is: ${result.FOO}`
        )
      })
      
      await t.test('is an integer', async t => {
        t.assert.ok(
          Number.isInteger(result.FOO), 
          `expected 'result.FOO' to be an Integer, is: ${result.FOO}`
        )
      })
    })
    
    await t.test('type: String', async t => {
      await t.test('has expected value', async t => {
        t.assert.strictEqual(result.BAR, 'BAR')
      })

      await t.test('is a String', async t => {
        t.assert.strictEqual(typeof result.BAR, 'string')
      })
      
      await t.test('has length', async t => {
        t.assert.ok(
          result.BAR.length > 0,
          `expected 'result.BAR' to have some length, has: ${result.BAR.length}`
        )
      })

    })
    
    await t.test('type: Boolean', async t => {
      await t.test('is a Boolean', async t => {
        t.assert.strictEqual(typeof result.BAZ, 'boolean')
      })
      
      await t.test('has expected value', async t => {
        t.assert.strictEqual(result.BAZ, false)
      })
    })
  })
  
  await t.test('returns an immutable result', async t => {
    await t.test('does not allow property overwrites', async t => {
      t.assert.throws(() => {
        result.BAR = 3
      }, {  name: 'TypeError' })
    })
    
    await t.test('does not allow property deletions', async t => {
      t.assert.throws(() => {
        delete result.FOO
      }, {  name: 'TypeError' })
    })
  })
})
