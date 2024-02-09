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
      ranAfter: (otherKey: string | number) => executes[key] < executes[otherKey]
    }
  }

  return { run, control }
}

export default runran
