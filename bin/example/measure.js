
import { dyno } from '{{entrypath}}'

await dyno(async function cycle() { 
  
  performance.mark('start')
  await new Promise(r => setTimeout(r, Math.random() * 500))
  performance.mark('end')
  performance.measure('sleep', 'start', 'end')

}, {
  parameters: { cyclesPerSecond: 20 },
  
  onTick: list => {    
    console.log(list().threads().pick('mean'))
  }
})

// Logs: 
// 
// MetricsList(4) [
//  { cycle: 155.1, 'sleep': 123.6 },
//  { cycle: 146.2, 'sleep': 111.5 },
//  { cycle: 153.6, 'sleep': 120.1 },
//  { cycle: 159.5, 'sleep': 131.2 }
// })
