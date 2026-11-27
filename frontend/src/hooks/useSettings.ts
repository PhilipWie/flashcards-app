import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings, updateSettings } from "../lib/settings";

// current settings + function to change them.
// All components share one store, so a change in the settings menu
// is visible everywhere right away.
export function useSettings() {
    const settings = useSyncExternalStore(subscribeSettings, getSettings);
    return { settings, updateSettings };
}
