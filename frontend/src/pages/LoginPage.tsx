import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { LogIn } from "lucide-react";
import { login } from "../api/auth";
import { ApiError } from "../api/client";
import type { RegisteredState } from "./RegisterPage";

export default function LoginPage() {
    // set by RegisterPage after a successful registration
    const registered = useLocation().state as RegisteredState | null;
    const [email, setEmail] = useState(registered?.email ?? "");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        // stop the browser from reloading the page
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            navigate("/decks");
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                // backend only says "unauthorized", on purpose not more specific
                setError("E-Mail oder Passwort ist falsch.");
            } else if (err instanceof ApiError) {
                setError(err.message);
            } else {
                // fetch itself failed, e.g. backend not running
                setError("Server nicht erreichbar. Bitte später erneut versuchen.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="auth glass" aria-labelledby="login-title">
            <div>
                <h1 id="login-title">Anmelden</h1>
                <p className="text-muted">Melde dich an, um mit deinen Stapeln weiterzulernen.</p>
            </div>

            {registered?.registered && !error && (
                <p className="notice notice--success" role="status">
                    Registrierung erfolgreich. Du kannst dich jetzt anmelden.
                </p>
            )}

            <form className="auth__form" onSubmit={handleSubmit}>
                <div className="field">
                    <label htmlFor="email">E-Mail</label>
                    <input
                        id="email"
                        className="input"
                        type="email"
                        autoComplete="email"
                        placeholder="name@beispiel.de"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-invalid={error !== null}
                        aria-describedby={error ? "login-error" : undefined}
                    />
                </div>

                <div className="field">
                    <label htmlFor="password">Passwort</label>
                    <input
                        id="password"
                        className="input"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={error !== null}
                        aria-describedby={error ? "login-error" : undefined}
                    />
                </div>

                {error && (
                    <p className="field__error" id="login-error" role="alert">
                        {error}
                    </p>
                )}

                <button type="submit" className="btn btn--primary" disabled={loading}>
                    <LogIn aria-hidden="true" />
                    {loading ? "Anmelden …" : "Anmelden"}
                </button>
            </form>

            <p className="auth__footer text-muted">
                Noch kein Konto? <Link to="/register">Registrieren</Link>
            </p>
        </section>
    );
}
