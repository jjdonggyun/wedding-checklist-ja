import { t, text } from "@/lib/i18n";
import type { BudgetCategory, WeddingData } from "@/types/wedding";

type Props = {
  data: WeddingData;
  onUpdateBudgetItem: (
    id: string,
    patch: Partial<{ paid: boolean; selected: boolean; actualAmount?: number }>,
  ) => void;
};

const categories: BudgetCategory[] = ["package", "required", "optional", "discount"];

function money(value?: number) {
  if (typeof value !== "number") return "";
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

export function BudgetView({ data, onUpdateBudgetItem }: Props) {
  const language = data.language;
  const selectedItems = data.template.budget.filter((item) => {
    const state = data.userState.budget[item.id];
    return item.required || state?.selected || item.category === "package" && state?.selected;
  });
  const total = selectedItems.reduce((sum, item) => sum + (data.userState.budget[item.id]?.actualAmount ?? item.amount ?? 0), 0);

  return (
    <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <article className="rounded-lg border border-rose-100 bg-white p-5 shadow-sm lg:sticky lg:top-32 lg:self-start">
        <p className="text-sm font-semibold text-stone-500">{t(language, "selectedExpected")}</p>
        <p className="mt-2 text-4xl font-semibold text-rose-600">{money(total)}</p>
        <p className="mt-3 text-sm text-stone-500">{t(language, "paymentSchedule")}</p>
        <ul className="mt-3 space-y-2">
          {data.template.budget.filter((item) => item.dueDate).map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-md bg-stone-50 px-3 py-2 text-sm">
              <span>{text(item.title, language)}</span>
              <span className="text-stone-500">{item.dueDate}</span>
            </li>
          ))}
        </ul>
      </article>

      <div className="space-y-4">
        {categories.map((category) => {
          const items = data.template.budget.filter((item) => item.category === category);
          const titleKey =
            category === "package"
              ? "packageQuote"
              : category === "required"
                ? "requiredCost"
                : category === "optional"
                  ? "optionalCost"
                  : "discountBenefit";
          return (
            <article key={category} className="rounded-lg border border-rose-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">{t(language, titleKey)}</h2>
              <div className="mt-4 space-y-3">
                {items.map((item) => {
                  const state = data.userState.budget[item.id] || { paid: false, selected: false };
                  return (
                    <div key={item.id} className="rounded-md border border-stone-100 p-3">
                      <div className="flex items-start gap-3">
                        <input
                          type={category === "package" ? "radio" : "checkbox"}
                          name={category === "package" ? "package" : item.id}
                          checked={Boolean(state.selected || item.required)}
                          disabled={item.required}
                          onChange={(event) => {
                            if (category === "package") {
                              data.template.budget
                                .filter((budget) => budget.category === "package")
                                .forEach((budget) => onUpdateBudgetItem(budget.id, { selected: budget.id === item.id }));
                              return;
                            }
                            onUpdateBudgetItem(item.id, { selected: event.target.checked });
                          }}
                          className="mt-1 h-5 w-5 accent-rose-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-semibold">{text(item.title, language)}</h3>
                            <span className="font-semibold text-stone-700">{item.amountLabel ? text(item.amountLabel, language) : money(item.amount)}</span>
                          </div>
                          {item.note && <p className="mt-1 text-sm text-stone-500">{text(item.note, language)}</p>}
                          {item.dueDate && <p className="mt-1 text-sm text-stone-500">{t(language, "deadline")}: {item.dueDate}</p>}
                          <label className="mt-3 flex items-center gap-2 text-sm text-stone-600">
                            <input
                              type="checkbox"
                              checked={Boolean(state.paid)}
                              onChange={(event) => onUpdateBudgetItem(item.id, { paid: event.target.checked })}
                              className="h-4 w-4 accent-stone-900"
                            />
                            {t(language, "paid")}
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
