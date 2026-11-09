import { HANDLE_PATTERN } from "./profile-service.js";

export function getRoute() {
    const { pathname } = location;
    if (!pathname.startsWith("/u/")) return { type: "app" };

    const handle = pathname.slice(3).replace(/\/$/, "");
    return { type: "public", handle: HANDLE_PATTERN.test(handle) ? handle : null };
}