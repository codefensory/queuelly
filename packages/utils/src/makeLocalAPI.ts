import wait from "./wait"

type Method = (...args: any[]) => any

type ObjectMethods = Record<string, Method>

type ToPromises<A extends ObjectMethods> = {
  [K in keyof A]: (...args: Parameters<A[K]>) => Promise<ReturnType<A[K]>>
}

type SetStore<S> = ((store: S) => S) | S

type MakeLocalAPIActions<S, A> = (get: () => S, set: (action: SetStore<S>) => S) => A

type RunOptions = {
  delay?: number
  fails?: boolean
}

class MakeLocalAPI<S, A extends ObjectMethods> {
  private store: S

  private actions: A

  constructor(initialStore: S, actions: MakeLocalAPIActions<S, A>) {
    this.store = initialStore
    this.actions = actions(this.get.bind(this), this.set.bind(this))
  }

  public get() {
    return this.store
  }

  public make(opts: RunOptions = { delay: 1 }) {
    return Object.keys(this.actions).reduce(
      (acc, key) => ({
        ...acc,
        [key]: this.generateAction(opts, this.actions[key]),
      }),
      {} as ToPromises<A>,
    )
  }

  private set(change: SetStore<any>): S {
    if (typeof change !== "function") {
      return (this.store = change)
    }

    return (this.store = change(this.store))
  }

  private generateAction<P extends Method>(
    opts: RunOptions,
    action: P,
  ): (...args: Parameters<P>) => Promise<ReturnType<P>> {
    return async (...args: Parameters<P>) => {
      await wait(opts.delay ?? 0)

      if (opts.fails) {
        throw new Error("Server Error")
      }

      return action(...args)
    }
  }
}

export default MakeLocalAPI
