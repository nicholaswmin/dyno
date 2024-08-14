
import { dyno } from '{{entrypath}}'

await dyno(async function cycle() { 
  
  performance.mark('start')
  await new Promise(r => setTimeout(r, Math.random() * 500))
  performance.mark('end')
  performance.measure('sleep-timing', 'start', 'end')

}, {
  parameters: { cyclesPerSecond: 20 },
  
  onTick: list => {    
    console.log(list().threads().metrics().pick('max'))
  }
})

// Logs: 
// 
// MetricsList(4) [
//  { cycle: 155.1, 'fibonacci': 123.6 },
//  { cycle: 146.2, 'fibonacci': 111.5 },
//  { cycle: 153.6, 'fibonacci': 120.1 },
//  { cycle: 161.3, 'fibonacci': 131.2 }
// })
