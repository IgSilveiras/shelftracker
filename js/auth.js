import { loadAuth } from "./firebase.js";

const ERROR_KEYS = {
    "auth/invalid-credential": "auth.errorInvalidCredential",
    "auth/wrong-password": "auth.errorInvalidCredential",
    "auth/user-not-found": "auth.errorInvalidCredential",
    "auth/invalid-email": "auth.errorInvalidEmail",
    "auth/email-already-in-use": "auth.errorEmailInUse",
    "auth/weak-password": "auth.errorWeakPassword",
    "auth/too-many-requests": "auth.errorTooManyRequests",
    "auth/network-request-failed": "auth.errorNetwork",
    "auth/user-disabled": "auth.errorDisabled",
};

export const authErrorKey = (err) => ERROR_KEYS[err?.code] ?? "auth.errorUnexpected";

const currentLanguage = () => localStorage.getItem("language") || "en";

export async function watchAuth(onChange) {
    const { auth, sdk } = await loadAuth();
    return sdk.onAuthStateChanged(auth, onChange);
}

export async function register(email, password) {
    const { auth, sdk } = await loadAuth();
    auth.languageCode = currentLanguage();

    const { user } = await sdk.createUserWithEmailAndPassword(auth, email, password);

    let verificationSent = true;
    try { await sdk.sendEmailVerification(user); } catch { verificationSent = false; }

    return { user, verificationSent };
}

export async function login(email, password) {
    const { auth, sdk } = await loadAuth();
    const { user } = await sdk.signInWithEmailAndPassword(auth, email, password);
    return user;
}

export async function logout() {
    const { auth, sdk } = await loadAuth();
    await sdk.signOut(auth);
}

export async function sendPasswordReset(email) {
    const { auth, sdk } = await loadAuth();
    auth.languageCode = currentLanguage();

    try { await sdk.sendPasswordResetEmail(auth, email); }
    catch (err) { if (err.code !== "auth/user-not-found") throw err; }
}

export async function resendVerification() {
    const { auth, sdk } = await loadAuth();
    auth.languageCode = currentLanguage();
    if (auth.currentUser) await sdk.sendEmailVerification(auth.currentUser);
}

export async function refreshVerification() {
    const { auth } = await loadAuth();
    const user = auth.currentUser;
    if (!user) return false;

    await user.reload();
    await user.getIdToken(true);
    return user.emailVerified;
}