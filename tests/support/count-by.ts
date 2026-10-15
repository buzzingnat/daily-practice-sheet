// How many times each item turns up. Order of first appearance is kept.
export function countBy<Item>(items: readonly Item[]): Map<Item, number> {
    const counts = new Map<Item, number>();
    items.forEach((item) => {
        counts.set(item, (counts.get(item) || 0) + 1);
    });
    return counts;
}
