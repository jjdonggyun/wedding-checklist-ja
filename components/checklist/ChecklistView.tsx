import { useMemo, useState } from "react";
import { t, text } from "@/lib/i18n";
import type { ChecklistCategoryKey, ChecklistItemState, WeddingData } from "@/types/wedding";

type Props = {
  data: WeddingData;
  onUpdateItem: (id: string, patch: Partial<ChecklistItemState>) => void;
};

export function ChecklistView({ data, onUpdateItem }: Props) {
  const language = data.language;
  const [activeCategory, setActiveCategory] = useState<ChecklistCategoryKey>(
    data.template.categories[0]?.id || "confirmed",
  );
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const items = useMemo(
    () => data.template.checklist.filter((item) => item.categoryId === activeCategory),
    [activeCategory, data.template.checklist],
  );

  return (
    <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-lg border border-rose-100 bg-white p-3 shadow-sm lg:sticky lg:top-32 lg:self-start">
        <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {data.template.categories.map((category) => {
            const total = data.template.checklist.filter((item) => item.categoryId === category.id).length;
            const done = data.template.checklist.filter(
              (item) => item.categoryId === category.id && data.userState.checklist[item.id]?.completed,
            ).length;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`min-w-44 rounded-md px-3 py-3 text-left transition lg:min-w-0 ${
                  activeCategory === category.id ? "bg-rose-500 text-white" : "bg-stone-50 text-stone-700 hover:bg-rose-50"
                }`}
              >
                <span className="block text-sm font-semibold">{text(category.title, language)}</span>
                <span className={activeCategory === category.id ? "text-xs text-white/80" : "text-xs text-stone-400"}>
                  {done}/{total}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="space-y-3">
        {items.map((item) => {
          const state = data.userState.checklist[item.id] || { completed: false, memo: "", links: [] };
          const deadline = state.deadline || item.deadline;
          const isOpen = openItemId === item.id;
          const isDueSoon =
            deadline && !state.completed && new Date(deadline).getTime() - Date.now() <= 14 * 24 * 60 * 60 * 1000;

          return (
            <article
              key={item.id}
              className={`rounded-lg border bg-white p-4 shadow-sm transition ${
                state.completed ? "border-stone-100 opacity-55" : isDueSoon ? "border-amber-300" : "border-rose-100"
              }`}
            >
              <div className="flex gap-3">
                <input
                  type="checkbox"
                  checked={state.completed}
                  onChange={(event) => onUpdateItem(item.id, { completed: event.target.checked })}
                  className="mt-1 h-5 w-5 accent-rose-500"
                />
                <button type="button" onClick={() => setOpenItemId(isOpen ? null : item.id)} className="min-w-0 flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-base font-semibold ${state.completed ? "line-through" : ""}`}>
                      {text(item.title, language)}
                    </h3>
                    {(item.important || state.important) && <Badge>{t(language, "important")}</Badge>}
                    {item.undecided && <Badge tone="amber">{t(language, "undecided")}</Badge>}
                    {item.caution && <Badge tone="red">{t(language, "caution")}</Badge>}
                    {isDueSoon && <Badge tone="amber">{t(language, "dueSoon")}</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-stone-500">
                    {t(language, "recommendedTiming")}: {text(item.recommendedTiming, language)}
                    {deadline ? ` · ${t(language, "deadline")}: ${deadline}` : ""}
                  </p>
                </button>
              </div>

              {isOpen && (
                <div className="mt-4 grid gap-3 border-t border-stone-100 pt-4">
                  <label className="grid gap-1 text-sm font-semibold text-stone-600">
                    {t(language, "deadline")}
                    <input
                      type="date"
                      value={deadline || ""}
                      onChange={(event) => onUpdateItem(item.id, { deadline: event.target.value })}
                      className="rounded-md border border-stone-200 px-3 py-2 font-normal"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-stone-600">
                    {t(language, "memo")}
                    <textarea
                      value={state.memo || ""}
                      onChange={(event) => onUpdateItem(item.id, { memo: event.target.value })}
                      placeholder={item.defaultMemo ? text(item.defaultMemo, language) : ""}
                      className="min-h-24 rounded-md border border-stone-200 px-3 py-2 font-normal"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-stone-600">
                    {t(language, "links")}
                    <input
                      value={(state.links || []).join(", ")}
                      onChange={(event) =>
                        onUpdateItem(item.id, {
                          links: event.target.value.split(",").map((link) => link.trim()).filter(Boolean),
                        })
                      }
                      className="rounded-md border border-stone-200 px-3 py-2 font-normal"
                    />
                  </label>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Badge({ children, tone = "rose" }: { children: React.ReactNode; tone?: "rose" | "amber" | "red" }) {
  const styles = {
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    red: "bg-red-50 text-red-700 ring-red-100",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${styles[tone]}`}>{children}</span>;
}
