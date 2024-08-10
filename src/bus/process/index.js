import { 
  validateIPCPayload,
  validateString,
  validateFn
} from './validators.js'

let on = true, listeners = []

process._send_original = process.send ? process.send.bind(process) : null
process._on_original = process.on.bind(process)

process.send = (...args) => {
  args[0] = validateIPCPayload(Object.freeze(args[0]))

  return process._send_original
    ? process.connected 
      ? process._send_original(...args)
      : false
    : false
}

process._on_original('message', data => {
  if (!on) 
    return process.emitWarning('attempted to emit() on a stopped Bus')

  // monkey-patching `subprocess.send()` to verify payload shape
  // is impractical, so we at least verify it here, on the receiving end
  data = validateIPCPayload(Object.freeze(data))

  const cbs = listeners[data.name]
  
  cbs 
    ? cbs.forEach(cb => cb(data))
    : (() => {
      throw new Error(`cannot find registered listeners for: ${data.name}`)
    })()
})

process.on = (name, cb) => {
  if (!on) 
    return process.emitWarning('attempted to emit() on a stopped Bus')

  validateString(name, 'name')
  validateFn(cb, 'cb')

  listeners[name] = listeners[name] ? listeners[name].push(cb) : [cb]
}

process.stop = () => {
  on = false
  listeners = []
}

process.start = () => {
  on = true
  listeners = []
}

export default process
