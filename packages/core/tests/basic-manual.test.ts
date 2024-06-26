import { describe, expect, it } from "vitest"
import { Queuelly } from "../src/queuelly"
import createNumberLocalAPI from "./utils/createNumberLocalAPI"
import runran from "./utils/runran"

describe("Basic with manual run uses cases", () => {
  it("runs a simple promise", async () => {
    const queuelly = new Queuelly<number>({ runManual: true })

    const action = async () => {
      return 100
    }

    let result: number | null | undefined = null

    queuelly
      .add({
        name: "basic",
        action,
      })
      .then((r) => (result = r))

    await queuelly.run()

    expect(result).toBe(100)
  })

  it("runs two simples promises dependents", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    const { run, control } = runran()

    const queuelly = new Queuelly<number>({ runManual: true })

    queuelly.add({
      name: "update",
      action: () => run(numberLocalAPI.make().update(4), 0),
    })

    queuelly.add({
      name: "add",
      action: () => run(numberLocalAPI.make().add(1), 1),
    })

    await queuelly.run()

    expect(numberLocalAPI.get()).toBe(5)

    expect(control(0).ranBefore(1)).toBe(true)
  })

  it("runs three promises with waitFor", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    const { run, control } = runran()

    const queuelly = new Queuelly<number>({ runManual: true })

    queuelly.add({
      name: "add",
      action: () => run(numberLocalAPI.make({ delay: 100 }).add(1), 0),
    })

    queuelly.add({
      name: "add",
      action: () => run(numberLocalAPI.make({ delay: 200 }).add(1), 1),
    })

    queuelly.add({
      name: "update",
      waitFor: ["add"],
      action: () => run(numberLocalAPI.make({ delay: 50 }).update(4), 2),
    })

    await queuelly.run()

    expect(numberLocalAPI.get()).toBe(4)

    expect(control(0).ranBefore(1)).toBe(true)

    expect(control(1).ranBefore(2)).toBe(true)
  })

  it("runs three promises with depends", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    const { run, control } = runran()

    const queuelly = new Queuelly<number>({ runManual: true })

    queuelly.add({
      name: "add",
      action: () => run(numberLocalAPI.make({ delay: 100 }).add(1), 0),
    })

    queuelly.add({
      name: "add",
      action: () => run(numberLocalAPI.make({ delay: 200 }).add(1), 1),
    })

    queuelly.add({
      name: "update",
      depends: ["add"],
      action: () => run(numberLocalAPI.make({ delay: 50 }).update(4), 2),
    })

    await queuelly.run()

    expect(numberLocalAPI.get()).toBe(4)

    expect(control(0).ranBefore(1)).toBe(true)

    expect(control(1).ranBefore(2)).toBe(true)
  })

  it("does not execute a promise if the one it depends on fails", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    const { run, control } = runran()

    const queuelly = new Queuelly<number>({ runManual: true })

    queuelly.add({
      name: "add",
      action: () => run(numberLocalAPI.make({ delay: 100 }).add(1), 0),
    })

    queuelly.add({
      name: "add",
      action: () => run(numberLocalAPI.make({ delay: 200, fails: true }).add(1), 1),
    })

    queuelly.add({
      name: "update",
      depends: ["add"],
      action: () => run(numberLocalAPI.make().update(4), 2),
    })

    await queuelly.run()

    expect(numberLocalAPI.get()).toBe(1)

    expect(control(0).ranBefore(1)).toBe(true)

    expect(control(2).ran()).toBeUndefined()
  })

  it("should only fail one dependency, the next one must be executed", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    const { run, control } = runran()

    const queuelly = new Queuelly<number>({ runManual: true })

    queuelly.add({
      name: "add",
      action: () => run(numberLocalAPI.make({ delay: 100 }).add(1), 0),
    })

    queuelly.add({
      name: "add",
      action: () => run(numberLocalAPI.make({ delay: 200, fails: true }).add(1), 1),
    })

    queuelly.add({
      name: "update",
      depends: ["add"],
      action: () => run(numberLocalAPI.make().update(6), 2),
    })

    queuelly.add({
      name: "update",
      depends: ["add"],
      action: () => run(numberLocalAPI.make().update(4), 3),
    })

    await queuelly.run()

    expect(numberLocalAPI.get()).toBe(4)

    expect(control(0).ranBefore(1)).toBe(true)

    expect(control(2).ran()).toBeUndefined()

    expect(control(3).ran()).not.toBeUndefined()
  })

  it("should replace an promise when canReplace is enabled", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    const { run, control } = runran()

    const queuelly = new Queuelly<number>({ runManual: true })

    queuelly.add({
      name: "add",
      action: () => run(numberLocalAPI.make().add(1), 0),
    })

    queuelly.add({
      name: "add",
      action: () => run(numberLocalAPI.make().add(1), 1),
    })

    queuelly.add({
      name: "update",
      depends: ["add"],
      waitFor: ["update"],
      canReplace: true,
      action: () => run(numberLocalAPI.make().update(6), 2),
    })

    queuelly.add({
      name: "update",
      depends: ["add"],
      waitFor: ["update"],
      canReplace: true,
      action: () => run(numberLocalAPI.make().update(3), 3),
    })

    await queuelly.run()

    expect(control(2).ran()).toBeUndefined()

    expect(numberLocalAPI.get()).toBe(3)

    expect(control(0).ranBefore(1)).toBe(true)

    expect(control(1).ranBefore(3)).toBe(true)
  })

  it("will execute all promises and assign to the optimistic update the last one completed", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    let optimisticValue = 0

    const { run, ranOrder } = runran()

    const queuelly = new Queuelly<number>({ runManual: true })

    const createAddSpot = (value: number, opts: { key: number }) => {
      return queuelly.add({
        name: "add",
        waitFor: ["update"],
        action: () => run(numberLocalAPI.make().add(value), opts.key),
        onComplete: (value, { isLast }) => {
          if (isLast) {
            optimisticValue = value
          }
        },
      })
    }

    const createUpdateSpot = (value: number, opts: { key: number }) => {
      return queuelly.add({
        name: "update",
        depends: ["add"],
        waitFor: ["update"],
        canReplace: true,
        action: () => run(numberLocalAPI.make().update(value), opts.key),
        onComplete: (value, { isLast }) => {
          if (isLast) {
            optimisticValue = value
          }
        },
      })
    }

    createAddSpot(1, { key: 0 })

    createAddSpot(2, { key: 1 })

    createUpdateSpot(4, { key: 2 })

    createUpdateSpot(2, { key: 3 })

    createAddSpot(3, { key: 4 })

    createUpdateSpot(4, { key: 5 })

    await queuelly.run()

    expect(numberLocalAPI.get()).toBe(4)

    expect(optimisticValue).toBe(4)

    expect(ranOrder()).toBe([0, 1, 3, 4, 5].toString())
  })

  it("should update the optimistic when a spot fails", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    let optimisticValue = 0

    const { run, ranOrder } = runran()

    const queuelly = new Queuelly<number>({ runManual: true })

    const createAddSpot = (value: number, opts: { key: number; fails?: boolean }) => {
      return queuelly.add({
        name: "add",
        waitFor: ["update"],
        action: () => run(numberLocalAPI.make({ fails: opts.fails }).add(value), opts.key),
        onComplete: (value, { isLast }) => {
          if (isLast) {
            optimisticValue = value
          }
        },
        onError: (_, { isLast, lastValue }) => {
          if (isLast && lastValue) {
            optimisticValue = lastValue
          } else {
            optimisticValue -= 1
          }
        },
      })
    }

    const createUpdateSpot = (value: number, opts: { key: number; fails?: boolean }) => {
      return queuelly.add({
        name: "update",
        depends: ["add"],
        waitFor: ["update"],
        canReplace: true,
        action: () => run(numberLocalAPI.make({ fails: opts.fails }).update(value), opts.key),
        onComplete: (value, { isLast }) => {
          if (isLast) {
            optimisticValue = value
          }
        },
        onError: (_, { isLast, lastValue }) => {
          if (isLast && lastValue) {
            optimisticValue = lastValue
          }
        },
      })
    }

    createAddSpot(1, { key: 0 })

    createAddSpot(2, { key: 1 })

    createUpdateSpot(2, { key: 2 })

    createAddSpot(3, { key: 3, fails: true })

    createAddSpot(2, { key: 4 })

    createUpdateSpot(4, { key: 5, fails: true })

    await queuelly.run()

    expect(numberLocalAPI.get()).toBe(4)

    expect(optimisticValue).toBe(4)

    expect(ranOrder()).toBe([0, 1, 2, 3, 4, 5].toString())
  })

  it("should return the value of the last one that was executed, and not the last one in the queue", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    let optimisticValue = 0

    const { run, ranOrder } = runran()

    const queuelly = new Queuelly<number>({ runManual: true })

    const createAddSpot = (value: number, opts: { key: number; fails?: boolean; delay: number }) => {
      return queuelly.add({
        name: "add",
        waitFor: ["update"],
        action: () => run(numberLocalAPI.make({ fails: opts.fails, delay: opts.delay }).add(value), opts.key),
        onComplete: (value, { isLast }) => {
          if (isLast) {
            optimisticValue = value
          }
        },
        onError: (_, { isLast, lastValue }) => {
          if (isLast && lastValue) {
            optimisticValue = lastValue
          } else {
            optimisticValue -= 1
          }
        },
      })
    }

    const createUpdateSpot = (value: number, opts: { key: number; fails?: boolean; delay?: number }) => {
      return queuelly.add({
        name: "update",
        depends: ["add"],
        waitFor: ["update"],
        canReplace: true,
        action: () => run(numberLocalAPI.make({ fails: opts.fails, delay: opts.delay }).update(value), opts.key),
        onComplete: (value, { isLast }) => {
          if (isLast) {
            optimisticValue = value
          }
        },
        onError: (_, { isLast, lastValue }) => {
          if (isLast && lastValue) {
            optimisticValue = lastValue
          }
        },
      })
    }

    createAddSpot(1, { key: 1, delay: 400 })

    createAddSpot(2, { key: 2, delay: 100 })

    createAddSpot(1, { key: 3, delay: 50, fails: true })

    createUpdateSpot(5, { key: 4, delay: 100 })

    createAddSpot(1, { key: 5, delay: 200 })

    createAddSpot(1, { key: 6, delay: 100 })

    await queuelly.run()

    expect(numberLocalAPI.get()).toBe(5)

    expect(optimisticValue).toBe(5)

    expect(ranOrder()).toBe([3, 2, 1, 6, 5].toString())
  })
})
