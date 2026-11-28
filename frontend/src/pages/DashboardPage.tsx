import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Trans, useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { ArrowLeft, CalendarClock, Flame, GraduationCap, Target } from "lucide-react";
import type { Stats } from "../types/Stats";
import { getStats } from "../api/stats";
import { useApiError } from "../hooks/useApiError";
import ActivityChart from "../features/stats/ActivityChart";
import { BoxCountsBar } from "../features/cards/BoxBar";

function percent(value: number | null, t: TFunction): string {
    return value === null ? "–" : t("dashboard.percent", { value });
}

// learning statistics of all decks
export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const handleApiError = useApiError();
    const { t } = useTranslation();

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
            <ArrowLeft aria-hidden="true" /> {t("common.allDecks")}
        </Link>
    );

    if (!stats) {
        return (
            <div className="stack">
                {backLink}
                <h1>{t("dashboard.title")}</h1>
                {error ? (
                    <p className="notice notice--error" role="alert">
                        {error}
                    </p>
                ) : (
                    <p className="text-muted" role="status">
                        {t("dashboard.loading")}
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
                    <h1>{t("dashboard.title")}</h1>
                    <p className="text-muted">{t("dashboard.subtitle")}</p>
                </div>
            </header>

            <ul className="stat-tiles">
                <li className="panel glass stat-tile">
                    <Flame aria-hidden="true" className="stat-tile__icon" />
                    <span className="stat-tile__value">{stats.streak}</span>
                    <span className="stat-tile__label">{t("dashboard.streak", { count: stats.streak })}</span>
                </li>
                <li className="panel glass stat-tile">
                    <Target aria-hidden="true" className="stat-tile__icon" />
                    <span className="stat-tile__value">{percent(stats.period.accuracy, t)}</span>
                    <span className="stat-tile__label">
                        {t("dashboard.accuracy", { days: stats.period.days })}
                        <span className="stat-tile__hint">
                            {t("dashboard.accuracyTotal", { value: percent(stats.total.accuracy, t) })}
                        </span>
                    </span>
                </li>
                <li className="panel glass stat-tile">
                    <GraduationCap aria-hidden="true" className="stat-tile__icon" />
                    <span className="stat-tile__value">
                        {stats.cards.learned}
                        <span className="stat-tile__of"> / {stats.cards.total}</span>
                    </span>
                    <span className="stat-tile__label">{t("dashboard.learned")}</span>
                </li>
                <li className="panel glass stat-tile">
                    <CalendarClock aria-hidden="true" className="stat-tile__icon" />
                    <span className="stat-tile__value">{stats.cards.due}</span>
                    <span className="stat-tile__label">{t("dashboard.due", { count: stats.cards.due })}</span>
                </li>
            </ul>

            <section className="panel glass" aria-labelledby="activity-title">
                <h2 id="activity-title" className="panel__title">
                    {t("dashboard.activityTitle", { days: stats.period.days })}
                </h2>
                {noAnswers ? (
                    <p className="text-muted">{t("dashboard.noAnswers")}</p>
                ) : (
                    <ActivityChart days={stats.days} today={stats.today} />
                )}
                <p className="text-muted stat-note">{t("dashboard.practiceNote")}</p>
            </section>

            <section className="panel glass" aria-labelledby="boxes-title">
                <h2 id="boxes-title" className="panel__title">
                    {t("dashboard.boxesTitle")}
                </h2>
                {stats.cards.total === 0 ? (
                    <p className="text-muted">
                        <Trans i18nKey="dashboard.noCards" components={{ link: <Link to="/decks" /> }} />
                    </p>
                ) : (
                    <BoxCountsBar counts={stats.cards.boxes} />
                )}
            </section>
        </div>
    );
}
