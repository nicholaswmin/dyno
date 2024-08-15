
import { dyno } from '{{entrypath}}'

await dyno(async function cycle() { 
  
  performance.mark('start')
  await new Promise(r => setTimeout(r, Math.random() * 500))
  performance.measure('foo', 'start')

  await new Promise(r => setTimeout(r, Math.random() * 250))
  performance.measure('bar', 'start')
}, {
  parameters: { threads: 4 },
  
  onTick: metrics => {    
    console.log(metrics().threads().pick('mean'))
  }
})

// Logs: 
// 
// MetricsList(4) [
//   { foo: 305.25, bar: 445.50 },
//   { foo: 168.21, bar: 287.10 },
//   { foo: 169.35, bar: 252.55 },
//   { foo: 297.01, bar: 456.51 }
// ]
