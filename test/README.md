# Dyno tests

The tests provide a file path to a `task.js` rather than directly provide a 
`taskFn` function.

This allows testing without the test files themselves getting `forked` 
into threads.
