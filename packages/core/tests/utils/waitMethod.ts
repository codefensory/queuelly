function createWaitMethod() {
  let currResolve: (resutl: any) => void

  return {
    waitMethod: new Promise((resolve) => {
      currResolve = resolve
    }),
    runMethod: () => currResolve(undefined)
  }
}

export default createWaitMethod
