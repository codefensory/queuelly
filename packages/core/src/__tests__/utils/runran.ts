function runran() {
  let index = 0

  let executes: Record<string | number, number> = {}

  function run<T>(value: T, key: string | number) {
    executes[key] = index

    index--

    return value
  }

  const control = (key: string | number) => {
    return {
      ran: () => executes[key],
      ranBefore: (otherKey: string | number) => executes[key] > executes[otherKey],
      ranAfter: (otherKey: string | number) => executes[key] < executes[otherKey],
    }
  }

  const ranAllOfThese = (keys: string[] | number[]) =>
    keys.filter(key => executes[key] === undefined).length === 0 &&
    equalArrayValues(keys.map((key) => executes[key]), Object.keys(executes).map(key => executes[key]))

  return { run, control, ranAllOfThese }
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
