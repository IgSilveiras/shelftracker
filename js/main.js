import { loadGamesFromStorage, saveGamesToStorage, loadSettings, saveSettings } from "./storage.js";
import { renderGames, getFilteredGames, sortGames } from "./game-list.js";
import { initAddGameModal } from "./add-game-modal.js";
import { initDetailModal } from "./detail-modal.js";
import { initDeleteModal } from "./delete-modal.js";

let gamesArray = [];
const settings = loadSettings();
let currentFilter = settings.filter;
let currentSort = settings.sort;
let currentSortOrder = settings.sortOrder;
let view = settings.view;

function persistSettings() {
    saveSettings({ filter: currentFilter, sort: currentSort, sortOrder: currentSortOrder, view });
}

function refresh() {
    renderGames(sortGames(getFilteredGames(gamesArray, currentFilter), currentSort, currentSortOrder), view);
}

function persistAndRefresh() {
    saveGamesToStorage(gamesArray);
    refresh();
}

function getGameById(id) {
    return gamesArray.find(g => g.id === id);
}

const stored = loadGamesFromStorage();

if (stored === null) {
    fetch("./mock.json")
        .then(response => response.json())
        .then(data => {
            gamesArray = data;
            gamesArray.forEach(g => g.id = crypto.randomUUID());
            refresh();
        });
} else {
    gamesArray = stored;
    refresh();
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

document.querySelector("#app").addEventListener("click", (e) => {
    const card = e.target.closest(".gameCard");
    if (!card) return;

    detailModal.open(card.dataset.id);
});

const filterSelect = document.querySelector("#filterSelect");
filterSelect.value = currentFilter;
filterSelect.addEventListener("change", () => {
    currentFilter = filterSelect.value;
    persistSettings();
    refresh();
});

const sortSelect = document.querySelector("#sortSelect");
sortSelect.value = currentSort;
sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;
    persistSettings();
    refresh();
});

const sortDirection = document.querySelector("#sortDirection");
sortDirection.innerHTML = currentSortOrder === "asc"
    ? '<i class="ti ti-arrow-narrow-down"></i>'
    : '<i class="ti ti-arrow-narrow-up"></i>';
sortDirection.addEventListener("click", () => {
    currentSortOrder = currentSortOrder === "desc" ? "asc" : "desc";
    sortDirection.innerHTML = currentSortOrder === "asc"
        ? '<i class="ti ti-arrow-narrow-down"></i>'
        : '<i class="ti ti-arrow-narrow-up"></i>';
    persistSettings();
    refresh();
});

const viewSelect = document.querySelector("#viewSelect");
document.querySelector(`input[name="view"][value="${view}"]`).checked = true;
viewSelect.addEventListener("change", (e) => {
    view = e.target.value.toLowerCase();
    persistSettings();
    refresh();
});