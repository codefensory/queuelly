import { describe, expect, it } from "vitest";
import { Queuelly } from "../queuelly";
import createNumberLocalAPI from "./utils/createNumberLocalAPI";
import runran from "./utils/runran";
import createWaitMethod from "./utils/waitMethod";

describe("Basic uses cases", () => {
  it("runs a simple promise", async () => {
    const queuelly = new Queuelly<number>()

    let executed = false

    const action = async () => {
      executed = true

      return 0;
    }

    const result = await queuelly.add({
      name: "basic",
      action,
    })

    expect(executed).toBe(true)

    expect(result).toBe(0)
  })

  it("runs two simples promises dependents", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    const { run, control } = runran()

    const { waitMethod, runMethod } = createWaitMethod()

    const queuelly = new Queuelly<number>((pending) => !pending && runMethod())

    queuelly.add({
      name: 'update',
      action: () => run(numberLocalAPI.make().update(4), 0)
    })

    queuelly.add({
      name: 'add',
      action: () => run(numberLocalAPI.make().add(1), 1),
    })

    await waitMethod

    expect(numberLocalAPI.get()).toBe(5)

    expect(control(0).ranBefore(1)).toBe(true)
  })

  it("runs three promises with waitFor", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    const { run, control } = runran()

    const { waitMethod, runMethod } = createWaitMethod()

    const queuelly = new Queuelly<number>((pending) => !pending && runMethod())

    queuelly.add({
      name: 'add',
      action: () => run(numberLocalAPI.make({ delay: 100 }).add(1), 0)
    })

    queuelly.add({
      name: 'add',
      action: () => run(numberLocalAPI.make({ delay: 200 }).add(1), 1),
    })

    queuelly.add({
      name: 'update',
      waitFor: ['add'],
      action: () => run(numberLocalAPI.make({ delay: 50 }).update(4), 2),
    })

    await waitMethod

    expect(numberLocalAPI.get()).toBe(4)

    expect(control(0).ranBefore(1)).toBe(true)

    expect(control(1).ranBefore(2)).toBe(true)
  })

  it("runs three promises with depends", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    const { run, control } = runran()

    const { waitMethod, runMethod } = createWaitMethod()

    const queuelly = new Queuelly<number>((pending) => !pending && runMethod())

    queuelly.add({
      name: 'add',
      action: () => run(numberLocalAPI.make({ delay: 100 }).add(1), 0)
    })

    queuelly.add({
      name: 'add',
      action: () => run(numberLocalAPI.make({ delay: 200 }).add(1), 1),
    })

    queuelly.add({
      name: 'update',
      depends: ['add'],
      action: () => run(numberLocalAPI.make({ delay: 50 }).update(4), 2),
    })

    await waitMethod

    expect(numberLocalAPI.get()).toBe(4)

    expect(control(0).ranBefore(1)).toBe(true)

    expect(control(1).ranBefore(2)).toBe(true)
  })

  it("does not execute a promise if the one it depends on fails", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    const { run, control } = runran()

    const { waitMethod, runMethod } = createWaitMethod()

    const queuelly = new Queuelly<number>((pending) => !pending && runMethod())

    queuelly.add({
      name: 'add',
      action: () => run(numberLocalAPI.make({ delay: 100 }).add(1), 0)
    })

    queuelly.add({
      name: 'add',
      action: () => run(numberLocalAPI.make({ delay: 200, fails: true }).add(1), 1),
    })

    queuelly.add({
      name: 'update',
      depends: ['add'],
      action: () => run(numberLocalAPI.make().update(4), 2),
    })

    await waitMethod

    expect(numberLocalAPI.get()).toBe(1)

    expect(control(0).ranBefore(1)).toBe(true)

    expect(control(2).ran()).toBeUndefined()
  })

  it("should only fail one dependency, the next one must be executed", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    const { run, control } = runran()

    const { waitMethod, runMethod } = createWaitMethod()

    const queuelly = new Queuelly<number>((pending) => !pending && runMethod())

    queuelly.add({
      name: 'add',
      action: () => run(numberLocalAPI.make({ delay: 100 }).add(1), 0)
    })

    queuelly.add({
      name: 'add',
      action: () => run(numberLocalAPI.make({ delay: 200, fails: true }).add(1), 1),
    })

    queuelly.add({
      name: 'update',
      depends: ['add'],
      action: () => run(numberLocalAPI.make().update(6), 2),
    })

    queuelly.add({
      name: 'update',
      depends: ['add'],
      action: () => run(numberLocalAPI.make().update(4), 3),
    })

    await waitMethod

    expect(numberLocalAPI.get()).toBe(4)

    expect(control(0).ranBefore(1)).toBe(true)

    expect(control(2).ran()).toBeUndefined()

    expect(control(3).ran()).not.toBeUndefined()
  })

  it("should replace an promise when canReplace is enabled", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    const { run, control } = runran()

    const { waitMethod, runMethod } = createWaitMethod()

    const queuelly = new Queuelly<number>((pending) => !pending && runMethod())

    queuelly.add({
      name: 'add',
      action: () => run(numberLocalAPI.make().add(1), 0)
    })

    queuelly.add({
      name: 'add',
      action: () => run(numberLocalAPI.make().add(1), 1),
    })

    queuelly.add({
      name: 'update',
      depends: ['add'],
      waitFor: ["update"],
      canReplace: true,
      action: () => run(numberLocalAPI.make().update(6), 2),
    })

    queuelly.add({
      name: 'update',
      depends: ['add'],
      waitFor: ["update"],
      canReplace: true,
      action: () => run(numberLocalAPI.make().update(3), 3),
    })

    await waitMethod

    expect(numberLocalAPI.get()).toBe(3)

    expect(control(0).ranBefore(1)).toBe(true)

    expect(control(2).ran()).toBeUndefined()

    expect(control(1).ranBefore(3)).toBe(true)
  })

  it("will execute all promises and assign to the optimistic update the last one completed", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    let optimisticValue = 0

    const { run, ranAllOfThese } = runran()

    const { waitMethod: completedQueuelly, runMethod } = createWaitMethod()

    const queuelly = new Queuelly<number>((pending) => !pending && runMethod())

    const createAddSpot = (value: number, opts: { key: number }) => {
      return queuelly.add({
        name: 'add',
        action: () => run(numberLocalAPI.make().add(value), opts.key),
        onComplete: (isLast, value) => {
          if (isLast) {
            optimisticValue = value
          }
        }
      })
    }

    const createUpdateSpot = (value: number, opts: { key: number }) => {
      return queuelly.add({
        name: 'update',
        depends: ['add'],
        waitFor: ["update"],
        canReplace: true,
        action: () => run(numberLocalAPI.make().update(value), opts.key),
        onComplete: (isLast, value) => {
          if (isLast) {
            optimisticValue = value
          }
        }
      })
    }

    createAddSpot(1, { key: 0 })

    createAddSpot(2, { key: 1 })

    createUpdateSpot(4, { key: 2 })

    createUpdateSpot(2, { key: 3 })

    createAddSpot(3, { key: 4 })

    createUpdateSpot(4, { key: 5 })

    await completedQueuelly

    expect(numberLocalAPI.get()).toBe(4)

    expect(optimisticValue).toBe(4)

    expect(ranAllOfThese([0, 1, 3, 4, 5])).toBe(true)
  })

  it("should update the optimistic when a spot fails", async () => {
    const numberLocalAPI = createNumberLocalAPI()

    let optimisticValue = 0

    const { run, control } = runran()

    const { waitMethod: completedQueuelly, runMethod } = createWaitMethod()

    const queuelly = new Queuelly<number>((pending) => !pending && runMethod())

    const createAddSpot = (value: number, opts: { key: number, fails?: boolean }) => {
      return queuelly.add({
        name: 'add',
        action: () => run(numberLocalAPI.make({ fails: opts.fails }).add(value), opts.key),
        onComplete: (isLast, value) => {
          if (isLast) {
            optimisticValue = value
          }
        },
        onError: (isLast, value) => {
          if (isLast && value) {
            optimisticValue = value
          } else {
            optimisticValue -= 1
          }
        }
      })
    }

    const createUpdateSpot = (value: number, opts: { key: number, fails?: boolean }) => {
      return queuelly.add({
        name: 'update',
        depends: ['add'],
        waitFor: ["update"],
        canReplace: true,
        action: () => run(numberLocalAPI.make({ fails: opts.fails }).update(value), opts.key),
        onComplete: (isLast, value) => {
          if (isLast) {
            optimisticValue = value
          }
        },
        onError: (isLast, value) => {
          if (isLast && value) {
            optimisticValue = value
          }
        }
      })
    }

    createAddSpot(1, { key: 0 })

    createAddSpot(2, { key: 1 })

    createUpdateSpot(2, { key: 3 })

    createAddSpot(3, { key: 4, fails: true })

    createAddSpot(2, { key: 4 })

    createUpdateSpot(4, { key: 3, fails: true })

    await completedQueuelly

    expect(numberLocalAPI.get()).toBe(4)

    expect(optimisticValue).toBe(4)
  })
})
