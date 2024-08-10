import test from 'node:test'
import path from 'node:path'
import util from 'node:util'
import child_process from 'node:child_process'
import fs, { readFile } from 'node:fs/promises'

const folderpaths = {
  test: path.join(import.meta.dirname, './temp/test'),
  benchmark: path.join(import.meta.dirname, './temp/test/benchmark')
}

const fileExists = filepath =>  fs.access(filepath)
  .then(() => true)
  .catch(() => false)

const exec = util.promisify(child_process.exec)

const execQuick = (cmd, { cwd }) => {
  const ctrl = new AbortController()

  return new Promise((resolve, reject) => {
    const res = child_process.exec(cmd, { cwd, signal: ctrl.signal })
    
    res.stderr.once('data', data => reject(new Error(data)))
    res.stdout.once('data', data => {
      resolve(data.toString())
      ctrl.abort()
    })
  })
}

test('$ npx init: creates sample benchmark', async t => {
  t.before(async () => {
    await fs.rm(folderpaths.benchmark, { recursive: true, force: true })
    await exec('npx init', { cwd: folderpaths.test })
  })
  
  t.after(async () => {
    await fs.rm(folderpaths.benchmark, { recursive: true, force: true })
  })
    
  await t.test('creates files & folders', async t => {
    await t.test('a benchmark folder', async t => {
      t.assert.ok(
        await fileExists(folderpaths.benchmark), 
        'cannot find /benchmark folder'
      )
    })
    
    await t.test('a run.js', async t => {
      await t.test('creates file', async t => {
        t.assert.ok(
          await fileExists(path.join(folderpaths.benchmark, 'run.js')), 
          'cannot find benchmark/run.js file'
        )
      })
      
      await t.test('with content', async t => {
        t.assert.ok(
          await readFile(path.join(folderpaths.benchmark, 'run.js'), 'utf8'), 
          'run.js file has no content'
        )
      })
    })
    
    await t.test('a task.js', async t => {
      await t.test('creates file', async t => {
        t.assert.ok(
          await fileExists(path.join(folderpaths.benchmark, 'README.md')), 
          'cannot find benchmark/README.md file'
        )
      })
      
      await t.test('with content', async t => {
        t.assert.ok(
          await readFile(path.join(folderpaths.benchmark, 'task.js'), 'utf8'), 
          'task.js file has no content'
        )
      })
    })
    
    await t.test('a README.md', async t => {
      await t.test('creates file', async t => {
        t.assert.ok(
          await fileExists(path.join(folderpaths.benchmark, 'README.md')), 
          'cannot find benchmark/README.md file'
        )
      })
      
      await t.test('with content', async t => {
        t.assert.ok(
          await readFile(path.join(folderpaths.benchmark, 'README.md'), 'utf8'), 
          'README.md file has no content'
        )
      })
    })
    
    await t.test('a bind.js', async t => {
      await t.test('creates file', async t => {
        t.assert.ok(
          await fileExists(path.join(folderpaths.benchmark, 'bind.js')), 
          'cannot find benchmark/bind.js file'
        )
      })
      
      await t.test('with content', async t => {
        t.assert.ok(
          await readFile(
            path.join(folderpaths.benchmark, 'bind.js'), 'utf8'), 
          'bind.js file has no content'
        )
      })
    })
    
    await t.test('creates a package.json', async t => {
      await t.test('creates file', async t => {
        t.assert.ok(
          await fileExists(path.join(folderpaths.benchmark, 'package.json')), 
          'cannot find benchmark/package.json file'
        )
      })
      
      await t.test('with content', async t => {
        t.assert.ok(
          await readFile(
            path.join(folderpaths.benchmark, 'package.json'), 'utf8'), 
          'package.json file has no content'
        )
      })
    })
    
    // @FIXME
    // issues with `npm link` create files with wrong `../index.js` main entry
    t.todo('runs the example', async t => {
      await t.test('logs some meaningful output', async t => {
        const out = await execQuick('NODE_ENV=test node run.js', { 
          cwd: folderpaths.benchmark
        })
    
        t.assert.ok(out.includes('Tasks'))
      })
    })
  })
})
