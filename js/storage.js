const STORAGE_KEY = "gamesArray";
const SETTINGS_KEY = "userSettings";
const PROFILE_KEY = "userProfile";
const DEFAULT_PROFILE = { username: "Nanashi" };

const DEFAULT_SETTINGS = {
    filter: "all",
    favoritesOnly : false,
    sort: "custom",
    sortOrder: "desc",
    view: "grid",
};

export function loadGamesFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function saveGamesToStorage(games) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function loadSettings() {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...SETTINGS_KEY, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadProfile() {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : { ...DEFAULT_PROFILE };
}

export function saveProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}