"use client";

import { useEffect, useState } from "react";
import { BudgetView } from "@/components/budget/BudgetView";
import { ChecklistView } from "@/components/checklist/ChecklistView";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ScheduleView } from "@/components/schedule/ScheduleView";
import { SettingsView } from "@/components/settings/SettingsView";
import { defaultWeddingData } from "@/lib/defaultWeddingData";
import { t } from "@/lib/i18n";
import { localWeddingRepository } from "@/lib/storage";
import type {
  BudgetItem,
  ChecklistItem,
  ChecklistItemState,
  CoupleProfile,
  Language,
  WeddingData,
} from "@/types/wedding";

type ViewKey = "dashboard" | "checklist" | "schedule" | "budget" | "settings";

const views: ViewKey[] = ["dashboard", "checklist", "schedule", "budget", "settings"];

export function WeddingPlannerApp() {
  const [data, setData] = useState<WeddingData>(defaultWeddingData);
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");

  useEffect(() => {
    setData(localWeddingRepository.load());
  }, []);

  const saveData = (next: WeddingData) => {
    setData(next);
    localWeddingRepository.save(next);
  };

  const setLanguage = (language: Language) => {
    saveData({ ...data, language });
  };

  const updateChecklistItem = (id: string, patch: Partial<ChecklistItemState>) => {
    const current = data.userState.checklist[id] || { completed: false, memo: "", links: [] };
    saveData({
      ...data,
      userState: {
        ...data.userState,
        checklist: {
          ...data.userState.checklist,
          [id]: { ...current, ...patch },
        },
      },
    });
  };

  const saveChecklistItem = (item: ChecklistItem, statePatch?: Partial<ChecklistItemState>) => {
    const exists = data.template.checklist.some((current) => current.id === item.id);
    const currentState = data.userState.checklist[item.id] || { completed: false, memo: "", links: [] };
    saveData({
      ...data,
      template: {
        ...data.template,
        checklist: exists
          ? data.template.checklist.map((current) => (current.id === item.id ? item : current))
          : [item, ...data.template.checklist],
      },
      userState: {
        ...data.userState,
        checklist: {
          ...data.userState.checklist,
          [item.id]: { ...currentState, ...statePatch },
        },
      },
    });
  };

  const deleteChecklistItem = (id: string) => {
    const { [id]: _removed, ...nextChecklistState } = data.userState.checklist;
    void _removed;
    saveData({
      ...data,
      template: {
        ...data.template,
        checklist: data.template.checklist.filter((item) => item.id !== id),
      },
      userState: {
        ...data.userState,
        checklist: nextChecklistState,
      },
    });
  };

  const updateBudgetItem = (
    id: string,
    patch: Partial<{ paid: boolean; selected: boolean; actualAmount?: number }>,
  ) => {
    const current = data.userState.budget[id] || { paid: false, selected: false };
    saveData({
      ...data,
      userState: {
        ...data.userState,
        budget: {
          ...data.userState.budget,
          [id]: { ...current, ...patch },
        },
      },
    });
  };

  const saveBudgetItem = (
    item: BudgetItem,
    statePatch?: Partial<{ paid: boolean; selected: boolean; actualAmount?: number }>,
  ) => {
    const exists = data.template.budget.some((current) => current.id === item.id);
    const currentState = data.userState.budget[item.id] || { paid: false, selected: false };
    saveData({
      ...data,
      template: {
        ...data.template,
        budget: exists
          ? data.template.budget.map((current) => (current.id === item.id ? item : current))
          : [item, ...data.template.budget],
      },
      userState: {
        ...data.userState,
        budget: {
          ...data.userState.budget,
          [item.id]: { ...currentState, ...statePatch },
        },
      },
    });
  };

  const deleteBudgetItem = (id: string) => {
    const { [id]: _removed, ...nextBudgetState } = data.userState.budget;
    void _removed;
    saveData({
      ...data,
      template: {
        ...data.template,
        budget: data.template.budget.filter((item) => item.id !== id),
      },
      userState: {
        ...data.userState,
        budget: nextBudgetState,
      },
    });
  };

  const updateProfile = (profile: CoupleProfile) => {
    saveData({ ...data, profile });
  };

  const resetData = () => setData(localWeddingRepository.reset());

  const reloadTemplate = () => {
    setData(localWeddingRepository.reloadTemplate(data, defaultWeddingData.template));
  };

  const language = data.language;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 overflow-hidden px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
        <header className="sticky top-0 z-20 -mx-4 border-b border-sky-100 bg-[#f8fafc]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">
                {t(language, "appName")}
              </p>
              <h1 className="break-keep text-xl font-semibold text-slate-950 sm:text-3xl">
                {t(language, "groom")} · {t(language, "bride")} Wedding Planner
              </h1>
            </div>
            <div className="flex items-center justify-start gap-2 sm:justify-end">
              <div className="flex rounded-full border border-sky-200 bg-white p-1 shadow-sm">
                {(["ko", "ja"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                      language === lang ? "bg-sky-500 text-white" : "text-stone-600 hover:bg-sky-50"
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <nav className="mx-auto mt-3 flex max-w-7xl gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
            {views.map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeView === view
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-sky-100 hover:bg-sky-50"
                }`}
              >
                {t(language, view)}
              </button>
            ))}
          </nav>
        </header>

        {activeView === "dashboard" && (
          <Dashboard data={data} onOpenView={setActiveView} />
        )}
        {activeView === "checklist" && (
          <ChecklistView
            data={data}
            onDeleteItem={deleteChecklistItem}
            onSaveItem={saveChecklistItem}
            onUpdateItem={updateChecklistItem}
          />
        )}
        {activeView === "schedule" && <ScheduleView data={data} />}
        {activeView === "budget" && (
          <BudgetView
            data={data}
            onDeleteBudgetItem={deleteBudgetItem}
            onSaveBudgetItem={saveBudgetItem}
            onUpdateBudgetItem={updateBudgetItem}
          />
        )}
        {activeView === "settings" && (
          <SettingsView
            data={data}
            onLanguageChange={setLanguage}
            onProfileChange={updateProfile}
            onReset={resetData}
            onReloadTemplate={reloadTemplate}
          />
        )}
      </div>
    </main>
  );
}

