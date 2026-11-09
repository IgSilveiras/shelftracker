const toastEl = document.querySelector("#toast");
let timer = null;

export function showToast(message, { kind = "error", duration = 5000 } = {}) {
    clearTimeout(timer);
    toastEl.dataset.kind = kind;

    if (!toastEl.matches(":popover-open")) toastEl.showPopover();
    toastEl.textContent = message;

    timer = setTimeout(() => toastEl.hidePopover(), duration);
}