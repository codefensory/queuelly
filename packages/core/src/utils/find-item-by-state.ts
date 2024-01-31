import { QueuellyState } from "./constants";

export function findItemByState<V>(
  item: QueuellyItem<V> | undefined,
  states: QueuellyState
): QueuellyItem<V> | undefined {
  if (!item) {
    return;
  }

  if (!(item.state & states)) {
    return item;
  }

  return findItemByState(item.prevItem, states);
}
