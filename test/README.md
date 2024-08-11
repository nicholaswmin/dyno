# Dyno tests

The tests provide a file path to `task.js` files rather than directly 
provide a `taskFn` function.

for example, this:

```js
await dyno(function cycle() {
  // task
}, { options... })
```

is changed to something like this:

```js
await dyno('../task.js', { options... })
```

This allows testing without the test files themselves getting `forked` 
into threads.
