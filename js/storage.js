const STORAGE_KEY = "gamesArray";

export function loadGamesFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function saveGamesToStorage(games) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}