import { useState } from "react";
import { t, text } from "@/lib/i18n";
import type { WeddingData } from "@/types/wedding";

type Props = {
  data: WeddingData;
  onOpenView: (view: "checklist" | "budget" | "schedule") => void;
};

const dayMs = 24 * 60 * 60 * 1000;

function daysUntil(dateTime: string) {
  const target = new Date(dateTime);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / dayMs);
}

function ddayLabel(days: number, language: WeddingData["language"]) {
  if (days === 0) return t(language, "today");
  return days > 0 ? `${t(language, "daysBefore")}${days}` : `${t(language, "daysAfter")}${Math.abs(days)}`;
}

function money(value?: number) {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function Dashboard({ data, onOpenView }: Props) {
  const language = data.language;
  const completed = data.template.checklist.filter(
    (item) => data.userState.checklist[item.id]?.completed,
  ).length;
  const total = data.template.checklist.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const [now] = useState(() => Date.now());
  const soon = data.template.checklist
    .filter((item) => !data.userState.checklist[item.id]?.completed)
    .filter((item) => {
      const dueDate = data.userState.checklist[item.id]?.deadline || item.dueDate || item.deadline;
      return dueDate && new Date(dueDate).getTime() - now <= 30 * dayMs;
    })
    .slice(0, 6);
  const undecided = data.template.checklist.filter(
    (item) => item.undecided && !data.userState.checklist[item.id]?.completed,
  );
  const payments = data.template.budget
    .filter((item) => (item.paymentDueDate || item.dueDate) && !data.userState.budget[item.id]?.paid)
    .slice(0, 5);
  const budgetItems = data.template.budget.filter((item) => {
    if (item.category === "discount") return false;
    if (item.category === "package") return Boolean(data.userState.budget[item.id]?.selected);
    return true;
  });
  const expectedTotal = budgetItems.reduce(
    (sum, item) => sum + (data.userState.budget[item.id]?.actualAmount ?? item.amount ?? 0),
    0,
  );

  return (
    <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="grid gap-4 sm:grid-cols-2">
        <DdayCard
          label={t(language, "weddingDay")}
          value={ddayLabel(daysUntil(data.profile.weddingDateTime), language)}
          sub={`${new Date(data.profile.weddingDateTime).toLocaleString(language === "ko" ? "ko-KR" : "ja-JP")} · ${text(data.profile.weddingVenue, language)}`}
        />
        <DdayCard
          label={t(language, "photoDay")}
          value={ddayLabel(daysUntil(data.profile.photoDateTime), language)}
          sub={`${new Date(data.profile.photoDateTime).toLocaleString(language === "ko" ? "ko-KR" : "ja-JP")} · ${text(data.profile.photoVendor, language)}`}
        />
        <article className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm sm:col-span-2">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-stone-500">{t(language, "progress")}</p>
              <p className="mt-1 text-3xl font-semibold sm:text-4xl">{progress}%</p>
            </div>
            <p className="text-sm text-stone-500">
              {completed}/{total} {t(language, "completed")}
            </p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-sky-100">
            <div className="h-full rounded-full bg-sky-500" style={{ width: `${progress}%` }} />
          </div>
        </article>
        <article className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm sm:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t(language, "totalExpected")}</h2>
            <button className="text-sm font-semibold text-sky-600" onClick={() => onOpenView("budget")}>
              {t(language, "budget")}
            </button>
          </div>
          <p className="mt-3 text-2xl font-semibold">
            {expectedTotal ? `${money(expectedTotal)}원` : "-"}
          </p>
        </article>
      </div>

      <div className="grid gap-4">
        <SummaryList title={t(language, "upcomingTasks")} items={soon.map((item) => text(item.title, language))} onClick={() => onOpenView("checklist")} />
        <SummaryList title={t(language, "undecidedItems")} items={undecided.slice(0, 6).map((item) => text(item.title, language))} onClick={() => onOpenView("checklist")} count={undecided.length} />
        <SummaryList title={t(language, "upcomingPayments")} items={payments.map((item) => text(item.title, language))} onClick={() => onOpenView("budget")} />
      </div>
    </section>
  );
}

function DdayCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <article className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-stone-500">{label}</p>
      <p className="mt-2 break-words text-3xl font-semibold text-sky-600 sm:text-4xl">{value}</p>
      <p className="mt-3 overflow-wrap-anywhere text-sm leading-6 text-stone-600">{sub}</p>
    </article>
  );
}

function SummaryList({
  title,
  items,
  onClick,
  count,
  danger,
}: {
  title: string;
  items: string[];
  onClick: () => void;
  count?: number;
  danger?: boolean;
}) {
  return (
    <article className="rounded-lg border border-sky-100 bg-white p-4 shadow-sm">
      <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-3 text-left">
        <h2 className="text-base font-semibold">{title}</h2>
        {typeof count === "number" && <span className="text-sm text-stone-500">{count}</span>}
      </button>
      <ul className="mt-3 space-y-2">
        {items.length ? (
          items.map((item) => (
            <li key={item} className={`overflow-wrap-anywhere rounded-md px-3 py-2 text-sm ${danger ? "bg-red-50 text-red-700" : "bg-stone-50 text-stone-700"}`}>
              {item}
            </li>
          ))
        ) : (
          <li className="text-sm text-stone-400">-</li>
        )}
      </ul>
    </article>
  );
}

