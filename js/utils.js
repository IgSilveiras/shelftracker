import { NO_INTENSITY_STATES } from "./config.js";

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

export function animateModalResize(updateFn) {
    if (document.startViewTransition) {
        document.startViewTransition(updateFn);
    }

    else {
        updateFn();
    }
}