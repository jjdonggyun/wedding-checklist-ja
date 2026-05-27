"use client";

import { defaultWeddingData } from "@/lib/defaultWeddingData";
import type { WeddingData, WeddingTemplate } from "@/types/wedding";

const STORAGE_KEY = "wedding-plan-jp-kr:v1";

export type WeddingRepository = {
  load(): WeddingData;
  save(data: WeddingData): void;
  reset(): WeddingData;
  reloadTemplate(current: WeddingData, template: WeddingTemplate): WeddingData;
};

function cloneDefault(): WeddingData {
  return structuredClone(defaultWeddingData);
}

function mergeWithDefault(value: Partial<WeddingData>): WeddingData {
  const base = cloneDefault();
  return {
    ...base,
    ...value,
    profile: { ...base.profile, ...value.profile },
    template: value.template || base.template,
    userState: {
      checklist: { ...base.userState.checklist, ...value.userState?.checklist },
      budget: { ...base.userState.budget, ...value.userState?.budget },
      notes: { ...base.userState.notes, ...value.userState?.notes },
    },
    updatedAt: value.updatedAt || base.updatedAt,
  };
}

export const localWeddingRepository: WeddingRepository = {
  load() {
    if (typeof window === "undefined") {
      return cloneDefault();
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = cloneDefault();
      this.save(seeded);
      return seeded;
    }

    try {
      return mergeWithDefault(JSON.parse(raw) as Partial<WeddingData>);
    } catch {
      return cloneDefault();
    }
  },
  save(data) {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...data, updatedAt: new Date().toISOString() }),
    );
  },
  reset() {
    const seeded = cloneDefault();
    this.save(seeded);
    return seeded;
  },
  reloadTemplate(current, template) {
    const next: WeddingData = {
      ...current,
      template,
      updatedAt: new Date().toISOString(),
    };
    this.save(next);
    return next;
  },
};
