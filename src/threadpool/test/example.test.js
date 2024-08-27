import test from 'node:test'
import { exec } from 'node:child_process'

const command = `node --no-warnings --run example`

test(`README example`, async t => {
  let ac = new AbortController(), 
    { stdout, stderr } = exec(command, { signal: ac.signal })
  
  t.after(ac.abort.bind(ac))
  t.before(async () => {
    stdout = await new Promise((resolve, reject) => {
      stdout.on('data', resolve), stderr.on('data', reject)
    })
  })

  await t.test(`Running "${command}"`, async t => {
    await t.test('logs in stdout', t => {
      t.assert.ok(stdout, 'nothing logged in stdout`')
    })
    
    await t.test('some "ping"s', t => {
      const pings = stdout.split('ping').length
  
      t.assert.ok(pings > 0, `found: ${pings} "pings" in stdout, must be > 0`)
    })
    
    await t.test('some "pong"s', t => {
      const pongs = stdout.split('pong').length
  
      t.assert.ok(pongs > 0, `found: ${pongs} "pong" in stdout, must be > 0`)
    })
  })
})
