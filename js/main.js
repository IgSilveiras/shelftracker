import { loadSettings, saveSettings, loadProfile, saveProfile, loadGamesFromStorage, saveGamesToStorage } from "./storage.js";
import { createLocalStore } from "./local-storage.js";
import { nextOrder, moveGame, applyOrders, compareByOrder } from "./order.js";
import { renderGames, getFilteredGames, sortGames } from "./game-list.js";
import { initAddGameModal } from "./add-game-modal.js";
import { initDetailModal } from "./detail-modal.js";
import { initDeleteModal } from "./delete-modal.js";
import { initCustomOrderDrag, initKeyboardReorder } from "./reorder.js";
import { downloadExport, sanitizeGame } from "./backup.js";
import { initImport } from "./import-modal.js";
import { initProfile } from "./profile.js";
import { mightHaveSession, startSession, retrySession, hasSessionError, onSessionChange, getSessionUser, getSessionProfile, isSessionSettled, whenSessionSettled } from "./session.js";
import { createFirestoreStore } from "./firestore-store.js";
import { loadFirebase } from "./firebase.js";
import { initAuthModal } from "./auth-modal.js";
import { getRoute } from "./route.js";
import { resolvePublicShelf } from "./public-shelf.js";
import { t, onLanguageChange } from "./translations.js";
import { showToast } from "./toast.js";

let gamesArray = [];
let store = createLocalStore();
let activeKey = null;
let loadToken = 0;
let status = "loading";
const settings = loadSettings();
const profile = loadProfile();
let currentFilter = settings.filter;
let favoritesOnly = settings.favoritesOnly;
let currentSort = settings.sort;
let currentSortOrder = settings.sortOrder;
let view = settings.view;
const route = getRoute();
const SESSION_WAIT_MS = 8000;
const readOnly = route.type === "public";
let displayMode = readOnly ? "public" : "local";
let publicUsername = null;

const profileUI = initProfile({
    getUsername: () => {
        if (displayMode === "public") return publicUsername ?? route.handle ?? "...";
        if (displayMode === "account") return getSessionProfile().username;
        if (displayMode === "pending") return "...";
        return profile.username;
    },

    canEdit: () => !readOnly && displayMode === "local",

    onRename(name) {
        profile.username = name;
        saveProfile(profile);
    },
});

function persistSettings() {
    saveSettings({ filter: currentFilter, favoritesOnly, sort: currentSort, sortOrder: currentSortOrder, view });
}

function getEmptyReason() {
    if (gamesArray.length === 0) return readOnly ? "libraryViewer" : "library";
    if (favoritesOnly && currentFilter === "all") return readOnly ? "noFavoritesViewer" : "noFavorites";
    return "filters";
}

function updateActionsAvailability() {
    const blocked = status !== "ready";
    for (const btn of [addGameBtn, importBtn, exportBtn]) btn.disabled = blocked;
}

function refresh() {
    updateActionsAvailability();

    if (status !== "ready") {
        renderGames([], view, false, status);
        dragController.setEnabled(false);
        return;
    }
    
    const visible = sortGames(getFilteredGames(gamesArray, currentFilter, favoritesOnly), currentSort, currentSortOrder);
    const showDragHandle = !readOnly && currentSort === "custom" && currentFilter === "all" && !favoritesOnly;
    renderGames(visible, view, showDragHandle, visible.length === 0 ? getEmptyReason() : null, readOnly);
    dragController.setEnabled(showDragHandle);
}

function moveGameInCustomOrder(domOldIndex, domNewIndex) {
    const reversed = currentSortOrder === "asc";
    const length = gamesArray.length;
    const oldIndex = reversed ? length - 1 - domOldIndex : domOldIndex;
    const newIndex = reversed ? length - 1 - domNewIndex : domNewIndex;

    const { changes, previous } = moveGame(gamesArray, oldIndex, newIndex);
    refresh();
    persist(store.updateOrders(changes), () => applyOrders(gamesArray, previous));
}

const appEl = document.querySelector("#app");

const dragController = initCustomOrderDrag({
    containerEl: appEl,
    onReorder: moveGameInCustomOrder,
});

initKeyboardReorder({
    containerEl: appEl,
    getView: () => view,
    onReorder: (domOldIndex, domNewIndex, grabbedId) => {
        moveGameInCustomOrder(domOldIndex, domNewIndex);
        requestAnimationFrame(() => {
            const card = document.querySelector(`.gameCard[data-id="${grabbedId}"]`);
            const handle = card?.querySelector(".dragHandle");
            
            card?.classList.add("cardGrabbed");
            handle?.setAttribute("aria-pressed", "true");
            handle?.focus();
        });
    },
})

function persist(operation, rollback) {
    const token = loadToken;
    operation.catch((err) => {
        console.error("Couldn't save changes:", err);
        if (token !== loadToken) return;
        rollback();
        refresh();
        showToast(t("toast.saveError"));
    })
}

function replaceGames(newGames) {
    const previous = gamesArray;
    gamesArray = newGames;
    refresh();
    persist(store.replaceAll(newGames), () => { gamesArray = previous; });
}

