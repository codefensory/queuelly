import { useState } from "react"
import { BlueButton, RedButton } from "./Buttons"
import Input from "./Input"

import { Queuelly } from "@queuelly/core"
import useLocalServer from "../providers/useLocalServer"
import { useWaitForQueuelly } from "@queuelly/react"

const counterQueue = new Queuelly<number>()

const Counter = () => {
  const synchronizing = useWaitForQueuelly(counterQueue)

  // get local server instance
  const localServer = useLocalServer()

  // create counter status
  const [counter, setCounter] = useState(0)

  const handleCounterIncrement = (fails?: boolean) => {
    counterQueue.add({
      name: "increment",
      waitFor: ["update", "decrement"],
      action: () => localServer.increment(1, { fails }),
      onComplete: (value, { isLast }) => {
        if (isLast) {
          setCounter(value)
        }
      },
      onError: (_, { isLast, lastValue }) => {
        if (isLast && lastValue !== undefined) {
          setCounter(lastValue)
        } else {
          setCounter((prev) => prev - 1)
        }
      },
    })

    setCounter((prev) => prev + 1)
  }

  const handleCounterDecrement = (fails?: boolean) => {
    counterQueue.add({
      name: "decrement",
      waitFor: ["update", "increment"],
      action: () => localServer.decrement(1, { fails }),
      onComplete: (value, { isLast }) => {
        if (isLast) {
          setCounter(value)
        }
      },
      onError: (_, { isLast, lastValue }) => {
        if (isLast && lastValue !== undefined) {
          setCounter(lastValue)
        } else {
          setCounter((prev) => prev + 1)
        }
      },
    })

    setCounter((prev) => prev - 1)
  }

  const handleCounterUpdate = (value: string, fails?: boolean) => {
    const numberValue = value === "" ? 0 : Number(value)

    counterQueue.add({
      name: "update",
      waitFor: ["increment", "decrement", "update"],
      canReplace: true,
      action: () => localServer.update(numberValue, { fails }),
      onComplete: (value, { isLast }) => {
        if (isLast) {
          setCounter(value)
        }
      },
      onError: (_, { isLast, lastValue }) => {
        if (isLast) {
          setCounter(lastValue === undefined ? 0 : lastValue)
        }
      },
    })

    setCounter(numberValue)
  }

  return (
    <div className="flex space-x-4">
      <RedButton onClick={() => handleCounterDecrement(true)}>-</RedButton>
      <BlueButton onClick={() => handleCounterDecrement(false)}>-</BlueButton>
      <div className="relative w-48">
        <div className="flex space-x-4">
          <Input
            value={counter}
            type="number"
            onChange={(e) => handleCounterUpdate(e.target.value, true)}
          />
          <Input
            value={counter}
            type="number"
            onChange={(e) => handleCounterUpdate(e.target.value)}
          />
        </div>
        {synchronizing && (
          <span className="absolute w-full mt-2 text-center animate-background-shine bg-[linear-gradient(110deg,#939393,45%,#1e293b,55%,#939393)] bg-[length:250%_100%] bg-clip-text text-md text-transparent">
            Synchronizing
          </span>
        )}
      </div>
      <BlueButton onClick={() => handleCounterIncrement()}>+</BlueButton>
      <RedButton onClick={() => handleCounterIncrement(true)}>+</RedButton>
    </div>
  )
}

export default Counter
