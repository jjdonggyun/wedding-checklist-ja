import { useMemo, useState } from "react";
import { t, text } from "@/lib/i18n";
import { translateText } from "@/lib/translate";
import type { ChecklistCategoryKey, ChecklistItem, ChecklistItemState, WeddingData } from "@/types/wedding";

type Props = {
  data: WeddingData;
  onDeleteItem: (id: string) => void;
  onSaveItem: (item: ChecklistItem, statePatch?: Partial<ChecklistItemState>) => void;
  onUpdateItem: (id: string, patch: Partial<ChecklistItemState>) => void;
};

type ChecklistForm = {
  id?: string;
  categoryId: ChecklistCategoryKey;
  titleKo: string;
  titleJa: string;
  dueDate: string;
  memo: string;
  important: boolean;
};

function makeId() {
  return `check-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyForm(categoryId: ChecklistCategoryKey): ChecklistForm {
  return {
    categoryId,
    dueDate: "",
    important: false,
    memo: "",
    titleJa: "",
    titleKo: "",
  };
}

export function ChecklistView({ data, onDeleteItem, onSaveItem, onUpdateItem }: Props) {
  const language = data.language;
  const [activeCategory, setActiveCategory] = useState<ChecklistCategoryKey>(
    data.template.categories[0]?.id || "confirmed",
  );
  const [form, setForm] = useState<ChecklistForm>(() => emptyForm(activeCategory));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const [translationError, setTranslationError] = useState("");
  const [translating, setTranslating] = useState<"ko" | "ja" | "save" | null>(null);

  const items = useMemo(
    () => data.template.checklist.filter((item) => item.categoryId === activeCategory),
    [activeCategory, data.template.checklist],
  );

  const startAdd = () => {
    setEditingId(null);
    setDeleteTargetId(null);
    setIsAddOpen(true);
    setForm(emptyForm(activeCategory));
  };

  const startEdit = (item: ChecklistItem) => {
    const state = data.userState.checklist[item.id];
    setEditingId(item.id);
    setIsAddOpen(false);
    setDeleteTargetId(null);
    setForm({
      id: item.id,
      categoryId: item.categoryId,
      dueDate: state?.deadline || item.dueDate || item.deadline || "",
      important: Boolean(state?.important ?? item.important),
      memo: state?.memo || item.memo || item.defaultMemo?.ko || "",
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
    let trimmedKo = form.titleKo.trim();
    let trimmedJa = form.titleJa.trim();
    if (!trimmedKo && !trimmedJa) return;
    setTranslationError("");
    setTranslating("save");

    try {
      if (!trimmedJa && trimmedKo) {
        trimmedJa = await translateText(trimmedKo, "ko", "ja");
      }
      if (!trimmedKo && trimmedJa) {
        trimmedKo = await translateText(trimmedJa, "ja", "ko");
      }
    } catch {
      setTranslationError(t(language, "translationFailed"));
      setTranslating(null);
      return;
    }

    const previous = editingId
      ? data.template.checklist.find((item) => item.id === editingId)
      : undefined;
    const id = editingId || makeId();
    onSaveItem({
      ...previous,
      categoryId: form.categoryId,
      deadline: form.dueDate || undefined,
      dueDate: form.dueDate || undefined,
      id,
      important: form.important,
      links: previous?.links || [],
      memo: form.memo,
      recommendedTiming: previous?.recommendedTiming || { ko: "직접 추가한 항목", ja: "手動追加項目" },
      title: { ko: trimmedKo, ja: trimmedJa },
    }, {
      completed: data.userState.checklist[id]?.completed || false,
      deadline: form.dueDate || undefined,
      important: form.important,
      links: data.userState.checklist[id]?.links || [],
      memo: form.memo,
    });
    setActiveCategory(form.categoryId);
    setEditingId(null);
    setIsAddOpen(false);
    setForm(emptyForm(form.categoryId));
    setTranslating(null);
  };

  return (
    <section className="grid min-w-0 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-lg border border-sky-100 bg-white p-3 shadow-sm lg:sticky lg:top-32 lg:self-start">
        <div className="flex max-w-full gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {data.template.categories.map((category) => {
            const total = data.template.checklist.filter((item) => item.categoryId === category.id).length;
            const done = data.template.checklist.filter(
              (item) => item.categoryId === category.id && data.userState.checklist[item.id]?.completed,
            ).length;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setActiveCategory(category.id);
                  setForm((current) => ({ ...current, categoryId: category.id }));
                }}
                className={`min-w-36 max-w-44 shrink-0 whitespace-normal break-keep rounded-md px-3 py-3 text-left transition lg:max-w-none ${
                  activeCategory === category.id ? "bg-sky-500 text-white" : "bg-stone-50 text-stone-700 hover:bg-sky-50"
                }`}
              >
                <span className="block text-sm font-semibold leading-5">{text(category.title, language)}</span>
                <span className={activeCategory === category.id ? "text-xs text-white/80" : "text-xs text-stone-400"}>
                  {done}/{total}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="min-w-0 space-y-4">
        <article className="min-w-0 rounded-lg border border-sky-100 bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={() => {
              if (isAddOpen) {
                setIsAddOpen(false);
                setForm(emptyForm(activeCategory));
              } else {
                startAdd();
              }
            }}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span className="text-lg font-semibold">{t(language, "itemAdd")}</span>
            <span className="rounded-md bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
              {isAddOpen ? t(language, "cancel") : t(language, "add")}
            </span>
          </button>
          {isAddOpen && (
            <div className="mt-4 border-t border-sky-100 pt-4">
              <ChecklistEditor
                data={data}
                form={form}
                onCancel={() => {
                  setIsAddOpen(false);
                  setForm(emptyForm(activeCategory));
                }}
                onChange={setForm}
                onSave={saveForm}
                onTranslate={translateTitle}
                translating={translating}
                translationError={translationError}
              />
            </div>
          )}
        </article>

        <div className="space-y-3">
          {items.length ? (
            items.map((item) => {
              const state = data.userState.checklist[item.id] || { completed: false, memo: "", links: [] };
              const deadline = state.deadline || item.dueDate || item.deadline;
              const isDueSoon =
                deadline && !state.completed && new Date(deadline).getTime() - now <= 14 * 24 * 60 * 60 * 1000;

              return (
                <article
                  key={item.id}
                  className={`min-w-0 rounded-lg border bg-white p-4 shadow-sm transition ${
                    state.completed ? "border-stone-100 opacity-55" : isDueSoon ? "border-amber-300" : "border-sky-100"
                  }`}
                >
                  <div className="flex min-w-0 gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(state.completed)}
                      onChange={(event) => onUpdateItem(item.id, { completed: event.target.checked })}
                      className="mt-1 h-5 w-5 shrink-0 accent-sky-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h3 className={`min-w-0 overflow-wrap-anywhere text-base font-semibold ${state.completed ? "line-through" : ""}`}>
                          {text(item.title, language)}
                        </h3>
                        {(item.important || state.important) && <Badge>{t(language, "important")}</Badge>}
                        {item.undecided && <Badge tone="amber">{t(language, "undecided")}</Badge>}
                        {isDueSoon && <Badge tone="amber">{t(language, "dueSoon")}</Badge>}
                      </div>
                      <p className="mt-2 overflow-wrap-anywhere text-sm leading-6 text-stone-500">
                        {t(language, "recommendedTiming")}: {text(item.recommendedTiming, language)}
                        {deadline ? ` · ${t(language, "deadline")}: ${deadline}` : ""}
                      </p>
                      {(state.memo || item.memo) && (
                        <p className="mt-2 overflow-wrap-anywhere rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-600">
                          {state.memo || item.memo}
                        </p>
                      )}
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="rounded-md border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700"
                        >
                          {t(language, "edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateItem(item.id, { important: !Boolean(state.important ?? item.important) })}
                          className="rounded-md border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-700"
                        >
                          {t(language, "important")}
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
                                onDeleteItem(item.id);
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
                      {editingId === item.id && (
                        <div className="mt-4 border-t border-sky-100 pt-4">
                          <ChecklistEditor
                            data={data}
                            form={form}
                            onCancel={() => {
                              setEditingId(null);
                              setForm(emptyForm(activeCategory));
                            }}
                            onChange={setForm}
                            onSave={saveForm}
                            onTranslate={translateTitle}
                            translating={translating}
                            translationError={translationError}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="rounded-lg border border-sky-100 bg-white p-4 text-sm text-stone-500 shadow-sm">
              {t(language, "noItems")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function ChecklistEditor({
  data,
  form,
  onCancel,
  onChange,
  onSave,
  onTranslate,
  translating,
  translationError,
}: {
  data: WeddingData;
  form: ChecklistForm;
  onCancel: () => void;
  onChange: (form: ChecklistForm) => void;
  onSave: () => void | Promise<void>;
  onTranslate: (target: "ko" | "ja") => void | Promise<void>;
  translating: "ko" | "ja" | "save" | null;
  translationError: string;
}) {
  const language = data.language;
  return (
    <div className="min-w-0">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <Field label={t(language, "titleKo")}>
          <div className="grid gap-2">
            <input
              value={form.titleKo}
              onChange={(event) => onChange({ ...form, titleKo: event.target.value })}
              className="w-full rounded-md border border-slate-200 px-3 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
            <button
              type="button"
              onClick={() => onTranslate("ko")}
              disabled={!form.titleJa.trim() || Boolean(translating)}
              className="rounded-md border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {translating === "ko" ? t(language, "translating") : t(language, "autoFillKo")}
            </button>
          </div>
        </Field>
        <Field label={t(language, "titleJa")}>
          <div className="grid gap-2">
            <input
              value={form.titleJa}
              onChange={(event) => onChange({ ...form, titleJa: event.target.value })}
              className="w-full rounded-md border border-slate-200 px-3 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
            <button
              type="button"
              onClick={() => onTranslate("ja")}
              disabled={!form.titleKo.trim() || Boolean(translating)}
              className="rounded-md border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {translating === "ja" ? t(language, "translating") : t(language, "autoFillJa")}
            </button>
          </div>
        </Field>
        <Field label={t(language, "category")}>
          <select
            value={form.categoryId}
            onChange={(event) => onChange({ ...form, categoryId: event.target.value })}
            className="w-full rounded-md border border-slate-200 px-3 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          >
            {data.template.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {text(category.title, language)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t(language, "deadline")}>
          <input
            type="date"
            value={form.dueDate}
            onChange={(event) => onChange({ ...form, dueDate: event.target.value })}
            className="w-full rounded-md border border-slate-200 px-3 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </Field>
        <Field label={t(language, "memo")} wide>
          <textarea
            value={form.memo}
            onChange={(event) => onChange({ ...form, memo: event.target.value })}
            className="min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-600">
          <input
            type="checkbox"
            checked={form.important}
            onChange={(event) => onChange({ ...form, important: event.target.checked })}
            className="h-4 w-4 accent-sky-500"
          />
          {t(language, "important")}
        </label>
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
    </div>
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

function Badge({ children, tone = "sky" }: { children: React.ReactNode; tone?: "sky" | "amber" }) {
  const styles = {
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  };
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${styles[tone]}`}>{children}</span>;
}