function getGameById(id) {
    return gamesArray.find(g => g.id === id);
}

function isOwnShelf() {
    const own = getSessionProfile()?.username;
    return !!own && own.toLowerCase() === route.handle?.toLowerCase();
}

async function startPublicView() {
    const token = ++loadToken;
    status = "loading";
    refresh();

    if (mightHaveSession()) {
        await Promise.race([
            whenSessionSettled(),
            new Promise((resolve) => setTimeout(resolve, SESSION_WAIT_MS)),
        ]);
        if (token !== loadToken) return;
    }

    try {
        const result = route.handle
            ? await resolvePublicShelf(route.handle, { asOwner: isOwnShelf() })
            : { status: "notFound" };
        if (token !== loadToken) return;

        if (result.username) {
            publicUsername = result.username;
            document.title = `${result.username} · ShelfTracker`;
            profileUI.render();
        }

        if (result.status !== "ok") {
            status = result.status;
            return;
        }

        store = result.store;
        gamesArray = await store.loadGames();
        if (token !== loadToken) return;
        status = "ready";
    }

    catch (err) {
        if (token !== loadToken) return;
        console.error("Couldn't load public shelf:", err);
        status = err?.code === "permission-denied" ? "private" : "error";
    }

    finally {
        if (token === loadToken) refresh();
    }
}

async function init() {
    const token = ++loadToken;
    status = "loading";
    refresh();

    try {
        const games = await store.loadGames();
        if (token !== loadToken) return;
        gamesArray = games;
        status = "ready";
    }

    catch (err) {
        if (token !== loadToken) return;
        console.error("Couln't load games:", err);
        status = "error";
    }

    refresh();
}

function currentMode() {
    if (hasSessionError()) return "error";

    const user = getSessionUser();
    if (user === undefined && mightHaveSession()) return "pending";

    if (user?.emailVerified) {
        const sessionProfile = getSessionProfile();
        if (sessionProfile === undefined) return "pending";
        if (sessionProfile) return "account";
    }

    return "local";
}

function applyMode() {
    const mode = currentMode();
    displayMode = mode;
    profileUI.render();
    renderAccountUI();

    if (mode === "pending" || mode === "error") {
        loadToken++;
        activeKey = null;
        status = mode === "pending" ? "loading" : "error";
        refresh();
        return;
    }

    const user = getSessionUser();
    const key = mode === "account" ? `account:${user.uid}` : "local";
    if (key === activeKey) return;
    activeKey = key;

    if (mode === "local") {
        store = createLocalStore();
        init();
        return;
    }

    status = "loading";
    refresh();

    loadFirebase()
        .then(({ db, sdk }) => {
            if (activeKey !== key) return;
            store = createFirestoreStore({ db, uid: user.uid, sdk });
            init();
        })

        .catch((err) => {
            console.error("Couldn't load Firebase:", err);
            if (activeKey !== key) return;
            activeKey = null;
            status = "error";
            refresh();
        });
}

async function loadDemoGames() {
    try {
        const response = await fetch("/mock.json");
        if (!response.ok) throw new Error(`mock.json: ${response.status}`);

        const demo = await response.json();
        demo.forEach((g, i) => { g.id = crypto.randomUUID(); g.order = i; });
        replaceGames(demo);
    }

    catch (err) {
        console.warn("Couldn't load demo games:", err);
    }
}

initAddGameModal({
    onGameAdded(newGame) {
        newGame.order = nextOrder(gamesArray);
        gamesArray.push(newGame);
        refresh();
        persist(store.addGame(newGame), () => {
            gamesArray = gamesArray.filter(g => g.id !== newGame.id);
        });
    },
});

const detailModal = initDetailModal({
    getGame: getGameById,
    isReadOnly: () => readOnly,
    onGameSaved(game, previous) {
        refresh();
        persist(store.saveGame(game), () => {
            gamesArray = gamesArray.map(g => g.id === previous.id ? previous : g);
        });
    },
    onDeleteRequested(id) {
        deleteModal.open(id);
    },
    onToggleFavorite: toggleFavorite,
});

const deleteModal = initDeleteModal({
    getGame: getGameById,
    onConfirmed(id) {
        const index = gamesArray.findIndex(g => g.id === id);
        if (index === -1) return;

        const [removed] = gamesArray.splice(index, 1);
        refresh();
        detailModal.close();
        persist(store.deleteGame(id), () => {
            gamesArray.push(removed);
            gamesArray.sort(compareByOrder);
        });
    },
});

function toggleFavorite(id) {
    const game = getGameById(id);
    if (!game) return;
    game.favorite = !game.favorite;
    refresh();
    persist(store.saveGame(game), () => { game.favorite = !game.favorite; });
}

