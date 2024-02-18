// TODO: comment all
// TODO: implements logs

import debug from "debug";

import { QueuellyItem, QueuellyOptions } from "./queuellyItem";

const log = debug("queuelly");

type RejectReason<V> = {
  item: QueuellyItem<V>;
  err: Error;
};

export interface PromiseItem<V, R = any> {
  item: QueuellyItem<V, R>;
  resolve(isLast: boolean, value: R): void;
  reject(reason: any, isLast: boolean, value: R): void;
}

export class Queuelly<V> {
  private promises: PromiseItem<V>[] = [];

  public isPending = false;

  private lastComplete: PromiseItem<V> | undefined

  public constructor(private listener?: (isPending: boolean) => void) { }

  public add<R>(
    queuellyOptions: QueuellyOptions<V, R>
  ): Promise<V | R | null | undefined> {
    const queuellyItem = new QueuellyItem(queuellyOptions)

    return new Promise(resolve => {
      // TODO: use types
      const queuePromise: any = {
        item: queuellyItem,
        // TODO: use types
        resolve: (isLast: any, value: any) => {
          queuellyItem.value = value

          queuellyItem.complete()

          queuellyItem.onComplete?.(isLast, value);

          resolve(value);
        },
        // TODO: use types
        reject: (reason: any, isLast: any, value: any) => {
          queuellyItem.error()

          // TODO: Notify reason
          queuellyItem.onError?.(isLast, value);

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
      const currentPromise = this.promises[index]

      const prevPromise = this.promises[index - 1] ?? this.lastComplete

      const nextPromise = this.promises[index + 1]

      const forceFail = prevPromise?.item.isError() && currentPromise.item.containDepends(prevPromise.item.name)

      if (forceFail) {
        currentPromise.reject(null, nextPromise === undefined, this.lastComplete?.item.value)
      }

      const replaced = currentPromise.item.canReplace &&
        nextPromise?.item.containWaitFor(currentPromise.item.name) &&
        nextPromise?.item.name === currentPromise.item.name

      if (replaced) {
        currentPromise.resolve(false, this.lastComplete?.item.value)

        index++

        continue
      }

      if ((!prevPromise || prevPromise.item.isPending() || prevPromise.item.isFinally()) && !forceFail && !replaced) {
        indexesPromisesRunning.push(index)

        promisesRunning.push(new Promise(async resolve => {
          try {
            const result = await currentPromise.item.promise()

            const onePromisePending = indexesPromisesRunning.filter(i => this.promises[i].item.isPending()).length === 1

            const isLast = onePromisePending && this.promises[index + 1] === undefined

            currentPromise.resolve(isLast, result)

            this.lastComplete = currentPromise
          } catch (err) {
            const onePromisePending = indexesPromisesRunning.filter(i => this.promises[i].item.isPending()).length === 1

            const isLast = onePromisePending && this.promises[index + 1] === undefined

            currentPromise.reject(err, isLast, this.lastComplete?.item.value)
          } finally {
            resolve(undefined)
          }
        }))
      }

      if (promisesRunning.length > 0 &&
        (!nextPromise ||
          nextPromise.item.containWaitFor(currentPromise.item.name) ||
          nextPromise.item.containDepends(currentPromise.item.name))) {
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
