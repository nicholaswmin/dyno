import test from 'node:test'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { execFile as execFileCB } from 'node:child_process'

test('example: pingpong', { timeout: 5000 }, async t => {
  let out = null

  t.before(async () => {
    out = await promisify(execFileCB)(
      'node', [ '--no-warnings', '--run', 'pingpong' ], 
      { cwd: join(import.meta.dirname, '../'), stdio: 'pipe', encoding: 'utf8' }
    )
  })
  
  await t.test('logs in stdout', t => {
    t.assert.ok(out, 'has no output')
    t.assert.ok(out.stdout, 'nothing logged in stdout')
  })
  
  await t.test('does not log in stderr', t => {
    t.assert.ok(!out.stderr, `logged in stderr: ${out.stderr}`)
  })
  
  await t.test('logs "ping"', async t => {
    await t.test('logs "ping" word in stdout', t => {
      t.assert.ok(out.stdout.includes('ping'), 'cannot find "ping" in stdout')
    })
    
    await t.test('multiple "ping"s', t => {
      t.assert.ok(out.stdout.split('ping').length > 5, '< 5 "ping" in stdout')
    })
  })
  
  await t.test('logs "pong"', async t => {
    await t.test('logs "pong"', t => {
      t.assert.ok(out.stdout.includes('pong'), 'cannot find "pong" in stdout')
    })
    
    await t.test('multiple "pong"s', t => {
      t.assert.ok(out.stdout.split('pong').length > 5, '< 5 "pong" in stdout')
    })
  })
})
