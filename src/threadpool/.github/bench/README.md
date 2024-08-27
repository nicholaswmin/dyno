# `ping`/`pong` benchmark


A benchmark, demonstrating messaging between threads and the primary.

The benchmark schedules a `pong` using `setImmediate`, in response to `ping`,
which uses the same.

This benchmark demonstrates the fastest *non-blocking* `ping`/`pong` cycle.

IPC via [`process.send`][procsend]

## Authors

[@nicholaswmin][nicholaswmin]

## License 

MIT

[procsend]: https://nodejs.org/api/process.html#processsendmessage-sendhandle-options-callback
[nicholaswmin]: https://github.com/nicholaswmin
