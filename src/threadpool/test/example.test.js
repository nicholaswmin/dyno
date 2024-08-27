import test from 'node:test'
import { exec } from 'node:child_process'
import { join } from 'node:path'

const load = filename => join(import.meta.dirname, `./threadfiles/${filename}`)

test('README example', async t => {
  let ctrl = new AbortController(), 
    { stdout, stderr } = exec('node --no-warnings --run example', { 
      signal: ctrl.signal 
    })

  t.before(async () => {
    stdout = await new Promise((resolve, reject) => {
      stdout.on('data', resolve), 
      stderr.on('data', reject)
    }).finally(ctrl.abort.bind(ctrl))
  })

  
  await t.test('Running "node --run example"', async t => {
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
