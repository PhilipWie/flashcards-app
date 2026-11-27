import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { UserPlus } from "lucide-react";
import { register } from "../api/auth";
import { ApiError } from "../api/client";

// same limits as the backend (register.ts)
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 500;
const EMAIL_MAX = 254;

// state that the login page receives after a successful registration
export type RegisteredState = { registered: true; email: string };

export default function RegisterPage() {
    const [email, setEmail] = useState("");
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
            await register(email, password);
            // register returns no token, so the user logs in afterwards
            const state: RegisteredState = { registered: true, email: email.trim().toLowerCase() };
            navigate("/login", { state });
        } catch (err) {
            if (err instanceof ApiError && err.status === 409) {
                setError("Diese E-Mail ist bereits registriert. Melde dich stattdessen an.");
            } else if (err instanceof ApiError) {
                // 400: validation message from the backend
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
        <section className="auth glass" aria-labelledby="register-title">
            <div>
                <h1 id="register-title">Registrieren</h1>
                <p className="text-muted">Lege ein Konto an, um deine eigenen Stapel zu speichern.</p>
            </div>

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
                        maxLength={EMAIL_MAX}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-invalid={error !== null}
                        aria-describedby={error ? "register-error" : undefined}
                    />
                </div>

                <div className="field">
                    <label htmlFor="password">Passwort</label>
                    <input
                        id="password"
                        className="input"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={PASSWORD_MIN}
                        maxLength={PASSWORD_MAX}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={error !== null}
                        aria-describedby={error ? "register-error" : "password-hint"}
                    />
                    <p className="field__hint" id="password-hint">
                        Mindestens {PASSWORD_MIN} Zeichen.
                    </p>
                </div>

                {error && (
                    <p className="field__error" id="register-error" role="alert">
                        {error}
                    </p>
                )}

                <button type="submit" className="btn btn--primary" disabled={loading}>
                    <UserPlus aria-hidden="true" />
                    {loading ? "Konto wird angelegt …" : "Konto anlegen"}
                </button>
            </form>

            <p className="auth__footer text-muted">
                Schon ein Konto? <Link to="/login">Anmelden</Link>
            </p>
        </section>
    );
}
