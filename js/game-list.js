import { buildStateBadge } from "./badge.js";
import { EMPTY_STATES } from "./config.js";
import { escapeHTML } from "./utils.js";
import { t, onLanguageChange } from "./translations.js";

function buildEmptyState(reason) {
    const s = EMPTY_STATES[reason];
    return `
        <div class="emptyState" role="status">
            <i class="ti ${s.icon}" aria-hidden="true"></i>
            <p class="emptyStateTitle">${t(s.titleKey)}</p>
            <p class="emptyStateText">${t(s.textKey)}</p>
            ${s.action ? `<button type="button" class="btn btnNeutral clearFiltersBtn">${t("filter.clear")}</button>` : ""}
        </div>
    `;
}

const STAR_SVG = `<svg class="starIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245" /></svg>`;

function buildFavoriteButton(game) {
    const isFav = !!game.favorite;
    return `
        <button class="favoriteBtn ${isFav ? "favorited" : ""}" data-id="${game.id}" aria-pressed="${isFav}" aria-label="${t(isFav ? "fav.remove" : "fav.add")}">
            ${STAR_SVG}
        </button>
    `;
}

const app = document.querySelector("#app");
let lastRender = null;

export function renderGames(gamesArray, view, showDragHandle, emptyReason = null) {
    lastRender = { gamesArray, view, showDragHandle, emptyReason };

    if (emptyReason) {
        app.innerHTML = buildEmptyState(emptyReason);
        return;
    }

    const handleHTML = (name) => showDragHandle ? `
        <div class="dragHandle" tabindex="0" role="button" aria-pressed="false" aria-label="${escapeHTML(t("card.reorder", { name }))}">
            <i class="ti ti-grip-vertical" aria-hidden="true"></i>
        </div>
    ` : "";

    const cards = [];

    if (view === "grid") {
        app.classList.remove("gamesList");
        app.classList.add("gamesGrid");

        for (const element of gamesArray) {
            const { id, thumbnail, name, playState, intensity, completed100, playTime, rating } = element;
            const safeName = escapeHTML(name);

            cards.push(`
            <div class="gameCard" data-id="${id}" tabindex="0" role="button" aria-label="${escapeHTML(t("card.viewDetails", { name }))}">
                <div class="gameCardThumbnail">
                    <img src="${escapeHTML(thumbnail)}" alt="${escapeHTML(t("card.thumbnailAlt", { name }))}">
                    ${handleHTML(name)}
                    ${rating != 0 ? `<p class="gameRating">${rating}</p>` : ""}
                    ${buildFavoriteButton(element)}
                    ${playTime != 0 ? `<p class="gamePlaytime">${playTime}hs</p>` : ""}
                </div>
                <div class="gameCardInfo">
                    <p class="gameName" title="${safeName}">${safeName}</p>
                    <div class="gameState">
                        ${buildStateBadge(playState, intensity, completed100)}
                    </div>
                </div>
            </div>
            `);
        }
    } 
    
    else {
        app.classList.remove("gamesGrid");
        app.classList.add("gamesList");

        for (const element of gamesArray) {
            const { id, thumbnail, name, release, playTime, intensity, completed100, review, lastPlayed, playState, rating } = element;
            const safeName = escapeHTML(name);

            cards.push(`
            <div class="gameCard ${playState}" data-id="${id}" tabindex="0" role="button" aria-label="${escapeHTML(t("card.viewDetails", { name }))}">
            ${handleHTML(name)}
                <img src="${escapeHTML(thumbnail)}" class="gameThumbnail" alt="${escapeHTML(t("card.thumbnailAlt", { name }))}">
                <div class="gameInfo">
                    <div class="gameInfoHeader">
                        <p class="gameName" title="${safeName}">${safeName}</p>
                        ${playTime != 0 ? `<p class="gamePlaytime">${playTime}hs</p>` : ""}
                    </div>
                    <p class="gameMeta">
                        <span class="gameRelease">${escapeHTML(release)}</span>
                        ${lastPlayed ? `<span class="gameLastPlayed">· ${t("card.lastPlayed")} ${escapeHTML(lastPlayed)}</span>` : ""}
                    </p>
                    ${buildFavoriteButton(element)}
                    ${review ? `<p class="gameReview" title="${escapeHTML(review)}">${escapeHTML(review)}</p>` : ""}
                </div>
                <div class="gameState">
                    ${rating != 0 ? `<p class="gameRating">${rating}</p>` : ""}
                    <div class="gameBadgeContainer">
                        ${buildStateBadge(playState, intensity, completed100)}
                    </div>
                </div>
            </div>
            `);

        }
    }
    
    app.innerHTML = cards.join("");
}

onLanguageChange(() => {
    if (!lastRender) return;

    const { gamesArray, view, showDragHandle, emptyReason } = lastRender;
    renderGames(gamesArray, view, showDragHandle, emptyReason);
})

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