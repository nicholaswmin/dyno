# benchmark

Messaging between `primary` & `threads`.

- A `ping` is `pool.broadcast()` to all threads, in fan-out.
- Next `ping` is broadcast when *all* previous `pongs` from *all* threads are 
  received, therefore `1 ping` = `4 pongs` assuming `4 threads`.
- Each `ping` includes some data which is then re-sent back to the primary
  in each `pong`.

Both events are scheduled using [`setImmediate`][setimmediate], which allows 
the fastest possible, *non-blocking* cycle.

IPC via [`process.send`][procsend].

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
