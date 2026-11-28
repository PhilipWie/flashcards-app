import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { UserPlus } from "lucide-react";
import { register } from "../api/auth";
import { apiErrorMessage } from "../i18n/apiErrors";

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
    const { t } = useTranslation();

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
            // e.g. 409 EMAIL_TAKEN or 400 EMAIL_INVALID (the browser accepts "a@b", the backend does not)
            setError(apiErrorMessage(err, t));
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="auth glass" aria-labelledby="register-title">
            <div>
                <h1 id="register-title">{t("register.title")}</h1>
                <p className="text-muted">{t("register.intro")}</p>
            </div>

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
                        maxLength={EMAIL_MAX}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-invalid={error !== null}
                        aria-describedby={error ? "register-error" : undefined}
                    />
                </div>

                <div className="field">
                    <label htmlFor="password">{t("auth.password")}</label>
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
                        {t("register.passwordHint", { min: PASSWORD_MIN })}
                    </p>
                </div>

                {error && (
                    <p className="field__error" id="register-error" role="alert">
                        {error}
                    </p>
                )}

                <button type="submit" className="btn btn--primary" disabled={loading}>
                    <UserPlus aria-hidden="true" />
                    {loading ? t("register.submitting") : t("register.submit")}
                </button>
            </form>

            <p className="auth__footer text-muted">
                {t("register.hasAccount")} <Link to="/login">{t("register.toLogin")}</Link>
            </p>
        </section>
    );
}
