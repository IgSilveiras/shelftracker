import { closeModalAnimated } from "./utils.js";
import { parseImport } from "./backup.js";

export function initImport({ getGamesCount, onImport }) {
    const importBtn = document.querySelector("#importBtn");
    const fileInput = document.querySelector("#importFile");
    const modal = document.querySelector("#importModal");
    const title = document.querySelector("#importModalTitle");
    const description = document.querySelector("#importModalDescription");
    const cancelBtn = document.querySelector("#cancelImportBtn");
    const confirmBtn = document.querySelector("#confirmImportBtn");

    let pending = null;

    const closeModal = () => closeModalAnimated(modal);

    importBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        fileInput.value= "";
        if (!file) return;

        const result = parseImport(await file.text());

        if (!result.games) {
            pending = null;
            title.textContent = "Couldn't Import";
            description.textContent = result.error ?? "Unexpected problem while reading the file.";
            confirmBtn.hidden = true;
            cancelBtn.textContent = "Close";
        }

        else {
            pending = result;
            const owner = result.username ? `${result.username}'s list` : "the imported list"
            title.textContent = "Replace your List?";
            description.textContent = 
                `This replaces your current list (${getGamesCount()} games) with ${owner} (${result.games.length} games).` +
                (result.skipped ? ` ${result.skipped} invalid entries will be skipped.` : "");
            confirmBtn.hidden = false;
            cancelBtn.textContent = "Cancel";
        }

        modal.showModal();
    });

    confirmBtn.addEventListener("click", () => {
        if (pending) {
            onImport(pending);
            pending = null;
        }
        closeModal();
    });

    cancelBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    modal.addEventListener("cancel", (e) => { e.preventDefault(); closeModal(); });
}