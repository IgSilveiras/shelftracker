import { closeModalAnimated } from "./utils.js";
import { parseImport } from "./backup.js";
import { t } from "./translations.js";

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
    const countLabel = (key, count) => t(count === 1 ? `${key}One` : `${key}Other`, { count });

    importBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        fileInput.value= "";
        if (!file) return;

        const result = parseImport(await file.text());

        if (!result.games) {
            pending = null;
            title.textContent = t("import.failedTitle");
            description.textContent = t(result.error ?? "import.errorUnexpected");
            confirmBtn.hidden = true;
            cancelBtn.textContent = t("common.close");
        }

        else {
            pending = result;
            const owner = result.username 
                ? t("import.ownerNamed", { name: result.username })
                : t("import.ownerUnnamed");
            title.textContent = t("import.confirmTitle");
            description.textContent = 
                t("import.description", {
                    current: countLabel("import.games", getGamesCount()),
                    owner,
                    incoming: countLabel("import.games", result.games.length),
                }) +
                (result.skipped ? ` ${countLabel("import.skipped", result.skipped)}` : "");

            confirmBtn.hidden = false;
            cancelBtn.textContent = t("common.cancel");
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