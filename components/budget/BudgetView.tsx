import { useState } from "react";
import { t, text } from "@/lib/i18n";
import { translateText } from "@/lib/translate";
import type { BudgetCategory, BudgetItem, WeddingData } from "@/types/wedding";

type Props = {
  data: WeddingData;
  onDeleteBudgetItem: (id: string) => void;
  onSaveBudgetItem: (item: BudgetItem) => void;
  onUpdateBudgetItem: (
    id: string,
    patch: Partial<{ paid: boolean; selected: boolean; actualAmount?: number }>,
  ) => void;
};

type BudgetForm = {
  id?: string;
  amount: string;
  category: BudgetCategory;
  memo: string;
  paid: boolean;
  paymentDueDate: string;
  titleJa: string;
  titleKo: string;
};

const categories: BudgetCategory[] = ["package", "required", "optional", "discount"];

function makeId() {
  return `budget-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyForm(): BudgetForm {
  return {
    amount: "",
    category: "required",
    memo: "",
    paid: false,
    paymentDueDate: "",
    titleJa: "",
    titleKo: "",
  };
}

function money(value?: number) {
  if (typeof value !== "number") return "0원";
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function amountOf(item: BudgetItem, actualAmount?: number) {
  return actualAmount ?? item.amount ?? 0;
}

function categoryTitle(category: BudgetCategory, language: WeddingData["language"]) {
  if (category === "package") return t(language, "packageQuote");
  if (category === "required") return t(language, "requiredCost");
  if (category === "optional") return t(language, "optionalCost");
  return t(language, "discountBenefit");
}

export function BudgetView({ data, onDeleteBudgetItem, onSaveBudgetItem, onUpdateBudgetItem }: Props) {
  const language = data.language;
  const [form, setForm] = useState<BudgetForm>(() => emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [translationError, setTranslationError] = useState("");
  const [translating, setTranslating] = useState<"ko" | "ja" | "save" | null>(null);

  const payableItems = data.template.budget.filter((item) => {
    const state = data.userState.budget[item.id];
    if (item.category === "discount") return false;
    if (item.category === "package") return Boolean(state?.selected);
    return true;
  });
  const total = payableItems.reduce(
    (sum, item) => sum + amountOf(item, data.userState.budget[item.id]?.actualAmount),
    0,
  );
  const paidTotal = payableItems
    .filter((item) => data.userState.budget[item.id]?.paid || item.paid)
    .reduce((sum, item) => sum + amountOf(item, data.userState.budget[item.id]?.actualAmount), 0);
  const unpaidTotal = total - paidTotal;

  const startAdd = () => {
    setEditingId(null);
    setDeleteTargetId(null);
    setForm(emptyForm());
  };

  const startEdit = (item: BudgetItem) => {
    const state = data.userState.budget[item.id];
    setEditingId(item.id);
    setDeleteTargetId(null);
    setForm({
      id: item.id,
      amount: String(state?.actualAmount ?? item.amount ?? ""),
      category: item.category,
      memo: item.memo || item.note?.ko || "",
      paid: Boolean(state?.paid ?? item.paid),
      paymentDueDate: item.paymentDueDate || item.dueDate || "",
      titleJa: item.title.ja,
      titleKo: item.title.ko,
    });
  };

  const translateTitle = async (target: "ko" | "ja") => {
    const sourceText = target === "ja" ? form.titleKo : form.titleJa;
    if (!sourceText.trim()) return;
    setTranslationError("");
    setTranslating(target);
    try {
      const translated = await translateText(sourceText, target === "ja" ? "ko" : "ja", target);
      setForm((current) => ({
        ...current,
        [target === "ja" ? "titleJa" : "titleKo"]: translated,
      }));
    } catch {
      setTranslationError(t(language, "translationFailed"));
    } finally {
      setTranslating(null);
    }
  };

  const saveForm = async () => {
    let titleKo = form.titleKo.trim();
    let titleJa = form.titleJa.trim();
    if (!titleKo && !titleJa) return;
    setTranslationError("");
    setTranslating("save");

    try {
      if (!titleJa && titleKo) {
        titleJa = await translateText(titleKo, "ko", "ja");
      }
      if (!titleKo && titleJa) {
        titleKo = await translateText(titleJa, "ja", "ko");
      }
    } catch {
      setTranslationError(t(language, "translationFailed"));
      setTranslating(null);
      return;
    }

    const previous = editingId ? data.template.budget.find((item) => item.id === editingId) : undefined;
    const id = editingId || makeId();
    const amount = Number(form.amount || 0);
    onSaveBudgetItem({
      ...previous,
      amount,
      amountLabel: undefined,
      category: form.category,
      dueDate: form.paymentDueDate || undefined,
      id,
      memo: form.memo,
      paid: form.paid,
      paymentDueDate: form.paymentDueDate || undefined,
      title: { ko: titleKo, ja: titleJa },
    });
    onUpdateBudgetItem(id, { actualAmount: amount, paid: form.paid, selected: true });
    setEditingId(null);
    setForm(emptyForm());
    setTranslating(null);
  };

  return (
    <section className="grid min-w-0 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <article className="min-w-0 rounded-lg border border-sky-100 bg-white p-4 shadow-sm lg:sticky lg:top-32 lg:self-start">
        <p className="text-sm font-semibold text-stone-500">{t(language, "totalExpected")}</p>
        <p className="mt-2 break-words text-3xl font-semibold text-sky-600 sm:text-4xl">{money(total)}</p>
        <div className="mt-4 grid gap-2">
          <TotalPill label={t(language, "paidTotal")} value={money(paidTotal)} />
          <TotalPill label={t(language, "unpaidTotal")} value={money(unpaidTotal)} />
        </div>
      </article>

      <div className="min-w-0 space-y-4">
        <BudgetEditor
          data={data}
          editingId={editingId}
          form={form}
          onCancel={() => {
            setEditingId(null);
            setForm(emptyForm());
          }}
          onChange={setForm}
          onSave={saveForm}
          onStartAdd={startAdd}
          onTranslate={translateTitle}
          translating={translating}
          translationError={translationError}
        />

        {categories.map((category) => {
          const items = data.template.budget.filter((item) => item.category === category);
          return (
            <article key={category} className="min-w-0 rounded-lg border border-sky-100 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold">{categoryTitle(category, language)}</h2>
              <div className="mt-4 grid min-w-0 gap-3">
                {items.length ? (
                  items.map((item) => {
                    const state = data.userState.budget[item.id] || { paid: Boolean(item.paid), selected: true };
                    const dueDate = item.paymentDueDate || item.dueDate;
                    const amount = amountOf(item, state.actualAmount);
                    return (
                      <div key={item.id} className="min-w-0 rounded-md border border-stone-100 p-3">
                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="overflow-wrap-anywhere font-semibold">{text(item.title, language)}</h3>
                            <p className="mt-1 text-sm font-semibold text-stone-700">
                              {item.amountLabel ? text(item.amountLabel, language) : money(amount)}
                            </p>
                            {dueDate && <p className="mt-1 text-sm text-stone-500">{t(language, "paymentDueDate")}: {dueDate}</p>}
                            {(item.memo || item.note) && (
                              <p className="mt-2 overflow-wrap-anywhere rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-600">
                                {item.memo || (item.note ? text(item.note, language) : "")}
                              </p>
                            )}
                          </div>
                          <div className="grid shrink-0 gap-2 text-sm font-semibold text-stone-600">
                            {category === "package" && (
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  checked={Boolean(state.selected)}
                                  name="package"
                                  onChange={() => {
                                    data.template.budget
                                      .filter((budget) => budget.category === "package")
                                      .forEach((budget) => onUpdateBudgetItem(budget.id, { selected: budget.id === item.id }));
                                  }}
                                  className="h-4 w-4 accent-sky-500"
                                />
                                {t(language, "selected")}
                              </label>
                            )}
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={Boolean(state.paid)}
                                onChange={(event) => onUpdateBudgetItem(item.id, { paid: event.target.checked, selected: state.selected || category !== "package" })}
                                className="h-4 w-4 accent-sky-500"
                              />
                              {state.paid ? t(language, "paid") : t(language, "unpaid")}
                            </label>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="rounded-md border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700"
                          >
                            {t(language, "edit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(item.id)}
                            className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
                          >
                            {t(language, "delete")}
                          </button>
                        </div>
                        {deleteTargetId === item.id && (
                          <div className="mt-3 rounded-md bg-red-50 p-3">
                            <p className="text-sm font-semibold text-red-700">{t(language, "confirmDelete")}</p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteBudgetItem(item.id);
                                  setDeleteTargetId(null);
                                }}
                                className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                              >
                                {t(language, "delete")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTargetId(null)}
                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-stone-700"
                              >
                                {t(language, "cancel")}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-stone-500">{t(language, "noItems")}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BudgetEditor({
  data,
  editingId,
  form,
  onCancel,
  onChange,
  onSave,
  onStartAdd,
  onTranslate,
  translating,
  translationError,
}: {
  data: WeddingData;
  editingId: string | null;
  form: BudgetForm;
  onCancel: () => void;
  onChange: (form: BudgetForm) => void;
  onSave: () => void | Promise<void>;
  onStartAdd: () => void;
  onTranslate: (target: "ko" | "ja") => void | Promise<void>;
  translating: "ko" | "ja" | "save" | null;
  translationError: string;
}) {
  const language = data.language;
  return (
    <article className="min-w-0 rounded-lg border border-sky-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{editingId ? t(language, "edit") : t(language, "budgetAdd")}</h2>
        <button
          type="button"
          onClick={onStartAdd}
          className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
        >
          {t(language, "budgetAdd")}
        </button>
      </div>
      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
        <Field label={t(language, "titleKo")}>
          <div className="grid gap-2">
            <input value={form.titleKo} onChange={(event) => onChange({ ...form, titleKo: event.target.value })} className="w-full rounded-md border border-slate-200 px-3 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" />
            <button type="button" onClick={() => onTranslate("ko")} disabled={!form.titleJa.trim() || Boolean(translating)} className="rounded-md border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
              {translating === "ko" ? t(language, "translating") : t(language, "autoFillKo")}
            </button>
          </div>
        </Field>
        <Field label={t(language, "titleJa")}>
          <div className="grid gap-2">
            <input value={form.titleJa} onChange={(event) => onChange({ ...form, titleJa: event.target.value })} className="w-full rounded-md border border-slate-200 px-3 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" />
            <button type="button" onClick={() => onTranslate("ja")} disabled={!form.titleKo.trim() || Boolean(translating)} className="rounded-md border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
              {translating === "ja" ? t(language, "translating") : t(language, "autoFillJa")}
            </button>
          </div>
        </Field>
        <Field label={t(language, "amount")}>
          <input type="number" min="0" value={form.amount} onChange={(event) => onChange({ ...form, amount: event.target.value })} className="w-full rounded-md border border-slate-200 px-3 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        </Field>
        <Field label={t(language, "category")}>
          <select value={form.category} onChange={(event) => onChange({ ...form, category: event.target.value as BudgetCategory })} className="w-full rounded-md border border-slate-200 px-3 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100">
            {categories.map((category) => (
              <option key={category} value={category}>
                {categoryTitle(category, language)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t(language, "paymentDueDate")}>
          <input type="date" value={form.paymentDueDate} onChange={(event) => onChange({ ...form, paymentDueDate: event.target.value })} className="w-full rounded-md border border-slate-200 px-3 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-600">
          <input type="checkbox" checked={form.paid} onChange={(event) => onChange({ ...form, paid: event.target.checked })} className="h-4 w-4 accent-sky-500" />
          {t(language, "paid")}
        </label>
        <Field label={t(language, "memo")} wide>
          <textarea value={form.memo} onChange={(event) => onChange({ ...form, memo: event.target.value })} className="min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        </Field>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {translationError && <p className="text-sm font-semibold text-red-600 sm:col-span-2">{translationError}</p>}
        <button type="button" onClick={onSave} disabled={Boolean(translating)} className="rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {translating === "save" ? t(language, "translating") : t(language, "save")}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-stone-200 px-4 py-3 text-sm font-semibold text-stone-700">
          {t(language, "cancel")}
        </button>
      </div>
    </article>
  );
}

function Field({ children, label, wide }: { children: React.ReactNode; label: string; wide?: boolean }) {
  return (
    <label className={`grid min-w-0 gap-1 text-sm font-semibold text-stone-600 ${wide ? "sm:col-span-2" : ""}`}>
      {label}
      {children}
    </label>
  );
}

function TotalPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-stone-50 px-3 py-2">
      <p className="text-xs font-semibold text-stone-500">{label}</p>
      <p className="mt-1 break-words text-lg font-semibold text-stone-900">{value}</p>
    </div>
  );
}

