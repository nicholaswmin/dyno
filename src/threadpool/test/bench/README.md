# benchmark

Messaging between `primary` & `threads`.

A `ping` is `pool.broadcast()` to all threads.  

The next `ping` is broadcast when all `pongs` from *all threads* are 
received back, therefore `1 ping = 4 pongs`, if run on `4` threads.

Both events are scheduled using [`setImmediate`][setimmediate], which allows 
the fastest possible, *non-blocking* `ping`/`pong` cycle.

IPC via [`process.send`][procsend]

## Run

```bash
node primary.js
```

## Authors

[@nicholaswmin][nicholaswmin]

## License 

MIT

[procsend]: https://nodejs.org/api/process.html#processsendmessage-sendhandle-options-callback
[setimmediate]: https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate

[nicholaswmin]: https://github.com/nicholaswmin
