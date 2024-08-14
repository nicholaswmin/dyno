// `npm i @nicholaswmin/console-plot --no-save`

import { dyno } from '{{entrypath}}'
import console from '@nicholaswmin/console-plot'

await dyno(async function cycle() { 

  await performance.timerify(function sleepOne(ms) {
    return new Promise(r => setTimeout(r, Math.random() * ms))
  })(Math.random() * 20)
  
  await performance.timerify(function sleepTwo(ms) {
    return new Promise(r => setTimeout(r, Math.random() * ms))
  })(Math.random() * 20)
  
}, {

  parameters: { cyclesPerSecond: 15, durationMs: 20 * 1000 },

  onTick: metrics => {  
    console.clear()
    console.plot(metrics().threads().pick('snapshots').of('mean').group(), {
      title: 'Plot',
      subtitle: 'mean durations (ms)'
    })
  }
})
