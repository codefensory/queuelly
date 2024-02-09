import shortid from "shortid"
import { QueuellyState, findItemByState, findPendingState } from "./utils";

export interface QueuellyOptions<V, R> {
  name: string;
  action: () => Promise<R>;
  depends?: string[];
  waitFor?: string[];
  canReplace?: boolean;
  onComplete?(isLast: boolean, value: R, lastValueCompleted?: V | R): void;
  onError?(isLast: boolean, value: V | undefined): void;
}

export class QueuellyItem<V, R = any> {
  public id: string;
  public name: string;
  public action: () => Promise<R>;
  public state: QueuellyState;
  public depends: string[];
  public waitFor: string[];
  public canReplace: boolean;

  public value: V | R | undefined;

  public prevItem: QueuellyItem<V> | undefined;
  public nextItem: QueuellyItem<V> | undefined;

  public onComplete:
    | ((isLast: boolean, value: R, lastValueCompleted?: V | R) => void)
    | undefined;
  public onError: ((isLast: boolean, value: V | undefined) => void) | undefined;

  constructor(options: QueuellyOptions<V, R>) {
    this.id = shortid.generate();
    this.name = options.name;
    this.action = options.action;
    this.state = QueuellyState.None;
    this.depends = options.depends ?? [];
    this.waitFor = options.waitFor ?? this.depends;
    this.canReplace = !!options.canReplace;
    this.onComplete = options.onComplete;
    this.onError = options.onError;
  }

  block() {
    this.state = QueuellyState.Block;
  }

  error(validPartial?: boolean) {
    this.state = QueuellyState.Error;

    if (validPartial) {
      this.nextPartialToComplete(this.nextItem);
    }
  }

  pending() {
    this.state = QueuellyState.Pending;
  }

  complete(validPartial?: boolean) {
    this.state = QueuellyState.Complete;

    if (validPartial) {
      this.nextPartialToComplete(this.nextItem);
    }
  }

  partialComplete() {
    this.state = QueuellyState.PartialComplete;
  }

  cancel() {
    this.state = QueuellyState.Canceled;
  }

  isPending() {
    return this.state === QueuellyState.Pending;
  }

  isFinally() {
    return !!(
      this.state &
      (QueuellyState.Complete | QueuellyState.Canceled | QueuellyState.Error)
    );
  }

  isBlock() {
    return this.state === QueuellyState.Block;
  }

  isComplete() {
    return this.state === QueuellyState.Complete;
  }

  isPartialComplete() {
    return this.state === QueuellyState.PartialComplete;
  }

  isError() {
    return this.state === QueuellyState.Error;
  }

  isCanceled() {
    return this.state === QueuellyState.Canceled;
  }

  setPrevItem(item: QueuellyItem<V> | undefined) {
    this.prevItem = item;
  }

  canReplaceItem(item: QueuellyItem<V> | undefined) {
    if (item?.canReplace && item?.isBlock() && item.name === this.name) {
      return true;
    }

    return false;
  }

  containWaitForByName(itemName: string | undefined) {
    if (!itemName) {
      return false;
    }

    return this.waitFor.indexOf(itemName) !== -1;
  }

  containDependsByName(itemName: string | undefined) {
    if (!itemName) {
      return false;
    }

    return this.depends.indexOf(itemName) !== -1;
  }

  promise() {
    this.state = QueuellyState.Pending;

    return this.action();
  }

  getCompletedValue() {
    return findItemByState(this.prevItem, QueuellyState.Complete)?.value;
  }

  allIsFinally() {
    return !findItemByState(
      this.prevItem,
      QueuellyState.Block | QueuellyState.Pending | QueuellyState.None
    );
  }

  isWaitingForPendingState() {
    if (
      !this.containWaitForByName(this.prevItem?.name) &&
      !this.containDependsByName(this.prevItem?.name)
    ) {
      return false;
    }

    return findPendingState(this.prevItem);
  }

  isDependencyError() {
    if (!this.containDependsByName(this.prevItem?.name)) {
      return false;
    }

    return !!(this.prevItem?.isError() || this.prevItem?.isCanceled());
  }

  private nextPartialToComplete(item: QueuellyItem<V> | undefined) {
    if (!item) {
      return;
    }

    if (item.isPartialComplete()) {
      item.complete(true);

      return;
    }

    if (item.isError()) {
      this.nextPartialToComplete(item.nextItem);

      return;
    }
  }
}
