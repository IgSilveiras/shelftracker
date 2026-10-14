import { DETAIL_FIELDS } from "./config.js";

const APP_NAME = "ShelfTracker";
const SCHEMA_VERSION = 1;

export function downloadExport(profile, games) {
    const payload = {
        app: APP_NAME,
        schemaVersion: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        profile: { username: profile.username },
        games,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "appliaction/json" });
    const url = URL.createObjectURL(blob);
    const slug = profile.username.replace(/[^\w-]+/g, "_");

    const a = document.createElement("a");
    a.href = url;
    a.download = `shelftracker-${slug}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitizeGame(raw) {
    if (typeof raw !== "object" || raw === null) return null;

    const game = {};

    for (const field of DETAIL_FIELDS) {
        const value = raw[field.key];

        if (field.type === "number") {
            const n = Number(value);
            game[field.key] = Number.isFinite(n) ? n : 0;
            continue;
        }

        if (value === undefined || value === null) continue;

        if (field.type === "checkbox") {
            game[field.key] = value === true;
        }

        else if (field.type === "select") {
            const valid = field.options.map(o => (typeof o === "string" ? o : o.value));
            if (valid.includes(value)) game[field.key] = value;
        }

        else {
            game[field.key] = String(value);
        }
    }

    if (!game.name?.trim() || !game.playState) return null;

    if (raw.favorite === true) game.favorite = true;
    game.id = typeof raw.id === "string" && /^[\w-]{1,64}$/.test(raw.id) ? raw.id : crypto.randomUUID();

    return game;
}

export function parseImport(text) {
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        return { error: "This file is not valid JSON." };
    }

    if (data?.app !== APP_NAME || !Array.isArray(data.games)) {
        return { error: "This file doesn't look like a ShelfTracker export." };
    }

    if (data.schemaVersion > SCHEMA_VERSION) {
        return { error: "This file was exported from a newer version of ShelfTracker" };
    }

    const seen = new Set();
    const games = [];

    for (const raw of data.games) {
        const game = sanitizeGame(raw);
        if (!game) continue;
        if (seen.has(game.id)) game.id = crypto.randomUUID();
        seen.add(game.id);
        games.push(game);
    }

    if (games.length === 0) return { error: "The file doesn't contain any valid games." };

    return {
        username: String(data.profile?.username ?? "").trim().slice(0, 40),
        games,
        skipped: data.games.length - games.length,
    }
}