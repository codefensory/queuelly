import debug from "debug"

import { QueuellyItem, QueuellyOptions, createQueuellyItem } from "./queuellyItem"

const log = debug("queuelly")

interface QueuellyParams {
  runManual?: boolean
}

interface PromiseItem<V> {
  item: QueuellyItem<V>
  resolve(value: V | undefined, ctx: { isLast: boolean }): void
  reject(reason: any, ctx: { isLast: boolean; lastValue: V | undefined }): void
}

export class Queuelly<V> {
  private promises: PromiseItem<V>[] = []

  public isPending = false

  private lastItemComplete: QueuellyItem<V> | undefined

  private events = new EventTarget()

  // index of the promise that is being processed
  private index = 0

  // list of all promises that are being executed
  private promisesRunning: Promise<any>[] = []

  // list of the indexes of all the queues that are running
  private indexesPromisesRunning: number[] = []

  private runManual: boolean

  private currentRun: Promise<void> | null = null

  public constructor(options?: QueuellyParams) {
    this.runManual = !!options?.runManual
  }

  public addEventListener(eventName: "startProcess" | "endProcess", callback: () => void) {
    this.events.addEventListener(eventName, callback)
  }

  public removeEventListener(eventName: "startProcess" | "endProcess", callback: () => void) {
    this.events.removeEventListener(eventName, callback)
  }

  public add(queuellyOptions: QueuellyOptions<V>): Promise<V | null | undefined> {
    const queuellyItem = createQueuellyItem(queuellyOptions)

    return new Promise((resolve) => {
      const queuePromise: PromiseItem<V> = {
        item: queuellyItem,
        resolve: (value, ctx) => {
          queuellyItem.value = value

          queuellyItem.complete()

          if (value !== undefined) {
            queuellyItem.onComplete?.(value, ctx)
          }

          resolve(value)
        },
        reject: (reason, ctx) => {
          queuellyItem.error()

          queuellyItem.onError?.(reason, ctx)

          resolve(reason)
        },
      }

      log(`➤ enqueue ${queuellyItem.name} ${queuellyItem.id}`)

      const lastPromise = this.promises[this.promises.length - 1]

      if (lastPromise) {
        // we can skip a promise if the one being added is the same as the previous one and waits
        const replaced =
          lastPromise.item.canReplace &&
          queuellyItem.waitFor(lastPromise.item.name) &&
          queuellyItem.name === lastPromise.item.name &&
          !lastPromise.item.isInitialized()

        if (replaced) {
          lastPromise.resolve(undefined, { isLast: false })

          this.promises.pop()

          log(`➤ skip ${lastPromise.item.name} ${lastPromise.item.id}`)
        }
      }

      this.promises.push(queuePromise)

      if (!this.isPending && !this.runManual) {
        this.processQueue()
      }
    })
  }

  private async processQueue() {
    this.isPending = true

    this.events.dispatchEvent(new Event("startProcess"))

    while (this.index < this.promises.length) {
      const tempPrevName = this.promises[this.index - 1]?.item.name

      const tempCurrItem = this.promises[this.index].item

      if (
        this.promisesRunning.length > 0 &&
        (tempCurrItem.depends(tempPrevName) || tempCurrItem.waitFor(tempPrevName))
      ) {
        await Promise.all(this.promisesRunning)
      }

      const currPromise = this.promises[this.index]

      const { item: currItem } = currPromise

      const { item: prevItem } = this.promises[this.index - 1] ?? {
        item: this.lastItemComplete,
      }

      const { item: nextItem } = this.promises[this.index + 1] ?? {
        item: undefined,
      }

      // if the previous failure and the current one depends on the previous one, this one will also fail
      const forceFail = prevItem?.isError() && currItem.depends(prevItem.name)

      if (forceFail) {
        currPromise.reject(new Error("Promise canceled"), {
          isLast: nextItem === undefined,
          lastValue: this.lastItemComplete?.value,
        })

        log("\x1b[31m%s\x1b[0m", "✖ Canceled", currItem.name, currItem.id)

        if (this.promises[this.promises.length - 1].item.isFinally() && this.promisesRunning.length === 0) {
          this.events.dispatchEvent(new Event("endProcess"))

          this.promises = []

          this.index = 0
        }
      }

      // we only execute the promise when the previous one does not exist or has already been completed
      if ((!prevItem || prevItem.isPending() || prevItem.isFinally()) && !forceFail) {
        const pendingIndex = this.index

        currItem.pending()

        log("\x1b[38;5;178m%s\x1b[0m", "⇅ calling", currItem.name, currItem.id)

        this.indexesPromisesRunning.push(this.index)

        this.promisesRunning.push(
          new Promise(async (resolve) => {
            try {
              const result = await currItem.promise()

              // it is the last one when there is only one pending promise and there are no more promises to process
              const isLast = this.indexesPromisesRunning.length === 1 && this.promises[this.index] === undefined

              currPromise.resolve(result, { isLast })

              log("\x1b[32m%s\x1b[0m", "✔ Complete", currItem.name, currItem.id)

              this.lastItemComplete = currItem
            } catch (err) {
              // it is the last one when there is only one pending promise and there are no more promises to process
              const isLast = this.indexesPromisesRunning.length === 1 && this.promises[this.index] === undefined

              currPromise.reject(err, {
                isLast,
                lastValue: this.lastItemComplete?.value,
              })

              log("\x1b[31m%s\x1b[0m", "✖ Error", currItem.name, currItem.id)
            } finally {
              const indexToRemove = this.indexesPromisesRunning.indexOf(pendingIndex)

              if (indexToRemove !== -1) {
                this.indexesPromisesRunning.splice(indexToRemove, 1)

                this.promisesRunning.splice(indexToRemove, 1)
              }

              if (this.promises[this.promises.length - 1].item.isFinally() && this.promisesRunning.length === 0) {
                this.events.dispatchEvent(new Event("endProcess"))

                this.promises = []

                this.index = 0
              }

              // if it fails or completes, we complete this item
              resolve(undefined)
            }
          }),
        )
      }

      this.index++
    }

    this.isPending = false
  }

  public async run() {
    if (!this.isPending) {
      await this.processQueue()
    }

    await Promise.all(this.promisesRunning)
  }
}
