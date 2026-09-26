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

let gamesArray = [];
let currentFilter = "all";
let currentSort = "custom"
let currentSortOrder = "desc";
let view = "grid";
let editMode = false;
let editingId = null;

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
                    ${rating != "" ? `<p class="gameRating">${rating}</p>` : ""}
                    ${playTime != "" ? `<p class="gamePlaytime">${playTime}hs</p>` : ""}
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
                ${playTime != "" ? `<p class="gamePlaytime">${playTime}hs</p>` : ""}
                <div class="gameState ${playState}"> 
                    ${rating != "" ? `<p class="gameRating">${rating}</p>` : ""}
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

const modal = document.querySelector("#gameFormModal");
const addGameBtn = document.querySelector("#addGameBtn");
const modalTitle = document.querySelector("#modalTitle");

function modalOpenHandler() {
    modalTitle.textContent = editingId ? "Edit Game" : "Add Game";
    modal.showModal();
}

addGameBtn.addEventListener("click", modalOpenHandler);


const form = document.querySelector("#gameForm");
const submitBtn = form.querySelector("button[type='submit']")

modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
})

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const newGame = Object.fromEntries(formData);

    newGame.rating === "" ? newGame.rating = 0 : Number(newGame.rating);
    newGame.release === "" ? newGame.release = 0 : Number(newGame.release);
    newGame.playtime === "" ? newGame.playTime = 0 : Number(newGame.playtime);
    if (newGame.intensity === "none") delete newGame.intensity;

    if (editingId) {
        const index = gamesArray.findIndex(g => g.id === editingId);
        
        gamesArray[index] = { ...newGame, id: editingId};
        editingId = null;
    }
    
    else {
        newGame.id = crypto.randomUUID()
        gamesArray.push(newGame);
    }

    renderGames(sortGames(getFilteredGames(), currentSort, currentSortOrder), view);
    localStorage.setItem("gamesArray", JSON.stringify(gamesArray));
    submitBtn.textContent = "Add Game"
    form.reset();
    modal.close()
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

const editBtn = document.querySelector("#editBtn");

editBtn.addEventListener("click", () => {
    editMode = !editMode;
    btnTextHandler();
    deleteMode = false;
    app.classList.toggle("editMode", editMode);
})

app.addEventListener("click", (e) => {
    if (!editMode && !deleteMode) return;

    const card = e.target.closest(".gameCard");
    if (!card) return;

    if (editMode) {    
        editingId = card.dataset.id;
        const editedGame = gamesArray.find(g => g.id === editingId);
        submitBtn.textContent = "Edit Game"
        
        document.querySelector("#modalTitle").textContent = editingId ? "Edit Game" : "Add Game";
        modalOpenHandler();
        fillFormWithGame(editedGame);
    }

    if (deleteMode) {
        deleteId = card.dataset.id;
        const deletedGame = gamesArray.findIndex(g => g.id === deleteId);
        gamesArray.splice(deletedGame, 1);
        renderGames(sortGames(getFilteredGames(), currentSort, currentSortOrder), view);
        deleteMode = false;
        btnTextHandler();
        localStorage.setItem("gamesArray", JSON.stringify(gamesArray));
    }
})

function fillFormWithGame(game) {
    form.name.value = game.name;
    form.thumbnail.value = game.thumbnail;
    form.release.value = game.release;
    form.rating.value = game.rating;
    form.playTime.value = game.playTime;
    form.playState.value = game.playState;
    form.review.value = game.review;
    form.intensity.value = game.intensity;
    form.completed100.value = game.completed100;
}

const deleteBtn = document.querySelector("#deleteBtn");
let deleteMode = false;
let deleteId = null;

deleteBtn.addEventListener("click", () => {
    deleteMode = !deleteMode;
    editMode = false;
    btnTextHandler();
    app.classList.toggle("deleteMode", deleteMode);
})

function btnTextHandler() {
    editBtn.textContent = editMode ? "Finish Editing" : "Edit Game"
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