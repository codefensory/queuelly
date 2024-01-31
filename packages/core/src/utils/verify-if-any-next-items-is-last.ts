export function verifyIfAnyNextItemsIsLast<V>(
  item: QueuellyItem<V> | undefined,
  lastId: QueuellyItem<V>["id"] | undefined
): boolean {
  if (!item) {
    return false;
  }

  if (item.id === lastId) {
    return true;
  }

  return verifyIfAnyNextItemsIsLast(item.nextItem, lastId);
}
