import { dyno } from '{{entrypath}}'
import console from '@nicholaswmin/console-plot'

await dyno(async function cycle() { 
  
  // sleep one
  await performance.timerify(async function sleepTwo() {
    return new Promise(res => setTimeout(res, Math.random() * 20))
  })()
  
  // sleep two
  await performance.timerify(async function sleepOne() {
    return new Promise(res => setTimeout(res, Math.random() * 20))
  })()

}, {
  parameters: { 
    cyclesPerSecond: 50, 
    durationMs: 20 * 1000
  },
  
  onTick: ({ main, tasks, snapshots }) => {   
    console.clear()
    console.table(main)
    console.table(tasks)
    console.plot(snapshots, {
      title: 'Timings timeline',
      subtitle: 'average durations, in ms',
      height: 15,
      width: 100
    })
  }
})
