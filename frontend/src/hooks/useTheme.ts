import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

// must match the key in the inline script in index.html
const THEME_STORAGE_KEY = "flashcards_theme";

// default is light, dark only if the user chose it before
function getInitialTheme(): Theme {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    // tokens.css reacts to <html data-theme="...">
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    function toggleTheme() {
        setTheme((current) => (current === "dark" ? "light" : "dark"));
    }

    return { theme, toggleTheme };
}
