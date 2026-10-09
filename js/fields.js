import { capitalize } from "./utils.js";

export function buildFieldInput(field, value = "", { id = "", name = "" } = {}) {
    const attrs = `data-field="${field.key}"${id ? ` id="${id}"` : ""}${name ? ` name="${name}"` : ""}`;

    if (field.type === "select") {
        const options = field.options
            .map(opt => {
                const optValue = typeof opt === "string" ? opt : opt.value;
                const optLabel = typeof opt === "string" ? capitalize(opt) : opt.label;
                return `<option value="${optValue}" ${value === optValue ? "selected" : ""}>${optLabel}</option>`;
            })
            .join("");
        const blankOption = field.required ? "" : `<option value="">-</option>`;
        return `<select ${attrs}>${blankOption}${options}</select>`;
    }

    if (field.type === "textarea") return `<textarea ${attrs}>${value}</textarea>`;
    if (field.type === "checkbox") return `<input type="checkbox" ${attrs} ${value ? "checked" : ""}>`;

    return `<input type="${field.type}" ${attrs} value="${value}">`;
}

export function buildFormGroup(field) {
    const id = `formAdvanced${capitalize(field.key)}`;
    return `
        <div class="formGroup">
            <label for="${id}">${field.label}</label>
            ${buildFieldInput(field, "", { id, name: field.key })}
        </div>
    `;
}