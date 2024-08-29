# benchmark

Messaging between `primary` & `threads`.

- A `ping` is sent to all threads, in fan-out.
- Next `ping` is sent when *all* `pongs` from *all* threads are received,  
  therefore `1 ping = 4 pongs`, assuming `4 threads`.
- Each `ping` includes some event data which is then re-sent back to the 
  primary with each `pong`.

Both events are scheduled using [`setImmediate`][setimmediate], which allows 
the fastest possible, *non-blocking* cycle.

IPC via [`process.send`][procsend].

## Run

> 4 threads, sending 5 kb of data in each `ping`:

```bash
node primary.js --size=4 --data=5
```

### Parameters:

- `--size` : `Number` : thread count.
- `--data` : `Number` : kilobytes of `data` payload per `ping` event.

## Authors

[@nicholaswmin][nicholaswmin]

## License 

MIT

[procsend]: https://nodejs.org/api/process.html#processsendmessage-sendhandle-options-callback
[setimmediate]: https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate

[nicholaswmin]: https://github.com/nicholaswmin
