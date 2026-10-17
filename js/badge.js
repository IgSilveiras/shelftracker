import { STATUS_CONFIG, INTENSITY_CONFIG } from "./config.js";
import { hasIntensity, resolveLabel } from "./utils.js";
import { t } from "./translations.js";

export function buildStateBadge(playState, intensity, completed100) {
    const status = STATUS_CONFIG[playState];
    const statusLabel = t(status.labelKey);

    const modifier =
        hasIntensity(playState) && intensity ? INTENSITY_CONFIG[intensity]
        : playState === "completed" && completed100 ? { icon: "ti-trophy", labelKey: "badge.completed100" }
        : null;

    return `
        <span class="stateBadge ${status.className}" title="${statusLabel}">
            <i class="ti ${status.icon}" aria-hidden="true"></i> <span class="stateBadgeLabel">${statusLabel}</span>
        </span>
        ${modifier ? `<i class="ti ${modifier.icon} extraIcon" aria-hidden="true" title="${resolveLabel(modifier)}"></i>` : ""}
    `;
}