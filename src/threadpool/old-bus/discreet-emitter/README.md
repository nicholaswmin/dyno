# DiscreetEmitter
This `EventEmitter` minds its manners and doesn't meddle in others people
handlers.

`removeAllListeners` is a super convenient catch-all that does exactly what 
it says on the tin; except that one time you'll strip a socket object 
from it's listeners, then wonder why it's not socketing.

This class extends `EventEmitter` with a method `removeTrackedListeners` 
which only removes it's own listeners:

It's mean to be used like this:

```js
const ee = EventEtitter() 
ee.on('Hello', () => {
  console.log('Hello world'')
})

// temporarily merge into a DiscreetEmitter
const discreet = new DiscreetEmitter(ee)

discreet.on('bar', functionA)
discreet.on('baz', functionB)

discreet.removeTrackedListeners()
// `bar`, `baz` removed.

// but previous listeners are kept as they were,
// this works:
ee.emit('hello')
//  hello world! 
```js

```

## test

```bash
npm test
```

## Authors

[@nicholaswmin](https://github.io/nicholaswmin)

License

MIT
