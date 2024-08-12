import { dyno } from '{{entrypath}}'
import console from '@nicholaswmin/console-plot'

await dyno(async function cycle() { 
  // measure a 'sleep' random function
  await performance.timerify(async function sleep() {
    return new Promise(res => setTimeout(res, Math.random() * 20))
  })()

}, {
  parameters: { 
    cyclesPerSecond: 50, 
    durationMs: 20 * 1000,
    threads: 4
  },
  
  onTick: ({ main, tasks, snapshots }) => {   
    delete snapshots.evt_loop // discard for now

    console.clear()
    console.table(main)
    console.table(tasks)
    console.plot(snapshots)
  }
})
