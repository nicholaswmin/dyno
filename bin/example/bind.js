// A "mock" webserver to allow deployment (and thus benchmarking) on
// cloud providers that only allow web-server deployments, i.e Heroku.
// This can be started via `npm start`

import http from 'http'
const port = process.env.PORT || 8000

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.write('A mock server to allow benchmarking on server-only providers')
  res.write('\n --- \n')
  res.write('\nEnv vars:\n')
  res.write(JSON.stringify(process.env, null, 2))
  res.end()
}).listen(port, console.log(`Success! Mock server running on port: ${port}`))
