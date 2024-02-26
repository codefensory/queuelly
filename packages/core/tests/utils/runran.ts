function runran() {
  let index = 0

  let executes: Record<string | number, number> = {}

  function run<T extends Promise<any>>(value: T, key: string | number) {
    value.then(() => {
      executes[key] = index

      index--
    }).catch(() => {
      executes[key] = index

      index--
    })

    return value
  }

  const control = (key: string | number) => {
    return {
      ran: () => executes[key],
      ranBefore: (otherKey: string | number) => executes[key] > executes[otherKey],
      ranAfter: (otherKey: string | number) => executes[key] < executes[otherKey],
    }
  }

  const ranOrder = () => Object.keys(executes).sort((a, b) => executes[a] < executes[b] ? 1 : executes[a] > executes[b] ? -1 : 0).toString()

  return { run, control, ranOrder }
}

function equalArrayValues(arr1: number[], arr2: number[]) {
  if (arr1.length !== arr2.length) {
    return false
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false
    }
  }

  return true
}

export default runran
