
import { dyno } from '{{entrypath}}'

await dyno(async function cycle() { 
  
  performance.mark('start')
  await new Promise(r => setTimeout(r, Math.random() * 500))
  performance.measure('sleep', 'start')

}, {
  parameters: { threads: 4 },
  
  onTick: metrics => {    
    console.log(metrics().threads().pick('mean'))
  }
})

// Logs: 
// 
// MetricsList(4) [
//   { cycle: 141.33, sleep: 140.67 },
//   { cycle: 241.21, sleep: 240.53 },
//   { cycle: 333.37, sleep: 332.65 },
//   { cycle: 317.67, sleep: 316.67 }
// ]
