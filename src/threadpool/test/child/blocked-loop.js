// has a blocked event loop
// 
// the following is an (intentionally) extremely-inefficient recursive 
// Fibonnaci Sequence function which blocks the Event Loop.
// 
// Anything `> fibonacci(50)` should block any CPU as of 2024
function fibonacci(n) {
  return n < 1 ? 0
    : n <= 2 ? 1
    : fibonacci(n - 1) + fibonacci(n - 2)
}

fibonacci(500)

console.error('THIS SHOULD NEVER LOG')

process.on('message', message => {  
  message === 'exit' ? setImmediate(() => process.exit(0)) : 0
})
