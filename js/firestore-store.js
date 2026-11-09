import { compareByOrder } from "./order.js";

const BATCH_LIMIT = 450;

export function createFirestoreStore({ db, uid, sdk }) {
    const { collection, doc, getDocs, setDoc, deleteDoc, writeBatch } = sdk;

    const gamesRef = () => collection(db, "users", uid, "games");
    const gameRef = (id) => doc(db, "users", uid, "games", id);

    async function commitInChunks(operations) {
        for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
            const batch = writeBatch(db);
            for (const apply of operations.slice(i, i + BATCH_LIMIT)) apply(batch);
            await batch.commit();
        }
    }

    return {
        async loadGames() {
            const snapshot = await getDocs(gamesRef());
            return snapshot.docs.map(d => d.data()).sort(compareByOrder);
        },

        async addGame(game) {
            await setDoc(gameRef(game.id), game);
        },

        async saveGame(game) {
            await setDoc(gameRef(game.id), game);
        },

        async deleteGame(id) {
            await deleteDoc(gameRef(id));
        },

        async updateOrders(changes) {
            await commitInChunks(
                changes.map(({ id, order }) => (batch) => batch.update(gameRef(id), { order }))
            );
        },

        async replaceAll(games) {
            const existing = await getDocs(gamesRef());
            const keep = new Set(games.map(g => g.id));

            await commitInChunks([
                ...games.map(g => (batch) => batch.set(gameRef(g.id), g)),
                ...existing.docs
                    .filter(d => !keep.has(d.id))
                    .map(d => (batch) => batch.delete(d.ref)),
            ]);
        },
    };
}