import { DETAIL_FIELDS, STATUS_CONFIG } from "./config.js";
import { capitalize, closeModalAnimated } from "./utils.js";
import { buildStateBadge } from "./badge.js";

let editingMode = false;
let currentDetailId = null;

export function initDetailModal({ getGame, onGameSaved, onDeleteRequested }) {
    const detailedViewModal = document.querySelector("#detailedViewModal");
    const detailModalTitle = document.querySelector("#detailModalTitle");
    const detailedViewModalInfo = document.querySelector("#detailedViewModalInfo");
    const detailThumbnailImg = document.querySelector("#detailedViewModalThumbnail img");
    const detailRelease = document.querySelector("#detailedViewModalRelease");
    const detailBadge = document.querySelector("#detailedViewModalBadge");
    const detailEditBtn = document.querySelector("#detailedViewModalEditBtn");
    const detailDeleteBtn = document.querySelector("#detailedViewModalDeleteBtn");

    function refreshDetailHeader(game) {
        detailedViewModal.classList.remove(...Object.keys(STATUS_CONFIG));
        detailedViewModal.classList.add(game.playState);
        detailModalTitle.textContent = game.name;
        detailThumbnailImg.src = game.thumbnail;
        detailThumbnailImg.alt = `${game.name} thumbnail`;
        detailRelease.textContent = game.release;
        detailBadge.innerHTML = buildStateBadge(game.playState, game.intensity, game.completed100);
    }

    function buildFieldInput(field, value) {
        if (field.type === "select") {
            const options = field.options
                .map(opt => {
                    const optValue = typeof opt === "string" ? opt : opt.value;
                    const optLabel = typeof opt === "string" ? capitalize(opt) : opt.label;
                    return `<option value="${optValue}" ${value === optValue ? "selected" : ""}>${optLabel}</option>`;
                })
                .join("");
            const blankOption = field.required ? "" : `<option value="">-</option>`;
            return `<select data-field="${field.key}">${blankOption}${options}</select>`;
        }

        if (field.type === "textarea") {
            return `<textarea data-field="${field.key}">${value}</textarea>`;
        }

        return `<input type="${field.type}" data-field="${field.key}" value="${value}">`;
    }

    function renderDetailFields(game, editing) {
        detailedViewModalInfo.classList.toggle("editing", editing);
        const fieldsToRender = DETAIL_FIELDS.filter(f => editing || !f.hideInReadMode);

        detailedViewModalInfo.innerHTML = fieldsToRender.map(field => {
            const rawValue = game[field.key] ?? "";
            const displayValue = field.type === "select"
                ? (() => {
                    const opt = field.options.find(o => (typeof o === "string" ? o : o.value) === rawValue);
                    if (!opt) return rawValue;
                    return typeof opt === "string" ? capitalize(opt) : opt.label;
                  })()
                : field.suffix && rawValue !== "" ? `${rawValue}${field.suffix}` : rawValue;

            return `
                <dt class="${field.fullWidth ? "fullWidth" : ""}">${field.label}</dt>
                <dd class="${field.fullWidth ? "fullWidth" : ""}">${editing ? buildFieldInput(field, rawValue) : (displayValue || "-")}</dd>
            `;
        }).join("");
    }

    function updateDetailActionButtons() {
        detailEditBtn.textContent = editingMode ? "Confirm" : "Edit";
        detailDeleteBtn.textContent = editingMode ? "Cancel" : "Delete";
        detailDeleteBtn.classList.toggle("btnNeutral", editingMode);
        detailDeleteBtn.classList.toggle("btnDanger", !editingMode);
    }

    function saveDetailFields(game) {
        document.querySelectorAll("#detailedViewModalInfo [data-field]").forEach(input => {
            const field = DETAIL_FIELDS.find(f => f.key === input.dataset.field);
            let value = input.value;
            if (field.type === "number") value = value === "" ? 0 : Number(value);
            game[field.key] = value;
        });

        onGameSaved();
    }

    function toggleDetailMode() {
        const game = getGame(currentDetailId);
        if (!game) return;

        if (editingMode) {
            saveDetailFields(game);
            refreshDetailHeader(game);
        }

        editingMode = !editingMode;
        renderDetailFields(game, editingMode);
        updateDetailActionButtons();
    }

    detailEditBtn.addEventListener("click", toggleDetailMode);

    detailDeleteBtn.addEventListener("click", () => {
        if (editingMode) {
            editingMode = false;
            const game = getGame(currentDetailId);
            renderDetailFields(game, false);
            updateDetailActionButtons();
        } else {
            onDeleteRequested(currentDetailId);
        }
    });

    function resetDetailState() {
        editingMode = false;
        currentDetailId = null;
    }

    detailedViewModal.addEventListener("click", (e) => {
        if (e.target === detailedViewModal) closeModalAnimated(detailedViewModal, resetDetailState);
    });

    detailedViewModal.addEventListener("cancel", (e) => {
        e.preventDefault();
        closeModalAnimated(detailedViewModal, resetDetailState);
    });

    return {
        open(id) {
            currentDetailId = id;
            editingMode = false;

            const game = getGame(id);
            if (!game) return;

            refreshDetailHeader(game);
            renderDetailFields(game, false);
            updateDetailActionButtons();
            detailedViewModal.showModal();
        },
        close() {
            closeModalAnimated(detailedViewModal, resetDetailState);
        },
    };
}