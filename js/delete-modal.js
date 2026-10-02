import { closeModalAnimated } from "./utils.js";

export function initDeleteModal({ getGame, onConfirmed }) {
    const deleteGameModal = document.querySelector("#deleteGameModal");
    const deleteGameTitle = document.querySelector("#deleteGameTitle");
    const cancelDeleteBtn = document.querySelector("#cancelDeleteBtn");
    const confirmDeleteBtn = document.querySelector("#confirmDeleteBtn");

    let pendingId = null;

    function closeDeleteModal() {
        closeModalAnimated(deleteGameModal);
    }

    cancelDeleteBtn.addEventListener("click", closeDeleteModal);

    deleteGameModal.addEventListener("click", (e) => {
        if (e.target === deleteGameModal) closeDeleteModal();
    });

    deleteGameModal.addEventListener("cancel", (e) => {
        e.preventDefault();
        closeDeleteModal();
    });

    confirmDeleteBtn.addEventListener("click", () => {
        onConfirmed(pendingId);
        closeDeleteModal();
    });

    return {
        open(id) {
            const game = getGame(id);
            if (!game) return;

            pendingId = id;
            deleteGameTitle.textContent = game.name;
            deleteGameModal.showModal();
        },
    };
}