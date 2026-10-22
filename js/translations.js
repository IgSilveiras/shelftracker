const languageToggle = document.querySelector("#languageToggle");

let language = localStorage.getItem("language") || "en";

const languageListeners = [];

function setLanguage(language) {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;

    document.querySelectorAll("[data-translation]").forEach(e => {
        const key = e.dataset.translation;
        e.textContent = t(key);

        for (const attr of ["placeholder", "aria-label", "title"]) {
            document.querySelectorAll(`[data-translation-${attr}]`).forEach(e => {
                e.setAttribute(attr, t(e.getAttribute(`data-translation-${attr}`)));
            });
        };
    });

    languageToggle.textContent = language.toUpperCase();
    languageListeners.forEach(fn => fn(language));
}

export function t(key, params = {}) {
    const text = translations[language]?.[key] ?? translations.en[key];

    if (text === undefined) {
        console.warn(`Missing translation: ${key}`);
        return key;

    }
    
    return text.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? `{${name}}`);
}

export function onLanguageChange(fn) {
    languageListeners.push(fn);
}

languageToggle.addEventListener("click", () => {
    language = language === "en" ? "es" : "en";
    setLanguage(language);
})

const translations = {
    en: {
        "profile.shelfTitle": "{name}'s Shelf",
        "profile.hint": "Click to edit your name",
        "filter.all": "Any State",
        "filter.favorites": "Favorites Only",
        "filter.favoritesAria": "Show only favorites",
        "filter.clear": "Clear Filters",
        "sort.label": "Order:",
        "sort.custom": "Custom",
        "sort.direction": "Change Sort Direction",
        "view.legend": "view",
        "view.grid": "grid view",
        "view.list": "list view",
        "status.planToPlay": "Plan to Play",
        "status.playing": "Playing",
        "status.completed": "Completed",
        "status.paused": "Paused",
        "status.abandoned": "Abandoned",
        "badge.completed100": "100% Completed",
        "difficulty.easy": "Easy",
        "difficulty.medium": "Medium",
        "difficulty.hard": "Hard",
        "difficulty.veryHard": "Very Hard",
        "revisit.none": "None",
        "revisit.unlikely": "Unlikely",
        "revisit.maybe": "Maybe",
        "revisit.likely": "Likely",
        "revisit.definitely": "Definitely",
        "field.name": "Name",
        "field.thumbnail": "Thumbnail URL",
        "field.release": "Release Year",
        "field.playState": "Play State",
        "field.intensity": "Intensity",
        "field.rating": "Rating",
        "field.playTime": "Playtime",
        "field.startDate": "Start Date",
        "field.finishDate": "Finish Date",
        "field.platform": "Platform",
        "field.lastPlayed": "Last Played",
        "field.difficulty": "Difficulty",
        "field.revisitChance": "Revisit Chance",
        "field.review": "Review",
        "field.completed100": "100%",
        "addGame.title": "Add Game",
        "form.nameLabel": "Game Name",
        "form.playTimePlaceholder": "Played Hours",
        "form.releasePlaceholder": "Launch Year",
        "form.advanced": "Advanced Options",
        "common.cancel": "Cancel",
        "common.close": "Close",
        "common.confirm": "Confirm",
        "common.delete": "Delete",
        "common.edit": "Edit",
        "card.viewDetails": "View details for {name}",
        "card.reorder": "Reorder {name}",
        "card.thumbnailAlt": "{name} thumbnail",
        "card.lastPlayed": "Last played:",
        "fav.add": "Add to favorites",
        "fav.remove": "Remove from favorites",
        "empty.libraryTitle": "Your shelf is empty",
        "empty.libraryText": "Add your first game with the + button, or load a few examples",
        "empty.loadDemo": "Load Demo Games",
        "empty.noFavoritesTitle": "No favorites yet",
        "empty.noFavoritesText": "Tap the star on any game to add it here.",
        "empty.filtersTitle": "No games match these filters",
        "empty.filtersText": "Try a different state or clear the filters.",
        "delete.title": "Delete \"{name}\"?",
        "delete.description": "This will remove it from your list permanently.",
        "lang.toggle": "Change Language",
        "backup.export": "Export List",
        "backup.import": "Import List",
        "import.failedTitle": "Couldn't Import",
        "import.confirmTitle": "Replace your list?",
        "import.confirm": "Replace List",
        "import.description": "This replaces your current list ({current}) with {owner} ({incoming}).",
        "import.gamesOne": "{count} game",
        "import.gamesOther": "{count} games",
        "import.skippedOne": "{count} invalid entry will be skipped.",
        "import.skippedOther": "{count} invalid entries will be skipped.",
        "import.ownerNamed": "{name}'s list",
        "import.ownerUnnamed": "the imported list",
        "import.errorInvalidJson": "This file is not valid JSON.",
        "import.errorNotShelfTracker": "This file doesn't look like a ShelfTracker export.",
        "import.errorNewerVersion": "This file was exported from a newer version of ShelfTracker.",
        "import.errorNoValidGames": "The file doesn't contain any valid games.",
        "import.errorUnexpected": "Unexpected problem while reading the file.",
    },

    es: {
        "profile.shelfTitle": "Estantería de {name}",
        "profile.hint": "Click para editar tu nombre",
        "filter.all": "Cualquier Estado",
        "filter.favorites": "Solo Favoritos",
        "filter.favoritesAria": "Mostrar solo favoritos",
        "filter.clear": "Limpiar Filtros",
        "sort.label": "Orden:",
        "sort.custom": "Personalizado",
        "sort.direction": "Cambiar dirección del orden",
        "view.legend": "vista",
        "view.grid": "vista de cuadrícula",
        "view.list": "vista de lista",
        "status.planToPlay": "Por Jugar",
        "status.playing": "Jugando",
        "status.completed": "Completado",
        "status.paused": "En Pausa",
        "status.abandoned": "Abandonado",
        "badge.completed100": "Completado al 100%",
        "difficulty.easy": "Fácil",
        "difficulty.medium": "Media",
        "difficulty.hard": "Difícil",
        "difficulty.veryHard": "Muy Difícil",
        "revisit.none": "Ninguna",
        "revisit.unlikely": "Poco Probable",
        "revisit.maybe": "Quizás",
        "revisit.likely": "Probable",
        "revisit.definitely": "Seguro",
        "field.name": "Nombre",
        "field.thumbnail": "URL de la Portada",
        "field.release": "Año de Lanzamiento",
        "field.playState": "Estado",
        "field.intensity": "Intensidad",
        "field.rating": "Puntuación",
        "field.playTime": "Tiempo Jugado",
        "field.startDate": "Fecha de Inicio",
        "field.finishDate": "Fecha de Finalización",
        "field.platform": "Plataforma",
        "field.lastPlayed": "Última Vez Jugado",
        "field.difficulty": "Dificultad",
        "field.revisitChance": "Probabilidad de Rejugar",
        "field.review": "Reseña",
        "field.completed100": "100%",
        "addGame.title": "Agregar Juego",
        "form.nameLabel": "Nombre del Juego",
        "form.playTimePlaceholder": "Horas Jugadas",
        "form.releasePlaceholder": "Año de Lanzamiento",
        "form.advanced": "Opciones Avanzadas",
        "common.cancel": "Cancelar",
        "common.close": "Cerrar",
        "common.confirm": "Confirmar",
        "common.delete": "Eliminar",
        "common.edit": "Editar",
        "card.viewDetails": "Ver detalles de {name}",
        "card.reorder": "Reordenar {name}",
        "card.thumbnailAlt": "Portada de {name}",
        "card.lastPlayed": "Última vez jugado:",
        "fav.add": "Agregar a favoritos",
        "fav.remove": "Quitar de favoritos",
        "empty.libraryTitle": "Tu estantería está vacía",
        "empty.libraryText": "Agregá tu primer juego con el botón +, o cargá unos de ejemplo.",
        "empty.loadDemo": "Cargar Juegos de Ejemplo",
        "empty.noFavoritesTitle": "Todavía no tenés favoritos",
        "empty.noFavoritesText": "Tocá la estrella en cualquier juego para agregarlo acá.",
        "empty.filtersTitle": "Ningún juego coincide con estos filtros",
        "empty.filtersText": "Probá con otro estado o limpiá los filtros.",
        "delete.title": "¿Eliminar \"{name}\"?",
        "delete.description": "Esto lo eliminará de tu lista de forma permanente.",
        "lang.toggle": "Cambiar Idioma",
        "backup.export": "Exportar Lista",
        "backup.import": "Importar Lista",
        "import.failedTitle": "No se pudo importar",
        "import.confirmTitle": "¿Reemplazar tu lista?",
        "import.confirm": "Reemplazar Lista",
        "import.description": "Esto reemplaza tu lista actual ({current}) por {owner} ({incoming}).",
        "import.gamesOne": "{count} juego",
        "import.gamesOther": "{count} juegos",
        "import.skippedOne": "Se omitirá {count} entrada inválida.",
        "import.skippedOther": "Se omitirán {count} entradas inválidas.",
        "import.ownerNamed": "la lista de {name}",
        "import.ownerUnnamed": "la lista importada",
        "import.errorInvalidJson": "Este archivo no es un JSON válido.",
        "import.errorNotShelfTracker": "Este archivo no parece una exportación de ShelfTracker.",
        "import.errorNewerVersion": "Este archivo fue exportado desde una versión más nueva de ShelfTracker.",
        "import.errorNoValidGames": "El archivo no contiene juegos válidos.",
        "import.errorUnexpected": "Ocurrió un problema inesperado al leer el archivo.",
    }
}

setLanguage(language);