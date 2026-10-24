import { loadSettings, saveSettings, loadProfile, saveProfile } from "./storage.js";
import { createLocalStore } from "./local-storage.js";
import { nextOrder, moveGame, applyOrders, compareByOrder } from "./order.js";
import { renderGames, getFilteredGames, sortGames } from "./game-list.js";
import { initAddGameModal } from "./add-game-modal.js";
import { initDetailModal } from "./detail-modal.js";
import { initDeleteModal } from "./delete-modal.js";
import { initCustomOrderDrag, initKeyboardReorder } from "./reorder.js";
import { downloadExport } from "./backup.js";
import { initImport } from "./import-modal.js";
import { initProfile } from "./profile.js";

let gamesArray = [];
const store = createLocalStore();
let status = "loading";
const settings = loadSettings();
const profile = loadProfile();
let currentFilter = settings.filter;
let favoritesOnly = settings.favoritesOnly;
let currentSort = settings.sort;
let currentSortOrder = settings.sortOrder;
let view = settings.view;

const profileUI = initProfile({
    getUsername: () => profile.username,
    onRename(name) {
        profile.username = name;
        saveProfile(profile);
    },
});

function persistSettings() {
    saveSettings({ filter: currentFilter, favoritesOnly, sort: currentSort, sortOrder: currentSortOrder, view });
}

function getEmptyReason() {
    if (gamesArray.length === 0) return "library";
    if (favoritesOnly && currentFilter === "all") return "noFavorites";
    return "filters";
}

function refresh() {
    if (status !== "ready") {
        renderGames([], view, false, status);
        dragController.setEnabled(false);
        return;
    }
    
    const visible = sortGames(getFilteredGames(gamesArray, currentFilter, favoritesOnly), currentSort, currentSortOrder);
    const showDragHandle = currentSort === "custom" && currentFilter === "all" && !favoritesOnly;
    renderGames(visible, view, showDragHandle, visible.length === 0 ? getEmptyReason() : null);
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
    operation.catch((err) => {
        console.error("Couldn't save changes:", err);
        rollback();
        refresh();
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

async function init() {
    status = "loading";
    refresh();

    try {
        gamesArray = await store.loadGames();
        status = "ready";
    }

    catch (err) {
        console.error("Couln't load games:", err);
        status = "error";
    }

    refresh();
}

init();

async function loadDemoGames() {
    try {
        const response = await fetch("./mock.json");
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
        init();
        return;
    }

    const favoriteBtn = e.target.closest(".favoriteBtn");
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

document.querySelector("#exportBtn").addEventListener("click", () => downloadExport(profile, gamesArray));

initImport({
    getGamesCount: () => gamesArray.length,
    onImport({ username, games }) {
        games.forEach((g, i) => { g.order = i; });
        if (username) {
            profile.username = username;
            saveProfile(profile);
            profileUI.render();
        }

        replaceGames(games);
    },
});