export { Queuelly } from "./queuelly"
export { QueuellyManager } from "./queuellyManager"

import { Queuelly } from "./queuelly"
/**
 * @deprecated Use `new Queuelly` instead
 */
export function createQueuelly<T>() {
  return new Queuelly<T>()
}
