import { describe, expect, it } from "vitest";
import { Queuelly } from "../queuelly";

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
})
