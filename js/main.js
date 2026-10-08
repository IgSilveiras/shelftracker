import { loadGamesFromStorage, saveGamesToStorage, loadSettings, saveSettings } from "./storage.js";
import { renderGames, getFilteredGames, sortGames } from "./game-list.js";
import { initAddGameModal } from "./add-game-modal.js";
import { initDetailModal } from "./detail-modal.js";
import { initDeleteModal } from "./delete-modal.js";
import { initCustomOrderDrag, initKeyboardReorder } from "./reorder.js";

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
    const showDragHandle = currentSort === "custom" && currentFilter === "all";
    renderGames(sortGames(getFilteredGames(gamesArray, currentFilter), currentSort, currentSortOrder), view, showDragHandle);
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
    const favoriteBtn = e.target.closest(".favoriteBtn");
    if (favoriteBtn) {
        const id = favoriteBtn.dataset.id;
        toggleFavorite(id);
        document.querySelector(`#app .favoriteBtn[data-id="${id}"]`)?.focus();
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