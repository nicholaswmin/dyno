import test from 'node:test'

import { execCommand } from './utils/utils.js'

const command = `node --run pingpong`

test('README example: pingpong', async t => {
  let out = null

  t.before(async () => {
    out = await execCommand(command)
  })
  
  await t.test(`Running "${command}"`, async t => {
    await t.test('logs in stdout', t => {
      t.assert.ok(out, 'did not create any output')
      t.assert.ok(out.stdout, `nothing logged in stdout`)
    })
    
    await t.test('does not log in stderr', t => {
      t.assert.ok(!out.stderr, `logged in stderr: ${out.stderr}`)
    })
    
    
    await t.test('logs "ping"s', async t => {
      const pings = out.stdout.split('ping').length
  
      await t.test('at least 3', t => {
        const pings = out.stdout.split('ping').length
    
        t.assert.ok(pings > 3, `found: ${pings} "ping" in stdout, must be >= 3`)
      })
    })
    
    await t.test('logs "pong"s', async t => {
      await t.test('at least 3', t => {
        const pongs = out.stdout.split('pong').length
    
        t.assert.ok(pongs > 3, `found: ${pongs} "pong" in stdout, must be >= 3`)
      })
    })
  })
})
