import { useState } from "react";
import { t, text } from "@/lib/i18n";
import type { CoupleProfile, Language, WeddingData } from "@/types/wedding";

type Props = {
  data: WeddingData;
  onLanguageChange: (language: Language) => void;
  onProfileChange: (profile: CoupleProfile) => void;
  onReset: () => void;
  onReloadTemplate: () => void;
};

function toInputValue(value: string) {
  return value.slice(0, 16);
}

function fromInputValue(value: string) {
  return `${value}:00+09:00`;
}

export function SettingsView({ data, onLanguageChange, onProfileChange, onReset, onReloadTemplate }: Props) {
  const language = data.language;
  const [weddingDateTime, setWeddingDateTime] = useState(toInputValue(data.profile.weddingDateTime));
  const [photoDateTime, setPhotoDateTime] = useState(toInputValue(data.profile.photoDateTime));

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t(language, "settings")}</h2>
        <div className="mt-4 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-stone-600">
            {t(language, "language")}
            <select
              value={language}
              onChange={(event) => onLanguageChange(event.target.value as Language)}
              className="rounded-md border border-slate-200 px-3 py-2 font-normal focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            >
              <option value="ko">한국어</option>
              <option value="ja">日本語</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-600">
            {t(language, "weddingDate")}
            <input
              type="datetime-local"
              value={weddingDateTime}
              onChange={(event) => setWeddingDateTime(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 font-normal focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-600">
            {t(language, "photoDate")}
            <input
              type="datetime-local"
              value={photoDateTime}
              onChange={(event) => setPhotoDateTime(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 font-normal focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              onProfileChange({
                ...data.profile,
                weddingDateTime: fromInputValue(weddingDateTime),
                photoDateTime: fromInputValue(photoDateTime),
              })
            }
            className="rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"
          >
            {t(language, "saveDates")}
          </button>
        </div>
      </article>
      <article className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{text(data.profile.groomName, language)} · {text(data.profile.brideName, language)}</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="rounded-md bg-stone-50 p-3">
            <dt className="font-semibold text-stone-500">{t(language, "venue")}</dt>
            <dd className="mt-1">{text(data.profile.weddingVenue, language)}</dd>
          </div>
          <div className="rounded-md bg-stone-50 p-3">
            <dt className="font-semibold text-stone-500">{t(language, "vendor")}</dt>
            <dd className="mt-1">{text(data.profile.photoVendor, language)}</dd>
          </div>
        </dl>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={onReloadTemplate} className="rounded-md border border-sky-200 px-4 py-3 text-sm font-semibold text-sky-700">
            {t(language, "reloadTemplate")}
          </button>
          <button type="button" onClick={onReset} className="rounded-md border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
            {t(language, "resetData")}
          </button>
        </div>
      </article>
    </section>
  );
}

