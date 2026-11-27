import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, CalendarClock, Flame, GraduationCap, Target } from "lucide-react";
import type { Stats } from "../types/Stats";
import { getStats } from "../api/stats";
import { useApiError } from "../hooks/useApiError";
import ActivityChart from "../features/stats/ActivityChart";
import { BoxCountsBar } from "../features/cards/BoxBar";

function percent(value: number | null): string {
    return value === null ? "–" : `${value} %`;
}

// learning statistics of all decks
export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const handleApiError = useApiError();

    useEffect(() => {
        let ignore = false;
        getStats()
            .then((data) => {
                if (!ignore) setStats(data);
            })
            .catch((err) => {
                if (!ignore) setError(handleApiError(err));
            });
        return () => {
            ignore = true;
        };
    }, [handleApiError]);

    const backLink = (
        <Link to="/decks" className="back-link">
            <ArrowLeft aria-hidden="true" /> Alle Stapel
        </Link>
    );

    if (!stats) {
        return (
            <div className="stack">
                {backLink}
                <h1>Dashboard</h1>
                {error ? (
                    <p className="notice notice--error" role="alert">
                        {error}
                    </p>
                ) : (
                    <p className="text-muted" role="status">
                        Statistik wird geladen …
                    </p>
                )}
            </div>
        );
    }

    const noAnswers = stats.total.answers === 0;

    return (
        <div className="stack">
            {backLink}
            <header className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="text-muted">Dein Lernfortschritt über alle Stapel</p>
                </div>
            </header>

            <ul className="stat-tiles">
                <li className="panel glass stat-tile">
                    <Flame aria-hidden="true" className="stat-tile__icon" />
                    <span className="stat-tile__value">{stats.streak}</span>
                    <span className="stat-tile__label">{stats.streak === 1 ? "Tag in Folge" : "Tage in Folge"}</span>
                </li>
                <li className="panel glass stat-tile">
                    <Target aria-hidden="true" className="stat-tile__icon" />
                    <span className="stat-tile__value">{percent(stats.period.accuracy)}</span>
                    <span className="stat-tile__label">
                        gewusst in {stats.period.days} Tagen
                        <span className="stat-tile__hint">gesamt {percent(stats.total.accuracy)}</span>
                    </span>
                </li>
                <li className="panel glass stat-tile">
                    <GraduationCap aria-hidden="true" className="stat-tile__icon" />
                    <span className="stat-tile__value">
                        {stats.cards.learned}
                        <span className="stat-tile__of"> / {stats.cards.total}</span>
                    </span>
                    <span className="stat-tile__label">Karten gelernt (Fach 5)</span>
                </li>
                <li className="panel glass stat-tile">
                    <CalendarClock aria-hidden="true" className="stat-tile__icon" />
                    <span className="stat-tile__value">{stats.cards.due}</span>
                    <span className="stat-tile__label">{stats.cards.due === 1 ? "Karte heute fällig" : "Karten heute fällig"}</span>
                </li>
            </ul>

            <section className="panel glass" aria-labelledby="activity-title">
                <h2 id="activity-title" className="panel__title">
                    Antworten der letzten {stats.period.days} Tage
                </h2>
                {noAnswers ? (
                    <p className="text-muted">
                        Noch keine Antworten. Sobald du im Lernmodus Karten beantwortest, erscheint hier dein Verlauf.
                    </p>
                ) : (
                    <ActivityChart days={stats.days} today={stats.today} />
                )}
                <p className="text-muted stat-note">Gezählt werden Antworten im Lernmodus, nicht beim freien Üben.</p>
            </section>

            <section className="panel glass" aria-labelledby="boxes-title">
                <h2 id="boxes-title" className="panel__title">
                    Karten nach Fach
                </h2>
                {stats.cards.total === 0 ? (
                    <p className="text-muted">
                        Noch keine Karten. <Link to="/decks">Leg einen Stapel an</Link> und füge Karten hinzu.
                    </p>
                ) : (
                    <BoxCountsBar counts={stats.cards.boxes} />
                )}
            </section>
        </div>
    );
}
