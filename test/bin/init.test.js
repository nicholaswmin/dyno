import test from 'node:test'
import path from 'node:path'
import util from 'node:util'
import child_process from 'node:child_process'
import fs, { readFile } from 'node:fs/promises'
import { fileExists, onStdout } from './utils/utils.js'

const tempdir = path.join(import.meta.dirname, './temp/test')
const exec = util.promisify(child_process.exec)

test('$ npx init: creates a simple benchmark', async t => {
  t.before(async () => {
    await fs.rm(tempdir, { recursive: true, force: true })
    await fs.mkdir(tempdir)
    await exec('npx init', { cwd: tempdir })
  })
  
  t.after(async () => {
    await fs.rm(tempdir, { recursive: true, force: true })
  })
    
  await t.test('creates a benchmark.js file', async t => {
    await t.test('creates file', async t => {
      t.assert.ok(
        await fileExists(path.join(tempdir, 'benchmark.js')), 
        'cannot find benchmark.js file'
      )
    })
    
    await t.test('with content', async t => {
      t.assert.ok(
        await readFile(path.join(tempdir, 'benchmark.js'), 'utf8'), 
        'benchmark.js file has no content'
      )
    })
    
    // @FIXME
    // issues with `npm link` create files with wrong `../index.js` main entry
    t.todo('runs the example', async t => {
      await t.test('logs some meaningful output', async t => {
        const stdout = await onStdout('NODE_ENV=test node benchmark.js', { 
          cwd: tempdir
        })
    
        t.assert.ok(stdout.includes('Tasks'))
      })
    })
  })
})
