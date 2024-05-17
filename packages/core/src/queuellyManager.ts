import { Queuelly } from "./queuelly"

export class QueuellyManager<T> {
  private queuellies: Record<string, Queuelly<T>> = {}

  public isPending = false

  private groupsPending: Record<string, boolean> = {}

  private events = new EventTarget()

  public add(key: string, opts: Parameters<Queuelly<T>["add"]>[0]) {
    let queue = this.queuellies[key]

    if (!queue) {
      queue = this.queuellies[key] = new Queuelly<T>()

      queue.addEventListener("startProcess", () => this.changeQueueState(key, true))

      queue.addEventListener("endProcess", () => this.changeQueueState(key, false))
    }

    return queue.add(opts)
  }

  public addEventListener(event: "startProcess" | "endProcess", cb: () => void) {
    this.events.addEventListener(event, cb)
  }

  public removeEventListener(event: "startProcess" | "endProcess", cb: () => void) {
    this.events.removeEventListener(event, cb)
  }

  private changeQueueState(key: string, isPending: boolean) {
    if (isPending) {
      this.groupsPending[key] = true

      if (!this.isPending) {
        this.isPending = true

        this.events.dispatchEvent(new Event("startProcess"))
      }
    } else if (this.groupsPending[key] !== undefined) {
      delete this.groupsPending[key]

      if (Object.keys(this.groupsPending).length === 0 && this.isPending) {
        this.isPending = false

        this.events.dispatchEvent(new Event("endProcess"))
      }
    }
  }
}
