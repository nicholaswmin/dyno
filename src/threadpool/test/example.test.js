import test from 'node:test'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'

test('example: pingpong', async t => {
  let out = null

  t.before(async () => {
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 1 * 1000)
    
    try {
      out = await promisify(execFile)(
        'node', [ '--no-warnings', '--run', 'pingpong' ], 
        { 
          cwd: join(import.meta.dirname, '../'), 
          stdio: 'pipe', 
          encoding: 'utf8',
          signal: ctrl.signal
        }
      )
    } catch (err) {
      if (err.code !== 'ABORT_ERR')
        throw err
      
      out = err
    }
  })
  
  await t.test('logs in stdout', t => {
    t.assert.ok(out, 'has no output')
    t.assert.ok(out.stdout, 'nothing logged in stdout')
  })
  
  await t.test('does not log in stderr', t => {
    t.assert.ok(!out.stderr, `logged in stderr: ${out.stderr}`)
  })
  
  await t.test('logs "ping"s', async t => {
    const pings = out.stdout.split('ping').length

    await t.test('at least 3', async t => {
      const pings = out.stdout.split('ping').length
  
      t.assert.ok(pings > 3, `found: ${pings} "ping" in stdout, must be >= 3`)
    })
  })
  
  await t.test('logs "pong"s', async t => {
    await t.test('at least 3', async t => {
      const pongs = out.stdout.split('pong').length
  
      t.assert.ok(pongs > 3, `found: ${pongs} "pong" in stdout, must be >= 3`)
    })
  })
})
