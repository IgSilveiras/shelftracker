const app = document.querySelector("#app");

const STATUS_CONFIG = {
    planToPlay: {icon: "ti-bookmark",   label: "Plan to Play",  className: "planToPlay"},
    playing: {icon: "ti-player-play",   label: "Playing",       className: "playing"},
    completed: {icon: "ti-check",       label: "Completed",     className: "completed"},
    paused: {icon: "ti-player-pause",   label: "Paused",        className: "paused"},
    abandoned: {icon: "ti-x",           label: "Abandoned",     className: "abandoned"}
}

const INTENSITY_CONFIG = {
    tryhard: { icon: "ti-flame",    label:"Tryhard"},
    casual:  { icon: "ti-feather",  label:"Casual"}
}

const NO_INTENSITY_STATES = ["completed"];

const REVISIT_CHANCE_VALUES = ["none", "unlikely", "maybe", "likely", "definitely"];

const DETAIL_FIELDS = [
    { key: "name",              label: "Name",              type: "text", hideInReadMode: true },
    { key: "thumbnail",         label: "Thumbnail URL",     type: "url", hideInReadMode: true },
    { key: "release",           label: "Release Year",      type: "number", hideInReadMode: true },
    { key: "rating",            label: "Rating",            type: "number"},
    { key: "playTime",          label: "Playtime",          type: "number", suffix: "hs" },
    { key: "startDate",         label: "Start Date",        type: "date" },
    { key: "finishDate",        label: "Finish Date",       type: "date" },
    { key: "platform",          label: "Platform",          type: "text" },
    { key: "lastPlayed",        label: "Last Played",       type: "date" },
    { key: "difficulty",        label: "Difficulty",        type: "text" },
    { key: "revisitChance",     label: "Revisit Chance",    type: "select", options: REVISIT_CHANCE_VALUES },
    { key: "review",            label: "Review",            type: "textarea", fullWidth: true },
]

let gamesArray = [];
let currentFilter = "all";
let currentSort = "custom"
let currentSortOrder = "desc";
let view = "grid";
const detailedViewModal = document.querySelector("#detailedViewModal");
let editingMode = false;

if (localStorage.getItem("gamesArray") === null) {
    fetch("./mock.json")
    .then((response) => response.json())
    .then((data) => {
        gamesArray = data;
        gamesArray.forEach(g => g.id = crypto.randomUUID());
        renderGames(sortGames(getFilteredGames(), currentSort, currentSortOrder), view);
    })
}

else {
    gamesArray = JSON.parse(localStorage.getItem("gamesArray"));
    renderGames(sortGames(getFilteredGames(), currentSort, currentSortOrder), view);
}

function hasIntensity(playState) {
    return !NO_INTENSITY_STATES.includes(playState);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildStateBadge(playState, intensity, completed100) {
    const status = STATUS_CONFIG[playState];

    const modifier = 
        hasIntensity(playState) && intensity ? INTENSITY_CONFIG[intensity]
      : playState === "completed" && completed100 ? { icon: "ti-trophy", label: "100% Completed" }
      : null

    return `
        <span class="stateBadge ${status.className}">
            <i class="ti ${status.icon}" aria-hidden="true"></i> ${status.label}
        </span>
        ${modifier ? `<i class="ti ${modifier.icon} extraIcon" aria-hidden="true" title="${modifier.label}"></i>` : ""}
    `;
}

function renderGames(gamesArray, view) {
    app.innerHTML = "";
    let html

    if (view === "grid") {
        app.classList.remove("gamesList");
        app.classList.add("gamesGrid");
        for (const element of gamesArray) {
            const {id, thumbnail, name, playState, intensity, completed100, playTime, rating} = element;

            html = `
            <div class="gameCard" data-id="${id}">
                <div class="gameCardThumbnail">
                    <img src="${thumbnail}" alt="${name} thumbnail" max-width="400" max-height="700">
                    ${rating != 0 ? `<p class="gameRating">${rating}</p>` : ""}
                    ${playTime != 0 ? `<p class="gamePlaytime">${playTime}hs</p>` : ""}
                </div>
                <div class="gameCardInfo">
                    <p class="gameName" title="${name}">${name}</p>
                    <div class="gameState">
                        ${buildStateBadge(playState, intensity, completed100)}
                    </div>
                </div>
            </div>
            `

            app.innerHTML += html;
        }     
    }

    else {
        app.classList.remove("gamesGrid");
        app.classList.add("gamesList");
        for (const element of gamesArray) {
            const {id, thumbnail, name, release, playTime, intensity, completed100, review, startDate, finishDate, playState, rating} = element;
            
            html = `
            <div class="gameCard" data-id="${id}">
                <img src="${thumbnail}" alt="${name}" max-width="400" max-height="700" class="gameThumbnail">
                <p class="gameName">${name}</p>
                <p class="gameRelease">${release}</p>
                ${(startDate === "" || finishDate === "") || (startDate === undefined || finishDate === undefined) ? "" : `<p class="gameDates">${startDate} / ${finishDate}</p>`}
                <p class="gameReview">${review}</p>
                ${playTime != 0 ? `<p class="gamePlaytime">${playTime}hs</p>` : ""}
                <div class="gameState ${playState}"> 
                    ${rating != 0 ? `<p class="gameRating">${rating}</p>` : ""}
                    <div class="gameBadgeContainer">
                        ${buildStateBadge(playState, intensity, completed100)}
                    </div>
                </div>
            </div>
            `

            app.innerHTML += html;
        }
    }
}

const formModal = document.querySelector("#gameFormModal");
const formModalTitle = document.querySelector("#modalTitle");
const form = document.querySelector("#gameForm");
const addGameBtn = document.querySelector("#addGameBtn");


function closeModalAnimated(modalEl, onClosed) {
    modalEl.classList.add("closing");
    modalEl.addEventListener("animationend", () => {
        modalEl.classList.remove("closing");
        modalEl.close();
        if (onClosed) onClosed()
    }, { once: true });
}

function formModalCloseHandler() {
    closeModalAnimated(formModal);
}

addGameBtn.addEventListener("click", () => { formModal.showModal() });


const submitBtn = form.querySelector("button[type='submit']")

formModal.addEventListener("click", (e) => {
    if (e.target === formModal) closeModalAnimated(formModal);
})

formModal.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeModalAnimated(formModal);
})

