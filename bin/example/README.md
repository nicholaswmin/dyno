# benchmark

A benchmark of [this code][task], run via the [\`dyno\`][dyno-module] module

## Usage

- Edit `run.js` with own test parameters and log output
- Edit `task.js` with own benchmarked code and custom measures

then:

> run the benchmark

```bash
npm run benchmark
```

## Benchmarking on cloud providers

Some cloud providers allow only webserver-app deployments.   
A mock server is provided in `bind.js` that binds to a port.

> start a mock server   

```bash
npm start
```

[task]: ./task.js
[dyno-module]: https://www.npmjs.com/package/@nicholaswmin/dyno
