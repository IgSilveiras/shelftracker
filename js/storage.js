import { STATUS_CONFIG } from "./config.js";

const STORAGE_KEY = "gamesArray";
const SETTINGS_KEY = "userSettings";
const PROFILE_KEY = "userProfile";
const DEFAULT_PROFILE = { username: "Nameless" };

const DEFAULT_SETTINGS = {
    filter: "all",
    favoritesOnly : false,
    sort: "custom",
    sortOrder: "desc",
    view: "grid",
};

const VALID_SETTINGS = {
    filter: ["all", ...Object.keys(STATUS_CONFIG)],
    sort: ["custom", "rating", "playTime", "name"],
    sortOrder: ["asc", "desc"],
    view: ["grid", "list"],
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
    if (!raw) return { ...DEFAULT_SETTINGS };

    let saved;
    try { saved = JSON.parse(raw); } catch { return { ...DEFAULT_SETTINGS }; }

    const settings = { ...DEFAULT_SETTINGS, ...saved };
    for (const [key, allowed] of Object.entries(VALID_SETTINGS)) {
        if (!allowed.includes(settings[key])) settings[key] = DEFAULT_SETTINGS[key];
    }
    settings.favoritesOnly = settings.favoritesOnly === true;
    return settings;
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