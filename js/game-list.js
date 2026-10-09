import { buildStateBadge } from "./badge.js";

function buildFavoriteButton(game) {
    const isFav = !!game.favorite;
    const STAR_SVG = `<svg class="starIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245" /></svg>`;
    return `
        <button class="favoriteBtn ${isFav ? "favorited" : ""}" data-id="${game.id}" aria-pressed="${isFav}" aria-label="${isFav ? "Remove from favorites" : "Add to favorites"}">
            ${STAR_SVG}
        </button>
    `;
}

const app = document.querySelector("#app");

export function renderGames(gamesArray, view, showDragHandle) {
    app.innerHTML = "";
    let html;

    const handleHTML = (name) => showDragHandle ? `
        <div class="dragHandle" tabindex="0" role="button" aria-pressed="false" aria-label="Reorder ${name}">
            <i class="ti ti-grip-vertical" aria-hidden="true"></i>
        </div>
    ` : "";

    if (view === "grid") {
        app.classList.remove("gamesList");
        app.classList.add("gamesGrid");

        for (const element of gamesArray) {
            const { id, thumbnail, name, playState, intensity, completed100, playTime, rating } = element;

            html = `
            <div class="gameCard" data-id="${id}" tabindex="0" role="button" aria-label="View details for ${name}">
                <div class="gameCardThumbnail">
                    <img src="${thumbnail}" alt="${name} thumbnail">
                    ${handleHTML(name)}
                    ${rating != 0 ? `<p class="gameRating">${rating}</p>` : ""}
                    ${buildFavoriteButton(element)}
                    ${playTime != 0 ? `<p class="gamePlaytime">${playTime}hs</p>` : ""}
                </div>
                <div class="gameCardInfo">
                    <p class="gameName" title="${name}">${name}</p>
                    <div class="gameState">
                        ${buildStateBadge(playState, intensity, completed100)}
                    </div>
                </div>
            </div>
            `;

            app.innerHTML += html;
        }
    } else {
        app.classList.remove("gamesGrid");
        app.classList.add("gamesList");

        for (const element of gamesArray) {
            const { id, thumbnail, name, release, playTime, intensity, completed100, review, lastPlayed, playState, rating } = element;

            html = `
            <div class="gameCard ${playState}" data-id="${id}" tabindex="0" role="button" aria-label="View details for ${name}">
            ${handleHTML(name)}
                <img src="${thumbnail}" alt="${name}" class="gameThumbnail">
                <div class="gameInfo">
                    <div class="gameInfoHeader">
                        <p class="gameName" title="${name}">${name}</p>
                        ${playTime != 0 ? `<p class="gamePlaytime">${playTime}hs</p>` : ""}
                    </div>
                    <p class="gameMeta">
                        <span class="gameRelease">${release}</span>
                        ${lastPlayed ? `<span class="gameLastPlayed">· Last played: ${lastPlayed}</span>` : ""}
                    </p>
                    ${buildFavoriteButton(element)}
                    ${review ? `<p class="gameReview" title="${review}">${review}</p>` : ""}
                </div>
                <div class="gameState">
                    ${rating != 0 ? `<p class="gameRating">${rating}</p>` : ""}
                    <div class="gameBadgeContainer">
                        ${buildStateBadge(playState, intensity, completed100)}
                    </div>
                </div>
            </div>
            `;

            app.innerHTML += html;
        }
    }
}

export function getFilteredGames(gamesArray, currentFilter, favoritesOnly) {
    return gamesArray.filter(g => 
        (currentFilter === "all" || g.playState === currentFilter) &&
        (!favoritesOnly || g.favorite)
    );
}

export function sortGames(games, sortBy, direction) {
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