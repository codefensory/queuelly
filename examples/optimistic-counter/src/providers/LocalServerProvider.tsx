import { PropsWithChildren, createContext, useState } from "react"
import { MakeLocalAPI } from "@queuelly/utils"

interface LocalServer {
  serverValue: number
  increment: (amount: number, opt?: { fails?: boolean }) => Promise<number>
  update: (value: number, opt?: { fails?: boolean }) => Promise<number>
  decrement: (amount: number, opt?: { fails?: boolean }) => Promise<number>
}

export const LocalServerContext = createContext<LocalServer>({} as LocalServer)

const numberLocalAPI = new MakeLocalAPI(0, (_, set) => ({
  increment: (amount: number) => set((store) => store + amount),
  update: (value: number) => set(value),
  decrement: (amount: number) => set((store) => store - amount),
}))

const LocalServerProvider = (props: PropsWithChildren) => {
  const [value, setValue] = useState(0)

  const handleIncrement = (amount: number, opt?: { fails?: boolean }) =>
    numberLocalAPI
      .make({ fails: opt?.fails, delay: 1000 })
      .increment(amount)
      .then((response) => {
        setValue(numberLocalAPI.get())
        return response
      })

  const handleDecrement = (amount: number, opt?: { fails?: boolean }) =>
    numberLocalAPI
      .make({ fails: opt?.fails, delay: 1000 })
      .decrement(amount)
      .then((response) => {
        setValue(numberLocalAPI.get())
        return response
      })

  const handleUpdate = (amount: number, opt?: { fails?: boolean }) =>
    numberLocalAPI
      .make({ fails: opt?.fails, delay: 1000 })
      .update(amount)
      .then((response) => {
        setValue(numberLocalAPI.get())
        return response
      })

  return (
    <LocalServerContext.Provider
      value={{
        serverValue: value,
        increment: handleIncrement,
        decrement: handleDecrement,
        update: handleUpdate,
      }}
    >
      {props.children}
    </LocalServerContext.Provider>
  )
}

export default LocalServerProvider
