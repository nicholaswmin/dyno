# benchmark

Messaging between `primary` & `threads`.

- A `ping` is sent to all threads, in fan-out.
- Next `ping` is sent when all `pongs` are received, so *`1` ping = `n` pongs*, 
  where `n` is the number of threads.

The `ping` event `data` is resent to the primary in each `pong`.

Events are scheduled with [`setImmediate`][setimmediate].  
IPC via [`process.send`][procsend].

## Run

> 4 threads, 5 kb of `ping` event `data`:

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