detailedViewModal.addEventListener("click", (e) => {
    if (e.target === detailedViewModal) closeModalAnimated(detailedViewModal, () => {
        editingMode = false;
        currentDetailId = null;
    });
})

detailedViewModal.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeModalAnimated(detailedViewModal, () => {
        editingMode = false;
        currentDetailId = null;
    });
})

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const newGame = Object.fromEntries(formData);

    newGame.rating === "" ? newGame.rating = 0 : newGame.rating = Number(newGame.rating);
    newGame.release === "" ? newGame.release = 0 : newGame.release = Number(newGame.release);
    newGame.playTime === "" ? newGame.playTime = 0 : newGame.playTime = Number(newGame.playTime);
    if (newGame.intensity === "none") delete newGame.intensity;

    newGame.id = crypto.randomUUID()
    gamesArray.push(newGame);

    renderGames(sortGames(getFilteredGames(), currentSort, currentSortOrder), view);
    localStorage.setItem("gamesArray", JSON.stringify(gamesArray));
    submitBtn.textContent = "Add Game"
    form.reset();
    closeModalAnimated(formModal);
})

const formPlayState = form.querySelector("#formPlayState");
const formIntensity = document.querySelector("#formIntensity");
const formIntensityLabel = document.querySelector("#formIntensityLabel");

function updateIntensityView() {
    const value = formPlayState.value;
    const showIntensity = hasIntensity(value);
    const showCompleted100 = value === "completed";

    formIntensity.hidden = !showIntensity;
    formIntensityLabel.hidden = !showIntensity;

    formCompleted100Group.hidden = !showCompleted100;
    formCompleted100Group.querySelector("input").disabled = !showCompleted100;
}

formPlayState.addEventListener("change", updateIntensityView)

app.addEventListener("click", (e) => {
    const card = e.target.closest(".gameCard");
    if (!card) return;

    if (deleteMode) {
        deleteId = card.dataset.id;
        const deletedGame = gamesArray.findIndex(g => g.id === deleteId);
        gamesArray.splice(deletedGame, 1);
        renderGames(sortGames(getFilteredGames(), currentSort, currentSortOrder), view);
        deleteMode = false;
        btnTextHandler();
        localStorage.setItem("gamesArray", JSON.stringify(gamesArray));
        return;
    }

    fillDetailedViewModal(card.dataset.id);
    detailedViewModal.showModal();
})

const deleteBtn = document.querySelector("#deleteBtn");
let deleteMode = false;
let deleteId = null;

deleteBtn.addEventListener("click", () => {
    deleteMode = !deleteMode;
    btnTextHandler();
    app.classList.toggle("deleteMode", deleteMode);
})

function btnTextHandler() {
    deleteBtn.textContent = deleteMode ? "Finish Deleting" : "Delete Game";
}

const filterSelect = document.querySelector("#filterSelect");

filterSelect.addEventListener("change", () => {
    currentFilter = filterSelect.value;
    renderGames(sortGames(getFilteredGames(), currentSort, currentSortOrder), view);
})

function getFilteredGames() {
    if (currentFilter === "all") return gamesArray;
    return gamesArray.filter(g => g.playState == currentFilter);
}

const sortSelect = document.querySelector("#sortSelect");

sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;
    renderGames(sortGames(getFilteredGames(), currentSort, currentSortOrder), view);
})

function sortGames(games, sortBy, direction) {
    if (sortBy === "custom") {
        return direction === "asc" ? [...games].reverse() : games;
    }

    const sorted = [...games];

    sorted.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        
        if (sortBy === "name") {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();

            return direction === "desc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return direction === "asc" ? valA - valB : valB - valA;
    });

    return sorted;
}

