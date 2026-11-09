const SDK_VERSION = "13.1.0";
export const CDN = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;

const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    appId: "...",
};

// testing
const useEmulator = ["localhost", "127.0.0.1"].includes(location.hostname) && new URLSearchParams(location.search).has("emulator");

let loading = null;

export function loadFirebase() {
    loading ??= (async () => {
        const [{ initializeApp }, sdk] = await Promise.all([
            import (`${CDN}/firebase-app.js`),
            import (`${CDN}/firebase-firestore.js`),
        ]);

        const config = useEmulator ? { ...firebaseConfig, projectId: "demo-shelftracker" } : firebaseConfig;
        const app = initializeApp(config);
        const db = sdk.getFirestore(app);
        if (useEmulator) sdk.connectFirestoreEmulator(db, "127.0.0.1", 8080);

        return { app, db, sdk };
    })().catch((err) => {
        loading = null;
        throw err;
    });

    return loading;
}

let authLoading = null;

export function loadAuth() {
    authLoading ??= (async () => {
        const [{ app }, sdk] = await Promise.all([
            loadFirebase(),
            import(`${CDN}/firebase-auth.js`),
        ]);

        const auth = sdk.getAuth(app);
        if (useEmulator) sdk.connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });

        return { auth, sdk };
    })().catch((err) => {
        authLoading = null;
        throw err;
    });

    return authLoading;
}