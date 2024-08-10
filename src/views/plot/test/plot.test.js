import test from 'node:test'

import Plot from '../index.js'

test('#view:Plot', async t => {
  let plot = null, input = {
    foo: [
      { min: 0, mean: 3, max: 4, count: 2 },
      { min: 4, mean: 5, max: 6, count: 4 },
      { min: 6, mean: 7, max: 8, count: 9 },
    ],
    bar: [
      { min: 1, mean: 2, max: 3, count: 1 },
      { min: 3, mean: 4, max: 5, count: 3 },
      { min: 5, mean: 6, max: 7, count: 5 },
      { min: 7, mean: 8, max: 9, count: 7 }
    ],
    baz: [
      { min: 2, mean: 2.5, max: 3, count: 4 }
    ]
  }

  t.beforeEach(async () => {
    plot = new Plot('Foo Plot', { 
      properties: ['foo', 'bar'],
      subtitle: 'foo subtitle'
    })
  })
  
  await t.test('properties array does not include a property', async t => {
    await t.test('throws a RangeError', t => {
      t.assert.throws(() => {
         plot = new Plot('Plot', { properties: [] })
      }, { name: 'RangeError' })
    })
  })
  
  await t.test('properties array includes at least 1 property', async t => {
    await t.test('instantiates', async t => {      
      t.assert.ok(plot)
    })
  })
  
  await t.test('#plot', async t => {
    await t.test('does not throw', async t => {
      t.assert.doesNotThrow(() => {
        plot.plot(input)
      })
    })
  })
  
  await t.test('#render', async t => {    
    let stdout

    t.beforeEach(t => {
      console.log = t.mock.fn(console.log, () => {})

      plot.plot(input).render()
      
      stdout = console.log.mock.calls.at(-1).arguments.at(0)
    })
    
    await t.test('logs an ASCII chart to stdout', async t => {
      t.assert.ok(stdout, 'Cannot find title "Foo Plot" in stdout')
    })
    
    await t.test('chart includes the specified subtitle', async t => {
      t.assert.ok(
        stdout.includes('foo subtitle'), 
        'cant find "foo subtitle" in stdout'
      )
    })
    
    await t.test('chart includes the specified properties', async t => {
      t.assert.ok(stdout.includes('foo'), 'expected "foo" to be plotted')
      t.assert.ok(stdout.includes('bar'), 'expected "bar" to be plotted')
    })
    
    await t.test('chart includes *only* the specified properties', async t => {
      t.assert.ok(!stdout.includes('baz'), 'expected to NOT plot "baz"')
    })
  })

})
