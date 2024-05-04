import * as Y from 'yjs'
import { createSignal } from 'solid-js'

/**
 * Produces a solidjs signal from a Y.Array that tracks updates.
 *
 * Note that this does not export the `setArray` part of this signal;
 * this is on purpose; the only way to update the signal should be
 * through modifying the original Y.Array.
 */
export function yArraySignal<T> (yArray: Y.Array<T>): (() => T[]) {
  const [array, setArray] = createSignal<T[]>(yArray.toArray())
  yArray.observe((_evt, _txn) => {
    setArray(yArray.toArray())
  })
  return array
}
