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
})
