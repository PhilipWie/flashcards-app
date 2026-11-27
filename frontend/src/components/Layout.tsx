import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { LayoutDashboard, Layers, LogOut, Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { getToken } from "../api/client";
import { logout } from "../api/auth";
import SettingsDialog from "./SettingsDialog";

// frame around every page: top bar with brand, theme toggle, dashboard, settings and logout
export default function Layout() {
    const { theme, toggleTheme } = useTheme();
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
                    <button
                        type="button"
                        className="btn btn--icon"
                        onClick={toggleTheme}
                        aria-label={theme === "dark" ? "Helles Design" : "Dunkles Design"}
                        title={theme === "dark" ? "Helles Design" : "Dunkles Design"}
                    >
                        {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
                    </button>
                    {/* NavLink sets aria-current="page" while the dashboard is open */}
                    {loggedIn && (
                        <NavLink to="/dashboard" className="btn btn--icon" aria-label="Dashboard" title="Dashboard">
                            <LayoutDashboard aria-hidden="true" />
                        </NavLink>
                    )}
                    {loggedIn && (
                        <button
                            type="button"
                            className="btn btn--icon"
                            onClick={() => setSettingsOpen(true)}
                            aria-label="Einstellungen"
                            title="Einstellungen"
                        >
                            <Settings aria-hidden="true" />
                        </button>
                    )}
                    {loggedIn && (
                        <button
                            type="button"
                            className="btn btn--icon"
                            onClick={handleLogout}
                            aria-label="Abmelden"
                            title="Abmelden"
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
