import shortid from "shortid"
import { QueuellyState } from "./utils";

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

  error() {
    this.state = QueuellyState.Error;
  }

  pending() {
    this.state = QueuellyState.Pending;
  }

  complete() {
    this.state = QueuellyState.Complete;
  }

  partialComplete() {
    this.state = QueuellyState.PartialComplete;
  }

  isPending() {
    return this.state === QueuellyState.Pending;
  }

  isFinally() {
    return !!(
      this.state &
      (QueuellyState.Complete | QueuellyState.Error)
    );
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

  containWaitFor(itemName: string | undefined) {
    if (!itemName) {
      return false;
    }

    return this.waitFor.indexOf(itemName) !== -1;
  }

  containDepends(itemName: string | undefined) {
    if (!itemName) {
      return false;
    }

    return this.depends.indexOf(itemName) !== -1;
  }

  promise() {
    this.state = QueuellyState.Pending;

    return this.action();
  }
}
