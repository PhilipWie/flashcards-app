import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { DayCount } from "../../types/Stats";

type ActivityChartProps = {
    days: DayCount[];
    today: string;
};

// "2026-11-27" as a local date (not new Date(iso): that is UTC and can show the previous day)
function toDate(iso: string): Date {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function answersText(day: DayCount, t: TFunction): string {
    const total = day.correct + day.wrong;
    if (total === 0) return t("activity.none");
    return t("activity.answers", { count: total, correct: day.correct, wrong: day.wrong });
}

// Bar chart without a library: one column per day, stacked "knew it" / "didn't know".
// The bars are hidden from screen readers, every day has its numbers as text instead.
export default function ActivityChart({ days, today }: ActivityChartProps) {
    const max = Math.max(1, ...days.map((d) => d.correct + d.wrong));
    const { t, i18n } = useTranslation();
    // weekday names in the UI language
    const weekday = new Intl.DateTimeFormat(i18n.language, { weekday: "short" });
    const longDate = new Intl.DateTimeFormat(i18n.language, { weekday: "long", day: "numeric", month: "long" });

    return (
        <div className="activity">
            <ol className="activity__days">
                {days.map((day) => {
                    const total = day.correct + day.wrong;
                    return (
                        <li key={day.date} className="activity__day" aria-current={day.date === today ? "date" : undefined}>
                            <span className="activity__bar" aria-hidden="true" style={{ height: `${(total / max) * 100}%` }}>
                                {day.wrong > 0 && (
                                    <span className="activity__part activity__part--wrong" style={{ flexGrow: day.wrong }} />
                                )}
                                {day.correct > 0 && (
                                    <span className="activity__part activity__part--correct" style={{ flexGrow: day.correct }} />
                                )}
                            </span>
                            <span className="activity__label" aria-hidden="true">
                                {weekday.format(toDate(day.date))}
                            </span>
                            <span className="visually-hidden">
                                {longDate.format(toDate(day.date))}: {answersText(day, t)}
                            </span>
                        </li>
                    );
                })}
            </ol>
            <ul className="activity__legend" aria-hidden="true">
                <li>
                    <span className="activity__dot activity__part--correct" /> {t("activity.known")}
                </li>
                <li>
                    <span className="activity__dot activity__part--wrong" /> {t("activity.unknown")}
                </li>
            </ul>
        </div>
    );
}
