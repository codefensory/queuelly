// TODO: comment all
// TODO: implements logs

import debug from "debug";

import { QueuellyItem, QueuellyOptions, createQueuellyItem } from "./queuellyItem";

const log = debug("queuelly");

export interface PromiseItem<V> {
  item: QueuellyItem<V>;
  resolve(value: V | undefined, ctx: { isLast: boolean }): void;
  reject(reason: any, ctx: { isLast: boolean, lastValue: V | undefined }): void;
}

export class Queuelly<V> {
  private promises: PromiseItem<V>[] = [];

  public isPending = false;

  private lastItemComplete: QueuellyItem<V> | undefined

  public constructor(private listener?: (isPending: boolean) => void) { }

  public add<R>(
    queuellyOptions: QueuellyOptions<V>
  ): Promise<V | R | null | undefined> {
    const queuellyItem = createQueuellyItem(queuellyOptions)

    return new Promise(resolve => {
      const queuePromise: PromiseItem<V> = {
        item: queuellyItem,
        resolve: (value, ctx) => {
          queuellyItem.value = value

          queuellyItem.complete()

          if (value !== undefined) {
            queuellyItem.onComplete?.(value, ctx);
          }

          resolve(value);
        },
        reject: (reason, ctx) => {
          queuellyItem.error()

          queuellyItem.onError?.(reason, ctx);

          resolve(reason);
        },
      };

      this.promises.push(queuePromise)

      if (!this.isPending) {
        this.processQueue()
      }
    });
  }

  private async processQueue() {
    this.isPending = true

    this.notifyQueueStatus()

    let index = 0

    let promisesRunning: Promise<any>[] = []

    let indexesPromisesRunning: number[] = []

    while (index < this.promises.length) {
      const currPromise = this.promises[index]

      const { item: currItem } = currPromise

      const { item: prevItem } = this.promises[index - 1] ?? { item: this.lastItemComplete }

      const { item: nextItem } = this.promises[index + 1] ?? { item: undefined }

      const forceFail = prevItem?.isError() && currItem.depends(prevItem.name)

      if (forceFail) {
        currPromise.reject(null, { isLast: nextItem === undefined, lastValue: this.lastItemComplete?.value })
      }

      const replaced = currItem.canReplace &&
        nextItem?.waitFor(currItem.name) &&
        nextItem?.name === currItem.name

      if (replaced) {
        currPromise.resolve(undefined, { isLast: false })

        index++

        continue
      }

      if ((!prevItem || prevItem.isPending() || prevItem.isFinally()) && !forceFail && !replaced) {
        indexesPromisesRunning.push(index)

        promisesRunning.push(new Promise(async resolve => {
          try {
            const result = await currItem.promise()

            const onePromisePending = indexesPromisesRunning.filter(i => this.promises[i].item.isPending()).length === 1

            const isLast = onePromisePending && this.promises[index + 1] === undefined

            currPromise.resolve(result, { isLast })

            this.lastItemComplete = currItem
          } catch (err) {
            const onePromisePending = indexesPromisesRunning.filter(i => this.promises[i].item.isPending()).length === 1

            const isLast = onePromisePending && this.promises[index + 1] === undefined

            currPromise.reject(err, { isLast, lastValue: this.lastItemComplete?.value })
          } finally {
            resolve(undefined)
          }
        }))
      }

      if (promisesRunning.length > 0 &&
        (!nextItem || nextItem.waitFor(currItem.name) || nextItem.depends(currItem.name))) {
        await Promise.all(promisesRunning)

        promisesRunning = []

        indexesPromisesRunning = []
      }

      index++
    }

    this.promises = []

    this.isPending = false

    this.notifyQueueStatus()
  }

  private notifyQueueStatus() {
    this.listener?.(this.isPending);
  }
}
