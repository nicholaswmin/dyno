# benchmark


Messaging between `primary` & `threads`.

The benchmark schedules a `pong` using [`setImmediate`][setimmediate],  
in response to a `ping` which uses the same scheduling.

This allows the fastest possible, *non-blocking* `ping`/`pong` cycle.

IPC via [`process.send`][procsend]

## Run

Run a benchmark on `4 threads` and `1000 bytes` of data per event,   
using fan-out:

```bash
node --size=4 --data=1000 --type=emit primary.js
```

## Authors

[@nicholaswmin][nicholaswmin]

## License 

MIT

[procsend]: https://nodejs.org/api/process.html#processsendmessage-sendhandle-options-callback
[setimmediate]: https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate

[nicholaswmin]: https://github.com/nicholaswmin