appEl.addEventListener("click", (e) => {
    if (e.target.closest(".clearFiltersBtn")) {
        clearFilters();
        return;
    }

    if (e.target.closest(".retryBtn")) {
        if (readOnly) startPublicView();
        else if (hasSessionError()) retrySession();
        else { activeKey = null; applyMode(); }
        return;
    }

    const favoriteBtn = e.target.closest("button.favoriteBtn");
    if (favoriteBtn) {
        const id = favoriteBtn.dataset.id;
        toggleFavorite(id);
        document.querySelector(`#app .favoriteBtn[data-id="${id}"]`)?.focus();
        return;
    }

    const demoBtn = e.target.closest(".loadDemoBtn");
    if (demoBtn) {
        demoBtn.disabled = true;
        loadDemoGames().finally(() => { demoBtn.disabled = false; });
        return;
    }

    const card = e.target.closest(".gameCard");
    if (!card) return;

    detailModal.open(card.dataset.id);
});

appEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (e.target.closest(".dragHandle, .favoriteBtn")) return;

    const card = e.target.closest(".gameCard");
    if (!card) return;

    e.preventDefault();
    detailModal.open(card.dataset.id);
})

const filterSelect = document.querySelector("#filterSelect");
filterSelect.value = currentFilter;
filterSelect.addEventListener("change", () => {
    currentFilter = filterSelect.value;
    persistSettings();
    refresh();
});

const favoritesFilterBtn = document.querySelector("#favoritesFilterBtn");
favoritesFilterBtn.setAttribute("aria-pressed", favoritesOnly);
favoritesFilterBtn.addEventListener("click", () => {
    favoritesOnly = !favoritesOnly;
    favoritesFilterBtn.setAttribute("aria-pressed", favoritesOnly);
    persistSettings();
    refresh();
})

const sortSelect = document.querySelector("#sortSelect");
sortSelect.value = currentSort;
sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;
    persistSettings();
    refresh();
});

const sortIconHTML = () => `<i class="ti ti-arrow-narrow-${currentSortOrder === "asc" ? "down" : "up"}" aria-hidden="true"></i>`;

const sortDirection = document.querySelector("#sortDirection");
sortDirection.innerHTML = sortIconHTML(); 
sortDirection.addEventListener("click", () => {
    currentSortOrder = currentSortOrder === "desc" ? "asc" : "desc";
    sortDirection.innerHTML = sortIconHTML(); 
    persistSettings();
    refresh();
});

const viewSelect = document.querySelector("#viewSelect");
document.querySelector(`input[name="view"][value="${view}"]`).checked = true;
viewSelect.addEventListener("change", (e) => {
    view = e.target.value;
    persistSettings();
    refresh();
});

function clearFilters() {
    currentFilter = "all";
    favoritesOnly = false;
    filterSelect.value = "all";
    favoritesFilterBtn.setAttribute("aria-pressed", "false");
    persistSettings();
    refresh();
    filterSelect.focus();
}

document.querySelector("#exportBtn").addEventListener("click", () => 
    downloadExport({ username: displayMode === "account" ? getSessionProfile().username : profile.username }, gamesArray)
);

initImport({
    getGamesCount: () => gamesArray.length,
    onImport({ username, games }) {
        games.forEach((g, i) => { g.order = i; });
        if (username && displayMode === "local") {
            profile.username = username;
            saveProfile(profile);
            profileUI.render();
        }

        replaceGames(games);
    },
});

function getLocalCount() {
    try { return loadGamesFromStorage()?.length ?? 0; }
    catch { return 0; }
}

async function importLocalGames({ deleteLocal }) {
    const user = getSessionUser();
    const local = await createLocalStore().loadGames();
    const incoming = local.map(sanitizeGame).filter(Boolean);

    if (incoming.length) {
        const { db, sdk } = await loadFirebase();
        const remote = createFirestoreStore({ db, uid: user.uid, sdk });
        const existing = await remote.loadGames();
        const start = nextOrder(existing);
        incoming.forEach((g, i) => { g.order = start + i; });
        await remote.replaceAll([...existing, ...incoming]);
    }

    if (deleteLocal) saveGamesToStorage([]);

    if (!readOnly) {
        activeKey = null;
        applyMode();
    }
}

addGameBtn.hidden = readOnly;
document.querySelector(".backupActions").hidden = readOnly;

const authModal = initAuthModal({
    getLocalCount,
    onImportLocal: importLocalGames,
    onSetupDone: () => { if (readOnly) location.href = "/" + location.search },
});

const accountBtn = document.querySelector("#accountBtn");
const modeBadge = document.querySelector("#modeBadge");

function renderAccountUI() {
    const user = getSessionUser();
    const checking = displayMode === "pending" || (readOnly && mightHaveSession() && !isSessionSettled());

    accountBtn.textContent = checking ? "..." : (user ? (getSessionProfile()?.username ?? user.email) : t("auth.loginButton"));
    accountBtn.disabled = checking;

    modeBadge.hidden = displayMode !== "local";
    modeBadge.textContent = t("mode.local");
}

accountBtn.addEventListener("click", () => {
   if (readOnly && getSessionProfile()) location.href = "/" + location.search;
   else authModal.open(); 
});

onLanguageChange(renderAccountUI);

if (readOnly) {
    renderAccountUI();
    onSessionChange(() => {
        renderAccountUI();
        if (status === "private" && isOwnShelf()) startPublicView();
    });

    if (mightHaveSession()) startSession();
    startPublicView();
}

else {
    onSessionChange(applyMode);
    if (mightHaveSession()) startSession();
    applyMode();
}