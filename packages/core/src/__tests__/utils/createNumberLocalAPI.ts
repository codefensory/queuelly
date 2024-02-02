import MakeLocalAPI from "./makeLocalAPI";

const createNumberLocalAPI = () => new MakeLocalAPI(0, (_, set) => ({
  add: (amount: number) => set(store => store + amount),
  update: (value: number) => set(value),
  decrement: (amount: number) => set(store => store - amount)
}))

export default createNumberLocalAPI
