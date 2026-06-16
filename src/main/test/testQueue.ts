import TaskQueue from '../queue'

let i = 0

const queue = new TaskQueue(async (task) => {
  return new Promise((resolve) => setTimeout(() => {
    console.log(`Consuming task ${task}`)
    resolve()
  }, 1000))
}, 10, 10)

async function getData (): Promise<number | null> {
  return new Promise((resolve) => setTimeout(() => {
    if (i > 100) {
      resolve(null)
    } else {
      resolve(i++)
    }
  }, 50))
}

async function main () {
  const data = await getData()
  console.log(`Producing task ${data}`)
  if (data === null) {
    return
  }
  await queue.produce(data)
  await main()
}

main().then(() => {
  console.log('Finished')
})
