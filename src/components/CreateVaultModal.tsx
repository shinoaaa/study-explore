"use client";

import { BooksStackVector } from "@/components/Illustrations";
import { Language, UI_COPY } from "@/lib/i18n";
import { ExplorationMode, VaultInputContext } from "@/types/knowledge";
import { BookOpen, Compass, Loader2, Sparkles, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface CreateVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateVault: (
    vaultName: string,
    inputContext: VaultInputContext
  ) => Promise<void>;
  isLoading: boolean;
  lang: Language;
}

type PresetSlug = "fotosintesis" | "listrik" | "ai_medis";

function getTemplateDefaults(tpl: PresetSlug, lang: Language) {
  const isEn = lang === "en";
  if (tpl === "fotosintesis") {
    return {
      mode: "mode_a" as ExplorationMode,
      vaultName: isEn
        ? "Photosynthesis × Clean Energy"
        : "Fotosintesis × Energi Hijau",
      subject: isEn ? "Biology" : "Biologi (SMA Kelas XII)",
      chapter: isEn
        ? "Metabolism & Photosynthesis"
        : "Metabolisme & Fotosintesis",
      subchapters: isEn
        ? "Chloroplasts & Pigments, Light Reactions, Calvin Cycle, Limiting Factors"
        : "Kloroplas & Pigmen Cahaya, Reaksi Terang, Siklus Calvin, Faktor Laju",
      interestDomain: isEn
        ? "Renewable Energy & Biotech"
        : "Energi Terbarukan & Bioteknologi",
      targetGoal: isEn
        ? "How capturing photons in leaves inspires solar cells"
        : "Bagaimana proses tangkap cahaya di daun menginspirasi sel surya",
      motivation: isEn
        ? "Connect plant cell biology with clean energy design"
        : "Menghubungkan biologi tumbuhan dengan teknologi energi bersih",
    };
  }
  if (tpl === "listrik") {
    return {
      mode: "mode_a" as ExplorationMode,
      vaultName: isEn
        ? "Electromagnetism × EV"
        : "Elektromagnetisme × Kendaraan Listrik",
      subject: isEn ? "Physics" : "Fisika (SMA Kelas XII)",
      chapter: isEn
        ? "Magnetic Fields & Induction"
        : "Medan Magnet & Induksi Elektromagnetik",
      subchapters: isEn
        ? "Magnetic Flux, Faraday's Law, Lorentz Force, Generators & Motors"
        : "Fluks Magnetik, Hukum Faraday, Gaya Lorentz, Generator & Motor",
      interestDomain: isEn
        ? "Automotive Engineering & EVs"
        : "Teknik Otomotif & Kendaraan Listrik",
      targetGoal: isEn
        ? "How traction motors and regenerative braking work"
        : "Cara kerja motor penggerak listrik dan regenerative braking",
      motivation: isEn
        ? "See electromagnetic laws in real electric drivetrains"
        : "Melihat hukum elektromagnetisme langsung di kendaraan listrik",
    };
  }
  return {
    mode: "mode_b" as ExplorationMode,
    vaultName: isEn
      ? "Neuroplasticity & Neural Networks"
      : "Neuroplastisitas & Neural Networks",
    subject: isEn ? "Biology" : "Biologi",
    chapter: "",
    subchapters: "",
    interestDomain: isEn
      ? "Neuroscience, Cognitive Psych & AI"
      : "Neurosains, Psikologi Kognitif & AI",
    targetGoal: isEn
      ? "How the brain wires memory and inspires Neural Networks"
      : "Bagaimana otak membentuk memori dan menginspirasi Neural Network",
    motivation: isEn
      ? "Connect biological neurons and synapses to Deep Learning architectures"
      : "Menghubungkan cara kerja neuron biologis hingga arsitektur Deep Learning",
  };
}

