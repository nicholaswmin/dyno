# Unibus

IPC between parent/`fork()` with an `EventEmitter` API 

## Install

```bash
npm i https://github.com/@nicholaswmin/unibus
```

## Usage
```js
// primary.js
import { PrimaryBus } from '@nicholaswmin/process-bus'

const bus = new PrimaryBus()

// an array of `ChildProcess`
bus.start([
  child_process.fork('child.js')),
  child_process.fork('child.js'))
])

// emit to all children
bus.emit('ping', { foo: 'bar' })

// ... when done 
await bus.stop()
```

and child:

```js
// child.js
import { ChildBus } from '@nicholaswmin/process-bus'

const bus = new ChildBus()

bus.on('ping', () => {  
  bus.emit('pong')
})

process.on('disconnect', async () => {
  // stop the bus on exit-cleanups
  await bus.stop()
  process.disconnect()
})
```

## test

```bash
npm test
```

## Authors

[@nicholaswmin](https://github.io/nicholaswmin)

License

MIT
