import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Layers, LogOut, Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { getToken } from "../api/client";
import { logout } from "../api/auth";
import SettingsDialog from "./SettingsDialog";
import LanguageSelect from "./LanguageSelect";

// frame around every page: top bar with brand, language, theme toggle, dashboard, settings and logout
export default function Layout() {
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const loggedIn = getToken() !== null;
    const [settingsOpen, setSettingsOpen] = useState(false);

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <div className="page">
            <header className="topbar glass">
                {/* logo leads to the start page: decks if logged in, otherwise login */}
                <Link to={loggedIn ? "/decks" : "/login"} className="brand">
                    <Layers aria-hidden="true" /> flashcards
                </Link>
                <div className="topbar__actions">
                    <LanguageSelect />
                    <button
                        type="button"
                        className="btn btn--icon"
                        onClick={toggleTheme}
                        aria-label={theme === "dark" ? t("layout.lightTheme") : t("layout.darkTheme")}
                        title={theme === "dark" ? t("layout.lightTheme") : t("layout.darkTheme")}
                    >
                        {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
                    </button>
                    {/* NavLink sets aria-current="page" while the dashboard is open */}
                    {loggedIn && (
                        <NavLink to="/dashboard" className="btn btn--icon" aria-label={t("layout.dashboard")} title={t("layout.dashboard")}>
                            <LayoutDashboard aria-hidden="true" />
                        </NavLink>
                    )}
                    {loggedIn && (
                        <button
                            type="button"
                            className="btn btn--icon"
                            onClick={() => setSettingsOpen(true)}
                            aria-label={t("layout.settings")}
                            title={t("layout.settings")}
                        >
                            <Settings aria-hidden="true" />
                        </button>
                    )}
                    {loggedIn && (
                        <button
                            type="button"
                            className="btn btn--icon"
                            onClick={handleLogout}
                            aria-label={t("layout.logout")}
                            title={t("layout.logout")}
                        >
                            <LogOut aria-hidden="true" />
                        </button>
                    )}
                </div>
            </header>
            <main>
                <Outlet />
            </main>
            {loggedIn && <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
        </div>
    );
}