export default function CreateVaultModal({
  isOpen,
  onClose,
  onCreateVault,
  isLoading,
  lang,
}: CreateVaultModalProps) {
  const t = UI_COPY[lang];
  const initial = getTemplateDefaults("fotosintesis", lang);
  const [mode, setMode] = useState<ExplorationMode>(initial.mode);
  const [vaultName, setVaultName] = useState(initial.vaultName);
  const [subject, setSubject] = useState(initial.subject);
  const [chapter, setChapter] = useState(initial.chapter);
  const [subchapters, setSubchapters] = useState(initial.subchapters);
  const [interestDomain, setInterestDomain] = useState(initial.interestDomain);
  const [targetGoal, setTargetGoal] = useState(initial.targetGoal);
  const [motivation, setMotivation] = useState(initial.motivation);

  const dirtyRef = useRef(false);
  const activeTplRef = useRef<PresetSlug>("fotosintesis");

  const applyQuickTemplate = (tpl: PresetSlug, targetLang: Language = lang) => {
    const d = getTemplateDefaults(tpl, targetLang);
    activeTplRef.current = tpl;
    dirtyRef.current = false;
    setMode(d.mode);
    setVaultName(d.vaultName);
    if (d.subject) setSubject(d.subject);
    if (d.chapter) setChapter(d.chapter);
    if (d.subchapters) setSubchapters(d.subchapters);
    setInterestDomain(d.interestDomain);
    setTargetGoal(d.targetGoal);
    setMotivation(d.motivation);
  };

  useEffect(() => {
    if (!dirtyRef.current) {
      const d = getTemplateDefaults(activeTplRef.current, lang);
      setMode(d.mode);
      setVaultName(d.vaultName);
      if (d.subject) setSubject(d.subject);
      if (d.chapter) setChapter(d.chapter);
      if (d.subchapters) setSubchapters(d.subchapters);
      setInterestDomain(d.interestDomain);
      setTargetGoal(d.targetGoal);
      setMotivation(d.motivation);
    }
  }, [lang, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultName.trim()) return;
    await onCreateVault(vaultName.trim(), {
      mode,
      subject: mode === "mode_a" ? subject : undefined,
      chapter: mode === "mode_a" ? chapter : undefined,
      subchapters: mode === "mode_a" ? subchapters : undefined,
      interestDomain,
      targetGoal,
      motivation: mode === "mode_b" ? motivation : undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#17263C]/45 dark:bg-black/65 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-3xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#DFE6F0] dark:border-slate-800 pb-4">
          <h2 className="text-2xl font-extrabold text-[#17233C] dark:text-slate-100">
            {t.create.title}
          </h2>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <BooksStackVector className="w-28 h-16" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-[#6F7E93] dark:text-slate-400 hover:bg-[#F3F6FC] dark:hover:bg-slate-700 hover:text-[#17233C] dark:hover:text-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Templates */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#6F7E93] dark:text-slate-400">
            {t.create.presetsLabel}
          </span>
          <button
            type="button"
            onClick={() => applyQuickTemplate("fotosintesis")}
            className="rounded-full border border-[#DFE6F0] dark:border-slate-700 bg-[#F3F6FC] dark:bg-slate-800 hover:border-[#2F80ED] dark:hover:border-blue-400 px-3 py-1 text-xs font-semibold text-[#17233C] dark:text-slate-200 transition-colors"
          >
            {t.create.presetPhoto}
          </button>
          <button
            type="button"
            onClick={() => applyQuickTemplate("listrik")}
            className="rounded-full border border-[#DFE6F0] dark:border-slate-700 bg-[#F3F6FC] dark:bg-slate-800 hover:border-[#2F80ED] dark:hover:border-blue-400 px-3 py-1 text-xs font-semibold text-[#17233C] dark:text-slate-200 transition-colors"
          >
            {t.create.presetInduction}
          </button>
          <button
            type="button"
            onClick={() => applyQuickTemplate("ai_medis")}
            className="rounded-full border border-[#DFE6F0] dark:border-slate-700 bg-[#F3F6FC] dark:bg-slate-800 hover:border-[#2F80ED] dark:hover:border-blue-400 px-3 py-1 text-xs font-semibold text-[#17233C] dark:text-slate-200 transition-colors"
          >
            {t.create.presetNeuro}
          </button>
        </div>

        {/* Clean Dual Toggle */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              dirtyRef.current = true;
              setMode("mode_a");
            }}
            className={`flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-all ${
              mode === "mode_a"
                ? "border-[#2F80ED] bg-[#EAF2FF]/70 dark:bg-blue-950/50 dark:border-blue-500 ring-2 ring-[#2F80ED]/15"
                : "border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                mode === "mode_a"
                  ? "bg-[#2F80ED] text-white"
                  : "bg-[#F3F6FC] dark:bg-slate-800 text-[#6F7E93] dark:text-slate-400"
              }`}
            >
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-sm font-extrabold text-[#17233C] dark:text-slate-100">
              {t.create.fromMaterial}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              dirtyRef.current = true;
              setMode("mode_b");
            }}
            className={`flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-all ${
              mode === "mode_b"
                ? "border-[#2F80ED] bg-[#EAF2FF]/70 dark:bg-blue-950/50 dark:border-blue-500 ring-2 ring-[#2F80ED]/15"
                : "border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                mode === "mode_b"
                  ? "bg-[#2F80ED] text-white"
                  : "bg-[#F3F6FC] dark:bg-slate-800 text-[#6F7E93] dark:text-slate-400"
              }`}
            >
              <Compass className="h-4 w-4" />
            </div>
            <span className="text-sm font-extrabold text-[#17233C] dark:text-slate-100">
              {t.create.fromCuriosity}
            </span>
          </button>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
              {t.create.vaultName} <span className="text-[#D95C5C]">*</span>
            </label>
            <input
              type="text"
              required
              value={vaultName}
              onChange={(e) => {
                dirtyRef.current = true;
                setVaultName(e.target.value);
              }}
              className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
            />
          </div>

          {mode === "mode_a" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                    {t.create.subject}
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => {
                      dirtyRef.current = true;
                      setSubject(e.target.value);
                    }}
                    className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                    {t.create.chapter}
                  </label>
                  <input
                    type="text"
                    required
                    value={chapter}
                    onChange={(e) => {
                      dirtyRef.current = true;
                      setChapter(e.target.value);
                    }}
                    className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                  {t.create.subchapters}
                </label>
                <input
                  type="text"
                  required
                  value={subchapters}
                  onChange={(e) => {
                    dirtyRef.current = true;
                    setSubchapters(e.target.value);
                  }}
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#2F80ED] dark:text-blue-400 mb-1">
                {t.create.interest}
              </label>
              <input
                type="text"
                required
                value={interestDomain}
                onChange={(e) => {
                  dirtyRef.current = true;
                  setInterestDomain(e.target.value);
                }}
                className="w-full rounded-xl border border-[#BFDBFE] dark:border-blue-900/60 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2F80ED] dark:text-blue-400 mb-1">
                {mode === "mode_a"
                  ? t.create.goalMaterial
                  : t.create.goalCuriosity}
              </label>
              <input
                type="text"
                required
                value={targetGoal}
                onChange={(e) => {
                  dirtyRef.current = true;
                  setTargetGoal(e.target.value);
                }}
                className="w-full rounded-xl border border-[#BFDBFE] dark:border-blue-900/60 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
              />
            </div>
          </div>

          {mode === "mode_b" && (
            <div>
              <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                {t.create.motivation}
              </label>
              <input
                type="text"
                value={motivation}
                onChange={(e) => {
                  dirtyRef.current = true;
                  setMotivation(e.target.value);
                }}
                className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DFE6F0] dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-[#6F7E93] dark:text-slate-300 hover:bg-[#F3F6FC] dark:hover:bg-slate-700 hover:text-[#17233C] dark:hover:text-white"
            >
              {t.create.cancel}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.create.creating}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t.create.submit} →
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
