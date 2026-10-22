import { NO_INTENSITY_STATES } from "./config.js";
import { t } from "./translations.js";

export function hasIntensity(playState) {
    return !NO_INTENSITY_STATES.includes(playState);
}

export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function closeModalAnimated(modalEl, onClosed) {
    modalEl.classList.add("closing");
    modalEl.addEventListener("animationend", () => {
        modalEl.classList.remove("closing");
        modalEl.close();
        if (onClosed) onClosed();
    }, { once: true });
}

export function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function animateModalResize(updateFn) {
    if (document.startViewTransition && !prefersReducedMotion()) {
        document.startViewTransition(updateFn);
    }

    else {
        updateFn();
    }
}

export function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

}

export function resolveLabel({ labelKey, label }) {
    return labelKey ? t(labelKey) : label;
}

export function normalizeNumber(raw, { min = -Infinity, max = Infinity, step } = {}) {
    let n = raw === "" ? 0 : Number(raw);
    if(!Number.isFinite(n)) n = 0;
    if (step) n = Math.round(n / step) * step;
    return Math.min(max, Math.max(min, n));
}