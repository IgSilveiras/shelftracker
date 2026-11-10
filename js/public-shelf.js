import { loadFirebase } from "./firebase.js";
import { createFirestoreStore } from "./firestore-store.js"

export async function resolvePublicShelf(handle) {
    const { db, sdk } = await loadFirebase();

    const handleSnap = await sdk.getDoc(sdk.doc(db, "usernames", handle.toLowerCase()));
    if (!handleSnap.exists()) return { status: "notFound" };

    const { uid } = handleSnap.data();
    const userSnap = await sdk.getDoc(sdk.doc(db, "users", uid));
    if (!userSnap.exists()) return { status: "notFound" };

    const { username, isPublic } = userSnap.data();
    if (!isPublic) return { status: "private", username };

    const full = createFirestoreStore({ db, uid, sdk });
    return { status: "ok", username, store: { loadGames: full.loadGames } };
}