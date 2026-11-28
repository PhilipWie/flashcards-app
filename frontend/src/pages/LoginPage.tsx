import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { LogIn } from "lucide-react";
import { login } from "../api/auth";
import { apiErrorMessage } from "../i18n/apiErrors";
import type { RegisteredState } from "./RegisterPage";

// state that the login page receives when the session ran out (see useApiError)
export type SessionExpiredState = { sessionExpired: true };

export default function LoginPage() {
    // set by RegisterPage after a successful registration, or by useApiError when the session ended
    const state = useLocation().state as RegisteredState | SessionExpiredState | null;
    const registered = state && "registered" in state ? state : null;
    const sessionExpired = state !== null && "sessionExpired" in state;
    const [email, setEmail] = useState(registered?.email ?? "");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        // stop the browser from reloading the page
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            navigate("/decks");
        } catch (err) {
            // 401: INVALID_CREDENTIALS, on purpose not more specific (no hint which part was wrong)
            setError(apiErrorMessage(err, t));
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="auth glass" aria-labelledby="login-title">
            <div>
                <h1 id="login-title">{t("login.title")}</h1>
                <p className="text-muted">{t("login.intro")}</p>
            </div>

            {sessionExpired && !error && (
                <p className="notice" role="status">
                    {t("login.sessionExpired")}
                </p>
            )}

            {registered?.registered && !error && (
                <p className="notice notice--success" role="status">
                    {t("login.registered")}
                </p>
            )}

            <form className="auth__form" onSubmit={handleSubmit}>
                <div className="field">
                    <label htmlFor="email">{t("auth.email")}</label>
                    <input
                        id="email"
                        className="input"
                        type="email"
                        autoComplete="email"
                        placeholder={t("auth.emailPlaceholder")}
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-invalid={error !== null}
                        aria-describedby={error ? "login-error" : undefined}
                    />
                </div>

                <div className="field">
                    <label htmlFor="password">{t("auth.password")}</label>
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
                    {loading ? t("login.submitting") : t("login.submit")}
                </button>
            </form>

            <p className="auth__footer text-muted">
                {t("login.noAccount")} <Link to="/register">{t("login.toRegister")}</Link>
            </p>
        </section>
    );
}
