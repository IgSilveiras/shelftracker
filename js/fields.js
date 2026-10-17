import { capitalize, escapeHTML, resolveLabel } from "./utils.js";
import { t } from "./translations.js";

export function buildFieldInput(field, value = "", { id = "", name = "" } = {}) {
    const attrs = `data-field="${field.key}"${id ? ` id="${id}"` : ""}${name ? ` name="${name}"` : ""}`;

    if (field.type === "select") {
        const options = field.options
            .map(opt => {
                return `<option value="${opt.value}" ${value === opt.value ? "selected" : ""}>${resolveLabel(opt)}</option>`;
            })
            .join("");
        const blankOption = field.required ? "" : `<option value="">-</option>`;
        return `<select ${attrs}>${blankOption}${options}</select>`;
    }

    if (field.type === "textarea") return `<textarea ${attrs}>${escapeHTML(value)}</textarea>`;
    if (field.type === "checkbox") return `<input type="checkbox" ${attrs} ${value ? "checked" : ""}>`;

    return `<input type="${field.type}" ${attrs} value="${escapeHTML(value)}">`;
}

export function buildFormGroup(field) {
    const id = `formAdvanced${capitalize(field.key)}`;
    const key = `field.${field.key}`;
    return `
        <div class="formGroup">
            <label for="${id}">${t(key)}</label>
            ${buildFieldInput(field, "", { id, name: field.key })}
        </div>
    `;
}