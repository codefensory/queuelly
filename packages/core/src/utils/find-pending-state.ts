export function findPendingState<V>(item: QueuellyItem<V> | undefined): boolean {
  if (!item) {
    return false;
  }

  if (item.isPending()) {
    return true;
  }

  if (item.isError() || item.isCanceled() || item.isPartialComplete()) {
    return findPendingState(item.prevItem);
  }

  return false;
}
