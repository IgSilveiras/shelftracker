import { loadGamesFromStorage, saveGamesToStorage } from "./storage.js"
import { applyOrders, compareByOrder } from "./order.js"

export function createLocalStore() {
    function read() {
        const games = loadGamesFromStorage() ?? [];

        if (games.some(g => typeof g.order !== "number")) {
            games.forEach((g, i) => { g.order = i; });
        }

        return games.sort(compareByOrder)
    }

    return {
        async loadGames() {
            return read();
        },

        async addGame(game) {
            const games = read();
            games.push(structuredClone(game));
            saveGamesToStorage(games);
        },

        async saveGame(game) {
            const games = read();
            const index = games.findIndex(g => g.id === game.id);
            if (index === -1) throw new Error(`Game not found: ${game.id}`);
            games[index] = structuredClone(game);
            saveGamesToStorage(games);
        },

        async deleteGame(id) {
            saveGamesToStorage(read().filter(g => g.id !== id));
        },

        async updateOrders(changes) {
            const games = read();
            applyOrders(games, changes);
            saveGamesToStorage(games);
        },

        async replaceAll(games) {
            saveGamesToStorage(games.map(g => structuredClone(g)));
        },
    };
}