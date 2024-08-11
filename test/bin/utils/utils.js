import child_process from 'node:child_process'
import fs from 'node:fs/promises'

const fileExists = path => fs.access(path).then(() => !!1).catch(() => !!0)

const onStdout = (cmd, { cwd }) => {
  const ctrlr = new AbortController()

  return new Promise((resolve, reject) => {
    const res = child_process.exec(cmd, { cwd, signal: ctrlr.signal })
    const timer = setTimeout(() => {
      reject(new Error('Did not log in stdout within 1000ms'), 1000)
      ctrlr.abort()
    })

    res.stderr.once('data', data => reject(new Error(data)))
    res.stdout.once('data', data => {
      clearTimeout(timer)
      resolve(data.toString())
      ctrlr.abort()
    })
  })
}

export { fileExists, onStdout }
