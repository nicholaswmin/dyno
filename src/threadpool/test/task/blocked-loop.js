// has a blocked event loop

function fibonacci(n) {
  return n < 1 ? 0
    : n <= 2 ? 1
    : fibonacci(n - 1) + fibonacci(n - 2)
}

fibonacci(300)

// this should never run

process.on('message', message => {  
  message === 'exit' ? setTimeout(() => process.exit(0)) : 0
})
