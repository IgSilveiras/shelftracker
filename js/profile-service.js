import { loadFirebase } from "./firebase.js";

export const HANDLE_PATTERN = /^[A-Za-z0-9_-]{3,20}$/;

export async function getProfile(uid) {
    const { db, sdk } = await loadFirebase();
    const snap = await sdk.getDoc(sdk.doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
}

export async function isHandleAvailable(username) {
    const { db, sdk } = await loadFirebase();
    const snap = await sdk.getDoc(sdk.doc(db, "usernames", username.toLowerCase()));
    return !snap.exists();
}

export async function createProfile(uid, username) {
    const { db, sdk} = await loadFirebase();
    const batch = sdk.writeBatch(db);
    batch.set(sdk.doc(db, "users", uid), { username, isPublic: true });
    batch.set(sdk.doc(db, "usernames", username.toLowerCase()), { uid });
    await batch.commit();
}

export function profileErrorKey(err) {
    if (err?.code === "unavailable") return "auth.errorNetwork";
    return "profile.errorUnexpected";
}

export async function setProfilePublic(uid, isPublic) {
    const { db, sdk} = await loadFirebase();
    await sdk.updateDoc(sdk.doc(db, "users", uid), { isPublic });
}

export async function renameProfile(uid, oldUsername, newUsername) {
    const { db, sdk } = await loadFirebase();
    const userRef = sdk.doc(db, "users", uid);

    if (oldUsername.toLowerCase() === newUsername.toLowerCase()) {
        await sdk.updateDoc(userRef, { username: newUsername });
        return;
    }

    const batch = sdk.writeBatch(db);
    batch.delete(sdk.doc(db, "usernames", oldUsername.toLowerCase()));
    batch.set(sdk.doc(db, "usernames", newUsername.toLowerCase()), { uid });
    batch.update(userRef, { username: newUsername });
    await batch.commit();
}