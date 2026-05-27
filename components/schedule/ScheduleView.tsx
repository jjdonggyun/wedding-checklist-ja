import { t, text } from "@/lib/i18n";
import type { WeddingData } from "@/types/wedding";

export function ScheduleView({ data }: { data: WeddingData }) {
  const language = data.language;
  const locale = language === "ko" ? "ko-KR" : "ja-JP";
  const items = [...data.template.schedule].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const monthly = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = new Date(item.startsAt).toLocaleDateString(locale, { year: "numeric", month: "long" });
    acc[key] = [...(acc[key] || []), item];
    return acc;
  }, {});

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
      <article className="rounded-lg border border-rose-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t(language, "timeline")}</h2>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-md bg-stone-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{text(item.title, language)}</h3>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-stone-500 ring-1 ring-stone-200">
                  {item.type}
                </span>
              </div>
              <p className="mt-2 text-sm text-stone-600">
                {new Date(item.startsAt).toLocaleString(locale)}
                {item.endsAt ? ` - ${new Date(item.endsAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}` : ""}
              </p>
              {item.location && <p className="mt-1 text-sm text-stone-500">{text(item.location, language)}</p>}
            </div>
          ))}
        </div>
      </article>
      <article className="rounded-lg border border-rose-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t(language, "monthView")}</h2>
        <div className="mt-4 space-y-4">
          {Object.entries(monthly).map(([month, monthItems]) => (
            <div key={month}>
              <h3 className="text-sm font-semibold text-rose-600">{month}</h3>
              <ul className="mt-2 space-y-2">
                {monthItems.map((item) => (
                  <li key={item.id} className="rounded-md border border-stone-100 px-3 py-2 text-sm">
                    {text(item.title, language)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
