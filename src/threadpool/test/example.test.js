import test from 'node:test'
import { execRootCommand } from './utils/utils.js'

const command = `node --run pingpong`

test('README example: ping/pong', async t => {
  let out = null

  t.before(async () => {
    out = await execCommand(command)
  })
  
  await t.test(`Running "${command}"`, async t => {
    await t.test('logs only in stdout', t => {
      t.assert.ok(out, 'no output logged')
      t.assert.ok(out.stdout, `nothing logged in stdout`)
      t.assert.ok(!out.stderr.trim(), `logged in stderr: ${out.stderr}`)
    })
    
    await t.test('some "ping"s', t => {
      const pings = out.stdout.split('ping').length
  
      t.assert.ok(pings > 1, `found: ${pings} "pings" in stdout, must be >= 1`)
    })
    
    await t.test('some "pong"s', t => {
      const pongs = out.stdout.split('pong').length
  
      t.assert.ok(pongs > 1, `found: ${pongs} "pong" in stdout, must be >= 1`)
    })
  })
})
