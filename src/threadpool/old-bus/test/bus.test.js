import  test from 'node:test'
import  path from 'node:path'
import  cp from 'node:child_process'

test(`#Bus: Communication between a primary and its forks()`, async t => {
  let stdouts
  
  t.before(() => {
    let stdout = cp.execFileSync('node', ['primary.js'], {
      cwd: path.join(import.meta.dirname, './tasks/ping-pongs'), 
      stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf8',
      silent: true        
    })

    stdouts = stdout.split('\n').map(line => line.trim()) 
  })
  
  await t.test('some messages are exchanges', t => {
    t.assert.ok(stdouts.length > 0, 'stdout lines are empty')
  })

  await t.test('primary emits messages to its children', async t => {
    t.assert.ok(stdouts.some(line => line.includes('children[1] got: PING')))
  })
  
  await t.test('children respond back with a reply', async t => {
    t.assert.ok(stdouts.some(line => line.includes('primary[0] got: PONG')))
  })
  
  await t.test('they exchange some amount of messages', async t => {
    t.assert.ok(stdouts.length > 5, 'PING/PONG')
  })

  await t.test('primary/children produce equal number of messages', t => {
    const p1 = stdouts.filter(line => line.includes('primary[0]'))
    const c1 = stdouts.filter(line => line.includes('children[1]'))
    const c2 = stdouts.filter(line => line.includes('children[2]'))
    
    t.assert.ok(Math.abs(c1.length - p1.length) < 10)
    t.assert.ok(Math.abs(c1.length - c2.length) < 10)
    t.assert.ok(Math.abs(p1.length - c2.length) < 10)
  })
  
  await t.test('children emit() lands onlys only on the parent', t => {
    const childrenWithPongs = [
      ...stdouts.filter(line => line.includes('children[0] got PING')),
      ...stdouts.filter(line => line.includes('children[1] got PONG'))
    ]

    t.assert.strictEqual(childrenWithPongs.length, 0)
  })
})
