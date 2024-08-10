import test from 'node:test'
import Table from '../index.js'

test('#view:Table', async t => {
  await t.test('instantiates', async t => {
    t.assert.ok(new Table('Foo Table', []))
  })
    
  await t.test('#render', async t => {   
    let stdout 

    t.before(() => {
      console.log = t.mock.fn(console.log, () => {})
    })

    await t.test('rows are empty', async t => {
      t.before(() => {
        ;(new Table('Foo Table', [])).render()
        
        stdout = console.log.mock.calls.at(-1).arguments.at(0)
      })

      await t.test('logs a "no rows" string', async t => {
        t.assert.ok(stdout.includes('no rows'), 'cant find "no rows" in stdout')
      })
    })

    await t.test('has rows', async t => {   
      t.before(() => {
        ;(new Table('Foo Table', [
          { 'foo': 0,   'bar': 30, 'baz': 30 },
          { 'foo': NaN, 'bar': undefined, 'baz': 40 },
          { 'foo': 35,  'bar': 40, 'baz': 30 }
        ])).render()

        stdout = console.log.mock.calls.at(-1).arguments.at(0)
      })
      
      await t.test('logs an ASCII table to stdout', async t => {
        t.assert.ok(stdout, 'nothing logged to stdout')
      })
      
      await t.test('table has the specified title', async t => {
        t.assert.ok(
          stdout.includes('Foo Table'),
          'cannot find "Foo Table" title in stdout'
        )
      })
      
      await t.test('table has the row keys as table headings', async t => {
        t.assert.ok(
          stdout.includes('foo | bar | baz'),
          'cannot find "foo | bar | baz" headings in stdout'
        )
      })

      await t.test('table has the row values as table rows', async t => {
        t.assert.ok(
          stdout.includes('0 |  30 |  30'),
          'cannot find: "0 |  30 |  30" in stdout'
        )
      })

      await t.test('NaN/undefined row values are replaced with "n/a"', t => {
        t.assert.ok(
          stdout.includes('n/a | n/a |  40'),
          'cannot find: "n/a | n/a |  40" in stdout'
        )
      })
    })
  })
})
