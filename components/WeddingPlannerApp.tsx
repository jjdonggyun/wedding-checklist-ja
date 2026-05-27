"use client";

import { useEffect, useMemo, useState } from "react";
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

  const updateProfile = (profile: CoupleProfile) => {
    saveData({ ...data, profile });
  };

  const resetData = () => setData(localWeddingRepository.reset());

  const reloadTemplate = () => {
    setData(localWeddingRepository.reloadTemplate(data, defaultWeddingData.template));
  };

  const selectedPackage = useMemo(
    () =>
      data.template.budget.find(
        (budget: BudgetItem) =>
          budget.category === "package" && data.userState.budget[budget.id]?.selected,
      ),
    [data.template.budget, data.userState.budget],
  );

  const language = data.language;

  return (
    <main className="min-h-screen bg-[#fffaf7] text-stone-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-20 -mx-4 border-b border-rose-100 bg-[#fffaf7]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">
                {t(language, "appName")}
              </p>
              <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl">
                {t(language, "groom")} · {t(language, "bride")} Wedding Planner
              </h1>
            </div>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <div className="flex rounded-full border border-rose-200 bg-white p-1 shadow-sm">
                {(["ko", "ja"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                      language === lang ? "bg-rose-500 text-white" : "text-stone-600 hover:bg-rose-50"
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <nav className="mx-auto mt-3 flex max-w-7xl gap-2 overflow-x-auto pb-1">
            {views.map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeView === view
                    ? "bg-stone-950 text-white shadow-sm"
                    : "bg-white text-stone-600 ring-1 ring-rose-100 hover:bg-rose-50"
                }`}
              >
                {t(language, view)}
              </button>
            ))}
          </nav>
        </header>

        {activeView === "dashboard" && (
          <Dashboard data={data} selectedPackage={selectedPackage} onOpenView={setActiveView} />
        )}
        {activeView === "checklist" && (
          <ChecklistView data={data} onUpdateItem={updateChecklistItem} />
        )}
        {activeView === "schedule" && <ScheduleView data={data} />}
        {activeView === "budget" && (
          <BudgetView data={data} onUpdateBudgetItem={updateBudgetItem} />
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
