export { Queuelly } from "./queuelly"

import { Queuelly } from "./queuelly"

/**
 * @deprecated Use `new Queuelly` instead
 */
export function createQueuelly<T>() {
  return new Queuelly<T>()
}