const sortDirection = document.querySelector("#sortDirection");
sortDirection.addEventListener("click", () => {
    if (currentSortOrder === "desc") {
        currentSortOrder = "asc";
        sortDirection.innerHTML = '<i class="ti ti-arrow-narrow-down"></i>';
    }

    else {
        currentSortOrder = "desc";
        sortDirection.innerHTML = '<i class="ti ti-arrow-narrow-up"></i>';
    }

    renderGames(sortGames(getFilteredGames(), currentSort, currentSortOrder), view);
})

const viewSelect = document.querySelector("#viewSelect");
viewSelect.addEventListener("change", (e) => {
    view = e.target.value.toLowerCase();
    renderGames(sortGames(getFilteredGames(), currentSort, currentSortOrder), view);
})


const detailModalTitle = document.querySelector("#detailModalTitle");
const detailedViewModalInfo = document.querySelector("#detailedViewModalInfo");
const detailThumbnailImg = document.querySelector("#detailedViewModalThumbnail img");
const detailRelease = document.querySelector("#detailedViewModalRelease");
const detailBadge = document.querySelector("#detailedViewModalBadge");
const detailEditBtn = document.querySelector("#detailedViewModalEditBtn");
const detailDeleteBtn = document.querySelector("#detailedViewModalDeleteBtn");
let currentDetailId = null;


function toggleDetailMode() {
    const game = gamesArray.find(g => g.id === currentDetailId);
    if (!game) return;

    if (editingMode) {
        saveDetailFields(game);
        refreshDetailheader(game);
    }

    editingMode = !editingMode;
    detailedViewModalInfo.classList.toggle("editing");
    renderDetailFields(game, editingMode);
    updateDetailActionButtons();
}

function updateDetailActionButtons() {
    detailEditBtn.textContent = editingMode ? "Confirm" : "Edit";

    detailDeleteBtn.textContent = editingMode ? "Cancel" : "Delete";
    detailDeleteBtn.classList.toggle("btnNeutral", editingMode);
    detailDeleteBtn.classList.toggle("btnDanger", !editingMode);
}

function saveDetailFields(game) {
    document.querySelectorAll("#detailedViewModalInfo [data-field]").forEach(input => {
        const field = DETAIL_FIELDS.find(f => f.key === input.dataset.field);
        let value = input.value;
        if (field.type === "number") value = value === "" ? 0 : Number(value);
        game[field.key] = value;
    });

    localStorage.setItem("gamesArray", JSON.stringify(gamesArray));
    renderGames(sortGames(getFilteredGames(), currentSort, currentSortOrder), view);
}

detailEditBtn.addEventListener("click", toggleDetailMode);

detailDeleteBtn.addEventListener("click", () => {
    if (editingMode) {
        editingMode = false;
        const game = gamesArray.find(g => g.id === currentDetailId);
        renderDetailFields(game, false);
        updateDetailActionButtons();
        detailedViewModalInfo.classList.toggle("editing");
    }

    else {
        // TODO: modal de confirmacion de borrado
    }
})

function buildFieldInput(field, value) {
    if (field.type === "select") {
        const options = field.options
            .map(opt => `<option value="${opt}" ${value === opt ? "selected" : ""}>${capitalize(opt)}</option>`)
            .join("")
        return `<select data-field="${field.key}"><option value="">-</option>${options}</select>`;
    }

    if (field.type === "textarea") {
        return `<textarea data-field="${field.key}">${value}</textarea>`;
    }

    return `<input type="${field.type}" data-field="${field.key}" value="${value}">`;
}

function renderDetailFields(game, editing) {
    if (!editingMode) {
        detailedViewModalInfo.classList.remove("editing");
    }
    const fieldsToRender = DETAIL_FIELDS.filter(f => editing || !f.hideInReadMode);

    detailedViewModalInfo.innerHTML = fieldsToRender.map(field => {
        const rawValue = game[field.key] ?? "";
        const displayValue = field.type === "select" && rawValue
            ? capitalize(rawValue)
            : field.suffix && rawValue !== "" ? `${rawValue}${field.suffix}` : rawValue;

        return `
            <dt class="${field.fullWidth ? "fullWidth" : ""}">${field.label}</dt>
            <dd class="${field.fullWidth ? "fullWidth" : ""}">${editing ? buildFieldInput(field, rawValue) : (displayValue || "-")}</dd>
        `
    }).join("");
}

function refreshDetailheader(game) {
    detailModalTitle.textContent = game.name;
    detailThumbnailImg.src = game.thumbnail;
    detailThumbnailImg.alt = `${game.name} thumbnail`;
    detailRelease.textContent = game.release;
    detailBadge.innerHTML = buildStateBadge(game.playState, game.intensity, game.completed100);
}

function fillDetailedViewModal(id) {
    currentDetailId = id;
    editingMode = false;

    const game = gamesArray.find(g => g.id === id);
    if (!game) return;

    refreshDetailheader(game);
    renderDetailFields(game, false);
    updateDetailActionButtons();

}