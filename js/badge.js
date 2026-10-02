import { STATUS_CONFIG, INTENSITY_CONFIG } from "./config.js";
import { hasIntensity } from "./utils.js";

export function buildStateBadge(playState, intensity, completed100) {
    const status = STATUS_CONFIG[playState];

    const modifier =
        hasIntensity(playState) && intensity ? INTENSITY_CONFIG[intensity]
        : playState === "completed" && completed100 ? { icon: "ti-trophy", label: "100% Completed" }
        : null;

    return `
        <span class="stateBadge ${status.className}" title="${status.label}">
            <i class="ti ${status.icon}" aria-hidden="true"></i> <span class="stateBadgeLabel">${status.label}</span>
        </span>
        ${modifier ? `<i class="ti ${modifier.icon} extraIcon" aria-hidden="true" title="${modifier.label}"></i>` : ""}
    `;
}