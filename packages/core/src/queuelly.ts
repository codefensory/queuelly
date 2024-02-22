import debug from "debug"

import { QueuellyItem, QueuellyOptions, createQueuellyItem } from "./queuellyItem"

const log = debug("queuelly")

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

  // index de la promesa que se esta procesando
  private index = 0

  // Lista todas promesas que se estan ejecuando
  private promisesRunning: Promise<any>[] = []

  // Lista de los index de todas las colas que se estan ejecutando
  private indexesPromisesRunning: number[] = []

  public addEventListener(eventName: "startProcess" | "endProcess", callback: () => void) {
    this.events.addEventListener(eventName, callback)
  }

  public removeEventListener(eventName: "startProcess" | "endProcess", callback: () => void) {
    this.events.removeEventListener(eventName, callback)
  }

  public add<R>(queuellyOptions: QueuellyOptions<V>): Promise<V | R | null | undefined> {
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
        // Podemos saltar una promesa si la que se esta agregando es igual que la anterior y la espera
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

      if (!this.isPending) {
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

      // Si el anterior fallo y la actual depende del anterior, tambien fallara este
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

      // Solo ejecutamos la promesa cuando el anterior no existe o ya se finalizo
      if ((!prevItem || prevItem.isPending() || prevItem.isFinally()) && !forceFail) {
        const pendingIndex = this.index

        currItem.pending()

        log("\x1b[38;5;178m%s\x1b[0m", "⇅ calling", currItem.name, currItem.id)

        this.indexesPromisesRunning.push(this.index)

        this.promisesRunning.push(
          new Promise(async (resolve) => {
            try {
              const result = await currItem.promise()

              // Es el ultimo cuando solo queda una promesa pendiente y ya no hay mas promesas por procesar
              const isLast = this.indexesPromisesRunning.length === 1 && this.promises[this.index] === undefined

              currPromise.resolve(result, { isLast })

              log("\x1b[32m%s\x1b[0m", "✔ Complete", currItem.name, currItem.id)

              this.lastItemComplete = currItem
            } catch (err) {
              // Es el ultimo cuando solo queda una promesa pendiente y ya no hay mas promesas por procesar
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

              // Si falla o se completa, completamos este item
              resolve(undefined)
            }
          }),
        )
      }

      this.index++
    }

    this.isPending = false
  }
}
