export function initProfile({ getUsername, onRename }) {
    const nameBtn = document.querySelector("#usernameBtn");
    const nameText = document.querySelector("#usernameText");
    const editWrap = document.querySelector("#usernameEdit");
    const input = document.querySelector("#usernameInput");

    let editing = false;

    function render() {
        nameText.textContent = getUsername(); 
    }

    function startEditing() {
        editing = true;
        input.value = getUsername();
        nameBtn.hidden = true;
        editWrap.hidden = false;
        input.focus();
        input.select();
    }

    function finishEditing({ save, restoreFocus }) {
        if (!editing) return;
        editing = false;

        const name = input.value.trim();
        if (save && name && name !== getUsername()) onRename(name);

        editWrap.hidden = true;
        nameBtn.hidden = false;
        render();
        if (restoreFocus) nameBtn.focus();
    }

    nameBtn.addEventListener("click", startEditing);

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            finishEditing({ save: true, restoreFocus: true });
        }

        else if (e.key === "Escape") {
            e.preventDefault();
            finishEditing({ save: false, restoreFocus: true });
        }
    });

    input.addEventListener("blur", () => finishEditing({ save: true, restoreFocus: false }));

    render();
    return { render };
}