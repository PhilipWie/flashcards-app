import { request } from "./client";
import type { Stats } from "../types/Stats";

// learning statistics of the logged in user
export function getStats(): Promise<Stats> {
    return request<Stats>("GET", "/api/stats");
}
