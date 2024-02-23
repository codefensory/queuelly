enum QueuellyState {
  None,
  Pending,
  Complete,
  Error,
}

export interface QueuellyOptions<V> {
  name: string
  action: () => Promise<V>
  depends?: string[]
  waitFor?: string[]
  canReplace?: boolean
  onComplete?(value: V, ctx: { isLast: boolean }): void
  onError?(reason: any, ctx: { isLast: boolean; lastValue: V | undefined }): void
}

export interface QueuellyItem<V> extends Omit<QueuellyOptions<V>, "depends" | "waitFor"> {
  id: string
  value?: V | undefined
  depends: (name: string) => boolean
  waitFor: (name: string) => boolean
  pending: () => void
  isPending: () => boolean
  complete: () => void
  isComplete: () => boolean
  error: () => void
  isError: () => boolean
  isFinally: () => boolean
  isInitialized: () => boolean
  promise: () => Promise<V>
}

export function createQueuellyItem<V>(options: QueuellyOptions<V>): QueuellyItem<V> {
  let state: QueuellyState = QueuellyState.None

  return {
    ...options,
    // TODO: Optimize or delete this
    id: Math.random().toString(36).substring(2, 7),
    depends: (name) => !!options.depends?.includes(name),
    waitFor: (name) => !!options.waitFor?.includes(name),
    pending: () => (state = QueuellyState.Pending),
    isPending: () => state === QueuellyState.Pending,
    complete: () => (state = QueuellyState.Complete),
    isComplete: () => state === QueuellyState.Complete,
    isFinally: () => state === QueuellyState.Complete || state === QueuellyState.Error,
    error: () => (state = QueuellyState.Error),
    isError: () => state === QueuellyState.Error,
    isInitialized: () => state !== QueuellyState.None,
    promise: () => options.action(),
  }
}
