import { watchAuth, refreshVerification } from "./auth.js"
import { getProfile } from "./profile-service.js";

const HINT_KEY = "hasAccount";
const listeners = [];
let currentUser;
let currentProfile = null;
let starting = null;
let sessionError = false;

export const mightHaveSession = () => localStorage.getItem(HINT_KEY) === "1";
export const getSessionUser = () => currentUser;
export const getSessionProfile = () => currentProfile;
export const onSessionChange = (fn) => { listeners.push(fn) };
export const emitSession = () => listeners.forEach(fn => fn(currentUser));
export const hasSessionError = () => sessionError;

function failSession(err) {
    console.error("Session error:", err);
    sessionError = true;
    emitSession();
}

export function retrySession() {
    sessionError = false;
    emitSession();

    if (currentUser?.emailVerified) refreshProfile(currentUser).catch(failSession);
    else startSession();
}

export async function refreshProfile(user = currentUser) {
    if (!user.emailVerified) return null;

    const profile = await getProfile(user.uid);
    if (currentUser?.uid === user.uid) {
        currentProfile = profile;
        emitSession();
    }

    return profile;
}

export function startSession() {
    starting ??= watchAuth((user) => {
        currentUser = user;
        currentProfile = user?.emailVerified ? undefined : null;
        sessionError = false;

        if (user) localStorage.setItem(HINT_KEY, "1");
        else localStorage.removeItem(HINT_KEY);

        emitSession();

        if (user?.emailVerified) {
            refreshProfile(user).catch(failSession);
        }

        else if (user) {
            refreshVerification()
                .then((verified) => {
                    if (!verified || currentUser?.uid !== user.uid) return;
                    currentProfile = undefined;
                    emitSession();
                    return refreshProfile(user).catch(failSession);
                })
                .catch(() => {});
        }

    }).catch((err) => {
        starting = null;
        failSession(err);
    });

    return starting;
}

export function isSessionSettled() {
    return sessionError || (currentUser !== undefined && (!currentUser?.emailVerified || currentProfile !== undefined));
}

export function whenSessionSettled() {
    return new Promise((resolve) => {
        if (isSessionSettled()) return resolve();
        listeners.push(() => { if (isSessionSettled()) resolve(); });
    });
}