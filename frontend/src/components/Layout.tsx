import { Link, Outlet, useNavigate } from "react-router";
import { Layers, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { getToken } from "../api/client";
import { logout } from "../api/auth";

// frame around every page: top bar with brand, theme toggle and logout
export default function Layout() {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const loggedIn = getToken() !== null;

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
        </div>
    );
}
