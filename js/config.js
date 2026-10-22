export const STATUS_CONFIG = {
    planToPlay: { icon: "ti-bookmark",    labelKey: "status.planToPlay",    className: "planToPlay" },
    playing:    { icon: "ti-player-play", labelKey: "status.playing",       className: "playing" },
    completed:  { icon: "ti-check",       labelKey: "status.completed",     className: "completed" },
    paused:     { icon: "ti-player-pause",labelKey: "status.paused",        className: "paused" },
    abandoned:  { icon: "ti-x",           labelKey: "status.abandoned",     className: "abandoned" },
};

export const INTENSITY_CONFIG = {
    tryhard: { icon: "ti-flame",   label: "Tryhard" },
    casual:  { icon: "ti-feather", label: "Casual" },
};

export const NO_INTENSITY_STATES = ["completed"];

export const REVISIT_CHANCE_VALUES = ["none", "unlikely", "maybe", "likely", "definitely"]
    .map(value => ({ value, labelKey: `revisit.${value}` }));

const DIFFICULTY_OPTIONS = ["easy", "medium", "hard", "veryHard"]
    .map(value => ({ value, labelKey: `difficulty.${value}` }));

export const DETAIL_FIELDS = [
    { key: "name",          label: "Name",           type: "text",   hideInReadMode: true , required: true, fullWidth: true },
    { key: "thumbnail",     label: "Thumbnail URL",  type: "url",    hideInReadMode: true, fullWidth: true },
    { key: "release",       label: "Release Year",   type: "number", hideInReadMode: true },
    { key: "playState",     label: "Play State",     type: "select", hideInReadMode: true, required: true, options: Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ value, labelKey: cfg.labelKey })) },
    { key: "intensity",     label: "Intensity",      type: "select", hideInReadMode: true, 
        visibleWhen: (playState) => !NO_INTENSITY_STATES.includes(playState),
        options: [
            { value: "casual",  label: "Casual" },
            { value: "tryhard", label: "Tryhard" },
        ],
    },
    { key: "completed100",  label: "100%", type: "checkbox", hideInReadMode: true, visibleWhen: (playState) => playState === "completed" },
    { key: "rating",        label: "Rating",         type: "number", min: 0, max: 10, step: 0.5 },
    { key: "playTime",      label: "Playtime",       type: "number", min: 0, suffix: "hs" },
    { key: "startDate",     label: "Start Date",     type: "date" },
    { key: "finishDate",    label: "Finish Date",    type: "date" },
    { key: "platform",      label: "Platform",       type: "text" },
    { key: "lastPlayed",    label: "Last Played",    type: "date" },
    { key: "difficulty",    label: "Difficulty",     type: "select", options: DIFFICULTY_OPTIONS },
    { key: "revisitChance", label: "Revisit Chance", type: "select", options: REVISIT_CHANCE_VALUES },
    { key: "review",        label: "Review",         type: "textarea", fullWidth: true },
];

export const ADVANCED_ADD_FIELDS = ["startDate", "finishDate", "platform", "lastPlayed", "difficulty", "revisitChance"];

export const EMPTY_STATES = {
    library:        { icon: "ti-device-gamepad-2",  titleKey: "empty.libraryTitle",     textKey: "empty.libraryText", demo: true },
    noFavorites:    { icon: "ti-star",              titleKey: "empty.noFavoritesTitle", textKey: "empty.noFavoritesText", action: true },
    filters:        { icon: "ti-filter-off",        titleKey: "empty.filtersTitle",     textKey: "empty.filtersText", action: true }
};