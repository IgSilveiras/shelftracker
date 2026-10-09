import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@1.15.7/+esm";
import { prefersReducedMotion } from "./utils.js";

export function getColumnCount(gridEl) {
    return getComputedStyle(gridEl).gridTemplateColumns.split(" ").length;
}

export function initCustomOrderDrag({ containerEl, onReorder }) {
    const sortable = Sortable.create(containerEl, {
        handle: ".dragHandle",
        animation: prefersReducedMotion() ? 0 : 150,
        ghostClass: "dragGhost",
        disabled: true,
        onEnd(evt) {
            if (evt.oldIndex === evt.newIndex) return;
            onReorder(evt.oldIndex, evt.newIndex);
        },
    });

    return {
        setEnabled(enabled) {
            sortable.option("disabled", !enabled);
        },
    };
}

export function initKeyboardReorder({ containerEl, getView, onReorder }) {
    let grabbedId = null;
    let grabbedStartIndex = null;
    let suppressNextFocusOut = false;

    function releaseGrabbedCard() {
        if (!grabbedId) return;

        const prevCard = containerEl.querySelector(`.gameCard[data-id="${grabbedId}"]`);
        const prevHandle = prevCard?.querySelector(".dragHandle");
        prevCard?.classList.remove("cardGrabbed");
        prevHandle?.setAttribute("aria-pressed", "false");
        grabbedId = null;
        grabbedStartIndex = null;
    }

    function grabCard(card, handle, startIndex) {
        releaseGrabbedCard();
        grabbedId = card.dataset.id;
        grabbedStartIndex = startIndex;
        card.classList.add("cardGrabbed");
        handle.setAttribute("aria-pressed", "true");
    }

    function moveIndex(currentIndex, key, view, columnCount, lenght) {
        let target = currentIndex;

        if (view === "list") {
            if (key === "ArrowUp") target = currentIndex - 1;
            if (key === "ArrowDown") target = currentIndex + 1;
        }

        else {
            if (key === "ArrowLeft") target = currentIndex - 1;
            if (key === "ArrowRight") target = currentIndex + 1;
            if (key === "ArrowUp") target = currentIndex - columnCount;
            if (key === "ArrowDown") target = currentIndex + columnCount;
        }

        if (target < 0 || target >= lenght) return currentIndex;
        return target;
    }

    containerEl.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && grabbedId) {
            e.preventDefault();
            const cards = [...containerEl.querySelectorAll(".gameCard")];
            const currentIndex = cards.findIndex(c => c.dataset.id === grabbedId);

            if (grabbedStartIndex !== null && currentIndex !== grabbedStartIndex) {
                suppressNextFocusOut = true;
                onReorder(currentIndex, grabbedStartIndex, grabbedId);
                requestAnimationFrame(() => { suppressNextFocusOut = false });
                requestAnimationFrame(() => releaseGrabbedCard());
            }
            
            else {
                releaseGrabbedCard();
            }

            return;
        }

        const handle = e.target.closest(".dragHandle");
        if(!handle) return;

        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const card = handle.closest(".gameCard");
            
            if (grabbedId === card.dataset.id) {
                releaseGrabbedCard();
            }

            else {
                const cards = [...containerEl.querySelectorAll(".gameCard")];
                const startIndex = cards.findIndex(c => c === card);
                grabCard(card, handle, startIndex);
            }

            return;
        }

        containerEl.addEventListener("focusout", (e) => {
            if (suppressNextFocusOut) return;

            if (!grabbedId) return;

            const leavingHandle = e.target.closest(".dragHandle");
            if (!leavingHandle) return;

            releaseGrabbedCard();
        })

        if (!grabbedId) return;
        if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;

        e.preventDefault();
        const cards = [...containerEl.querySelectorAll(".gameCard")];
        const currentIndex = cards.findIndex(c => c.dataset.id === grabbedId);
        const columnCount = getColumnCount(containerEl);

        const targetIndex = moveIndex(currentIndex, e.key, getView(), columnCount, cards.length);
        if (targetIndex === currentIndex) return;

        suppressNextFocusOut = true;
        onReorder(currentIndex, targetIndex, grabbedId);
        requestAnimationFrame(() => { suppressNextFocusOut = false });
    });

    containerEl.addEventListener("dragstart", (e) => {
    const card = e.target.closest(".gameCard");
    const img = card?.querySelector("img");
    if (!img) return;

    const width = 80;
    const height = width * (img.naturalHeight / img.naturalWidth);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);

    e.dataTransfer.setDragImage(canvas, width / 2, height / 2);
});
}