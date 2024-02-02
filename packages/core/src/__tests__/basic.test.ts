import { describe, expect, it } from "vitest";
import { Queuelly } from "../queuelly";
import createNumberLocalAPI from "./utils/createNumberLocalAPI";

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

    const queuelly = new Queuelly<number>()

    queuelly.add({
      name: 'update',
      action: () => numberLocalAPI.make().update(4)
    })

    await queuelly.add({
      name: 'add',
      waitFor: ['update'],
      action: () => numberLocalAPI.make().add(1),
    })

    expect(numberLocalAPI.get()).toBe(5)
  })
})
