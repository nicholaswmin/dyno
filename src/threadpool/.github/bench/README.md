# benchmark


Messaging between `primary` & `threads`.

The benchmark schedules a `pong` using [`setImmediate`][setimmediate]
in response to a `ping`,   
which uses the same `setImmediate` scheduling.

This allows the fastest possible, *non-blocking* `ping`/`pong` cycle.

IPC via [`process.send`][procsend]

## Authors

[@nicholaswmin][nicholaswmin]

## License 

MIT

[procsend]: https://nodejs.org/api/process.html#processsendmessage-sendhandle-options-callback
[setimmediate]: https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate

[nicholaswmin]: https://github.com/nicholaswmin
