import { hasIntensity, closeModalAnimated } from "./utils.js";

export function initAddGameModal({ onGameAdded }) {
    const formModal = document.querySelector("#gameFormModal");
    const form = document.querySelector("#gameForm");
    const addGameBtn = document.querySelector("#addGameBtn");

    const formPlayState = form.querySelector("#formPlayState");
    const formIntensity = document.querySelector("#formIntensity");
    const formIntensityLabel = document.querySelector("#formIntensityLabel");
    const formCompleted100Group = document.querySelector("#formCompleted100Group");

    function updateIntensityView() {
        const value = formPlayState.value;
        const showIntensity = hasIntensity(value);
        const showCompleted100 = value === "completed";

        formIntensity.hidden = !showIntensity;
        formIntensityLabel.hidden = !showIntensity;

        formCompleted100Group.hidden = !showCompleted100;
        formCompleted100Group.querySelector("input").disabled = !showCompleted100;
    }

    formPlayState.addEventListener("change", updateIntensityView);

    addGameBtn.addEventListener("click", () => formModal.showModal());

    formModal.addEventListener("click", (e) => {
        if (e.target === formModal) closeModalAnimated(formModal);
    });

    formModal.addEventListener("cancel", (e) => {
        e.preventDefault();
        closeModalAnimated(formModal);
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const newGame = Object.fromEntries(formData);

        newGame.rating = newGame.rating === "" ? 0 : Number(newGame.rating);
        newGame.release = newGame.release === "" ? 0 : Number(newGame.release);
        newGame.playTime = newGame.playTime === "" ? 0 : Number(newGame.playTime);
        if (newGame.intensity === "none") delete newGame.intensity;

        newGame.id = crypto.randomUUID();
        onGameAdded(newGame);

        form.reset();
        closeModalAnimated(formModal);
    });
}