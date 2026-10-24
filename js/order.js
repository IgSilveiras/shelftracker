export const compareByOrder = (a, b) => (a.order - b.order) || a.id.localeCompare(b.id);

export function nextOrder(games) {
    return games.reduce((max, g) => Math.max(max, g.order), - 1) + 1;
}

export function moveGame(games, oldIndex, newIndex) {
    const lo = Math.min(oldIndex, newIndex);
    const hi = Math.max(oldIndex, newIndex); 
    const oldOrders = new Map(games.slice(lo, hi + 1).map(g => [g.id, g.order]));
    const slots = [...oldOrders.values()];

    const [moved] = games.splice(oldIndex, 1);
    games.splice(newIndex, 0, moved);

    const changes = [];
    games.slice(lo, hi + 1).forEach((game, i) => {
        if (game.order !== slots[i]) {
            game.order = slots[i];
            changes.push({ id: game.id, order: slots[i] });
        }
    });

    const previous = changes.map(({ id }) => ({ id, order: oldOrders.get(id) }));
    return { changes, previous };
}

export function applyOrders(games, changes) {
    const orders = new Map(changes.map(c => [c.id, c.order]));
    games.forEach(g => { if (orders.has(g.id)) g.order = orders.get(g.id); });
    games.sort(compareByOrder);
}