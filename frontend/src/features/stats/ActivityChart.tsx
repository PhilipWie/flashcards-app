import type { DayCount } from "../../types/Stats";

type ActivityChartProps = {
    days: DayCount[];
    today: string;
};

const weekday = new Intl.DateTimeFormat("de-DE", { weekday: "short" });
const longDate = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long" });

// "2026-11-27" as a local date (not new Date(iso): that is UTC and can show the previous day)
function toDate(iso: string): Date {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function answersText(day: DayCount): string {
    const total = day.correct + day.wrong;
    if (total === 0) return "keine Antworten";
    return `${total} ${total === 1 ? "Antwort" : "Antworten"}, ${day.correct} gewusst, ${day.wrong} nicht gewusst`;
}

// Bar chart without a library: one column per day, stacked "gewusst" / "nicht gewusst".
// The bars are hidden from screen readers, every day has its numbers as text instead.
export default function ActivityChart({ days, today }: ActivityChartProps) {
    const max = Math.max(1, ...days.map((d) => d.correct + d.wrong));

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
                                {longDate.format(toDate(day.date))}: {answersText(day)}
                            </span>
                        </li>
                    );
                })}
            </ol>
            <ul className="activity__legend" aria-hidden="true">
                <li>
                    <span className="activity__dot activity__part--correct" /> gewusst
                </li>
                <li>
                    <span className="activity__dot activity__part--wrong" /> nicht gewusst
                </li>
            </ul>
        </div>
    );
}
