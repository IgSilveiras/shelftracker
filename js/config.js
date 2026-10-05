export const STATUS_CONFIG = {
    planToPlay: { icon: "ti-bookmark",    label: "Plan to Play", className: "planToPlay" },
    playing:    { icon: "ti-player-play", label: "Playing",      className: "playing" },
    completed:  { icon: "ti-check",       label: "Completed",    className: "completed" },
    paused:     { icon: "ti-player-pause",label: "Paused",       className: "paused" },
    abandoned:  { icon: "ti-x",           label: "Abandoned",    className: "abandoned" },
};

export const INTENSITY_CONFIG = {
    tryhard: { icon: "ti-flame",   label: "Tryhard" },
    casual:  { icon: "ti-feather", label: "Casual" },
};

export const NO_INTENSITY_STATES = ["completed"];

export const REVISIT_CHANCE_VALUES = ["none", "unlikely", "maybe", "likely", "definitely"];

const DIFFICULTY_OPTIONS = [
    { value: "easy", label:"Easy" },
    { value: "medium", label:"Medium" },
    { value: "hard", label:"Hard" },
    { value: "veryHard", label:"Very Hard" }
]

export const DETAIL_FIELDS = [
    { key: "name",          label: "Name",           type: "text",   hideInReadMode: true , required: true, fullWidth: true },
    { key: "thumbnail",     label: "Thumbnail URL",  type: "url",    hideInReadMode: true, fullWidth: true },
    { key: "release",       label: "Release Year",   type: "number", hideInReadMode: true },
    { key: "playState",     label: "Play State",     type: "select", hideInReadMode: true, required: true, options: Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label })) },
    { key: "intensity",     label: "Intensity",      type: "select", hideInReadMode: true, 
        visibleWhen: (playState) => !NO_INTENSITY_STATES.includes(playState),
        options: [
            { value: "",        label: "None" },
            { value: "casual",  label: "Casual" },
            { value: "tryhard", label: "Tryhard" },
        ],
    },
    { key: "completed100", label: "100%", type: "checkbox", hideInReadMode: true, visibleWhen: (playState) => playState === "completed" },
    { key: "rating",        label: "Rating",         type: "number" },
    { key: "playTime",      label: "Playtime",       type: "number", suffix: "hs" },
    { key: "startDate",     label: "Start Date",     type: "date" },
    { key: "finishDate",    label: "Finish Date",    type: "date" },
    { key: "platform",      label: "Platform",       type: "text" },
    { key: "lastPlayed",    label: "Last Played",    type: "date" },
    { key: "difficulty",    label: "Difficulty",     type: "select", options: DIFFICULTY_OPTIONS },
    { key: "revisitChance", label: "Revisit Chance", type: "select", options: REVISIT_CHANCE_VALUES },
    { key: "review",        label: "Review",         type: "textarea", fullWidth: true },
];