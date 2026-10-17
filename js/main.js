import { loadGamesFromStorage, saveGamesToStorage, loadSettings, saveSettings, loadProfile, saveProfile } from "./storage.js";
import { renderGames, getFilteredGames, sortGames } from "./game-list.js";
import { initAddGameModal } from "./add-game-modal.js";
import { initDetailModal } from "./detail-modal.js";
import { initDeleteModal } from "./delete-modal.js";
import { initCustomOrderDrag, initKeyboardReorder } from "./reorder.js";
import { downloadExport } from "./backup.js";
import { initImport } from "./import-modal.js";
import { initProfile } from "./profile.js";

let gamesArray = [];
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

    const [moved] = gamesArray.splice(oldIndex, 1);
    gamesArray.splice(newIndex, 0, moved);
    persistAndRefresh();
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

function persistAndRefresh() {
    saveGamesToStorage(gamesArray);
    refresh();
}

function getGameById(id) {
    return gamesArray.find(g => g.id === id);
}

gamesArray = loadGamesFromStorage() ?? [];
refresh();

async function loadDemoGames() {
    try {
        const response = await fetch("./mock.json");
        if (!response.ok) throw new Error(`mock.json: ${response.status}`);

        const demo = await response.json();
        demo.forEach(g => g.id = crypto.randomUUID());
        gamesArray = demo;
        persistAndRefresh();
    }

    catch (err) {
        console.warn("Couldn't load demo games:", err);
    }
}

initAddGameModal({
    onGameAdded(newGame) {
        gamesArray.push(newGame);
        persistAndRefresh();
    },
});

const detailModal = initDetailModal({
    getGame: getGameById,
    onGameSaved() {
        persistAndRefresh();
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

        gamesArray.splice(index, 1);
        persistAndRefresh();
        detailModal.close();
    },
});

function toggleFavorite(id) {
    const game = getGameById(id);
    if (!game) return;
    game.favorite = !game.favorite;
    persistAndRefresh();
}

appEl.addEventListener("click", (e) => {
    if (e.target.closest(".clearFiltersBtn")) {
        clearFilters();
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
        gamesArray = games;
        if (username) {
            profile.username = username;
            saveProfile(profile);
            profileUI.render();
        }

        persistAndRefresh();
    },
});