import { loadGamesFromStorage, saveGamesToStorage } from "./storage.js";
import { renderGames, getFilteredGames, sortGames } from "./game-list.js";
import { initAddGameModal } from "./add-game-modal.js";
import { initDetailModal } from "./detail-modal.js";
import { initDeleteModal } from "./delete-modal.js";

let gamesArray = [];
let currentFilter = "all";
let currentSort = "custom";
let currentSortOrder = "desc";
let view = "grid";

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
filterSelect.addEventListener("change", () => {
    currentFilter = filterSelect.value;
    refresh();
});

const sortSelect = document.querySelector("#sortSelect");
sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;
    refresh();
});

const sortDirection = document.querySelector("#sortDirection");
sortDirection.addEventListener("click", () => {
    currentSortOrder = currentSortOrder === "desc" ? "asc" : "desc";
    sortDirection.innerHTML = currentSortOrder === "asc"
        ? '<i class="ti ti-arrow-narrow-down"></i>'
        : '<i class="ti ti-arrow-narrow-up"></i>';
    refresh();
});

const viewSelect = document.querySelector("#viewSelect");
viewSelect.addEventListener("change", (e) => {
    view = e.target.value.toLowerCase();
    refresh();
});