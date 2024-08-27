# `ping`/`pong` example

> The `ping`/`pong` example from README.md

This example demonstrates messaging between threads and the primary.

`pool.emit()` emits a message to a single thread, each time choosing the
*next* thread, therefore running this should produce output with a `pong` 
always following a `ping` regardless of number of threads.

## Run
 
```bash
node primary.js
```
