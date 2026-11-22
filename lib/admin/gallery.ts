// Pure ordering helpers for the event gallery. `sortOrder` is a dense 0..n
// index; the first image is the public cover. Indexes come from the form and
// are untrusted, so out-of-range moves return the original order.

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return [...items];
  }

  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);

  return next;
}

/** Moves one image to the front, which makes it the public cover. */
export function moveToFront<T>(items: readonly T[], index: number): T[] {
  return moveItem(items, index, 0);
}
