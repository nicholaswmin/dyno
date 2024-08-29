# `pool.broadcast` benchmark

Messaging between `primary` & `threads`.

A `ping` is `pool.broadcast()` to all threads.  
The next ping is broadcast when all `pongs` from all threads are 
received back.

Both `ping` and `pong` are scheduled using [`setImmediate`][setimmediate],  
which allows the fastest possible, *non-blocking* `ping`/`pong` cycle.

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
