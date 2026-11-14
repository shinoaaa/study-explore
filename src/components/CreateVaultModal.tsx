"use client";

import { BooksStackVector } from "@/components/Illustrations";
import { difficultyLabel, Language, UI_COPY } from "@/lib/i18n";
import { DifficultyLevel, VaultIdentity } from "@/types/knowledge";
import { Loader2, Plus, Sparkles, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface CreateVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateVault: (vaultName: string, identity: VaultIdentity) => void;
  isLoading: boolean;
  lang: Language;
}

type StarterSlug = "bio" | "energy" | "neuro";

function getStarterIdentity(
  tpl: StarterSlug,
  lang: Language
): { vaultName: string } & VaultIdentity {
  const isEn = lang === "en";
  if (tpl === "bio") {
    return {
      vaultName: isEn
        ? "Biomedical Foundations"
        : "Fondasi Biomedis & Sel",
      mainInterest: isEn
        ? "Clinical Physiology & Biotechnology"
        : "Fisiologi Klinis & Bioteknologi",
      shortDescription: isEn
        ? "Collecting cellular biology, organ mechanisms, and modern diagnostic insights in one place."
        : "Mengumpulkan catatan biologi sel, mekanisme organ, hingga pembacaan diagnostik modern.",
      focusQuestion: isEn
        ? "How do biological systems sustain balance and inspire clinical tools?"
        : "Bagaimana sistem sel tubuh menjaga keseimbangan dan menginspirasi alat medis?",
      learningGoal: isEn
        ? "Bridge textbook mechanisms with clinical cases and biosensors."
        : "Menghubungkan konsep biologi dengan kasus klinis dan sensor biomedis.",
      relatedInterests: isEn
        ? ["Cellular Biology", "Clinical Cases", "Biosensors"]
        : ["Biologi Sel", "Kasus Klinis", "Sensor Biomedis"],
      difficultyComfort: "Intermediate",
    };
  }
  if (tpl === "energy") {
    return {
      vaultName: isEn
        ? "Clean Energy & Systems"
        : "Energi Bersih & Sistem Listrik",
      mainInterest: isEn
        ? "Renewable Energy & Electric Drivetrains"
        : "Energi Terbarukan & Kendaraan Listrik",
      shortDescription: isEn
        ? "Connecting electromagnetism, energy conversion, and grid storage concepts."
        : "Menyambungkan prinsip elektromagnetisme, konversi energi, dan sistem penyimpanan modern.",
      focusQuestion: isEn
        ? "How do physical laws convert sunlight and motion into clean electric power?"
        : "Bagaimana hukum fisika mengubah cahaya dan gerak menjadi daya listrik yang efisien?",
      learningGoal: isEn
        ? "Synthesize physics principles into real solar and EV architecture notes."
        : "Merangkum prinsip fisika menjadi pemahaman desain panel surya dan motor listrik.",
      relatedInterests: isEn
        ? ["Electromagnetism", "Solar Cells", "Electric Motors"]
        : ["Elektromagnetisme", "Sel Surya", "Motor Listrik"],
      difficultyComfort: "Intermediate",
    };
  }
  return {
    vaultName: isEn ? "AI & Cognitive Science" : "AI & Neurosains Kognitif",
    mainInterest: isEn
      ? "Neuroscience, Learning & Neural Networks"
      : "Neurosains, Pembelajaran & Neural Networks",
    shortDescription: isEn
      ? "Mapping biological synapses alongside computational learning models."
      : "Memetakan cara kerja sinaps otak biologis berdampingan dengan model komputasi AI.",
    focusQuestion: isEn
      ? "How does biological memory wiring inspire modern machine learning architectures?"
      : "Bagaimana cara otak membentuk memori bisa menginspirasi arsitektur Deep Learning?",
    learningGoal: isEn
      ? "Compare biological plasticity and artificial weight updates across readings."
      : "Membandingkan plastisitas sinaptik biologis dan mekanisme pembelajaran mesin.",
    relatedInterests: isEn
      ? ["Synaptic Plasticity", "Deep Learning", "Cognitive Psych"]
      : ["Plastisitas Otak", "Deep Learning", "Psikologi Kognitif"],
    difficultyComfort: "Advanced",
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
  const initial = getStarterIdentity("bio", lang);

  const [vaultName, setVaultName] = useState(initial.vaultName);
  const [mainInterest, setMainInterest] = useState(initial.mainInterest);
  const [shortDescription, setShortDescription] = useState(
    initial.shortDescription
  );
  const [focusQuestion, setFocusQuestion] = useState(initial.focusQuestion);
  const [learningGoal, setLearningGoal] = useState(initial.learningGoal);
  const [relatedInterests, setRelatedInterests] = useState<string[]>(
    initial.relatedInterests
  );
  const [tagInput, setTagInput] = useState("");
  const [difficultyComfort, setDifficultyComfort] = useState<DifficultyLevel>(
    initial.difficultyComfort || "Intermediate"
  );

  const dirtyRef = useRef(false);
  const activeStarterRef = useRef<StarterSlug>("bio");

  const applyStarter = (tpl: StarterSlug, targetLang: Language = lang) => {
    const d = getStarterIdentity(tpl, targetLang);
    activeStarterRef.current = tpl;
    dirtyRef.current = false;
    setVaultName(d.vaultName);
    setMainInterest(d.mainInterest);
    setShortDescription(d.shortDescription);
    setFocusQuestion(d.focusQuestion);
    setLearningGoal(d.learningGoal);
    setRelatedInterests(d.relatedInterests);
    setDifficultyComfort(d.difficultyComfort || "Intermediate");
  };

  useEffect(() => {
    if (!dirtyRef.current) {
      const d = getStarterIdentity(activeStarterRef.current, lang);
      setVaultName(d.vaultName);
      setMainInterest(d.mainInterest);
      setShortDescription(d.shortDescription);
      setFocusQuestion(d.focusQuestion);
      setLearningGoal(d.learningGoal);
      setRelatedInterests(d.relatedInterests);
      setDifficultyComfort(d.difficultyComfort || "Intermediate");
    }
  }, [lang, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const clean = tagInput.trim();
    if (!clean) return;
    if (!relatedInterests.includes(clean)) {
      dirtyRef.current = true;
      setRelatedInterests((prev) => [...prev, clean]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    dirtyRef.current = true;
    setRelatedInterests((prev) => prev.filter((item) => item !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultName.trim() || !mainInterest.trim()) return;
    const pendingTag = tagInput.trim();
    const finalTags =
      pendingTag && !relatedInterests.includes(pendingTag)
        ? [...relatedInterests, pendingTag]
        : relatedInterests;

    onCreateVault(vaultName.trim(), {
      mainInterest: mainInterest.trim(),
      shortDescription: shortDescription.trim(),
      focusQuestion: focusQuestion.trim(),
      learningGoal: learningGoal.trim(),
      relatedInterests: finalTags,
      difficultyComfort,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#17263C]/45 dark:bg-black/65 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl transition-colors my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#DFE6F0] dark:border-slate-800 pb-4">
          <h2 className="text-2xl font-extrabold text-[#17233C] dark:text-slate-100">
            {t.create.title}
          </h2>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <BooksStackVector className="w-24 h-14" />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-[#6F7E93] dark:text-slate-400 hover:bg-[#F3F6FC] dark:hover:bg-slate-700 hover:text-[#17233C] dark:hover:text-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Starter Identity Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#6F7E93] dark:text-slate-400">
            {t.create.presetsLabel}
          </span>
          <button
            type="button"
            onClick={() => applyStarter("bio")}
            className="rounded-full border border-[#DFE6F0] dark:border-slate-700 bg-[#F3F6FC] dark:bg-slate-800 hover:border-[#2F80ED] dark:hover:border-blue-400 px-3 py-1 text-xs font-semibold text-[#17233C] dark:text-slate-200 transition-colors"
          >
            {t.create.presetBio}
          </button>
          <button
            type="button"
            onClick={() => applyStarter("energy")}
            className="rounded-full border border-[#DFE6F0] dark:border-slate-700 bg-[#F3F6FC] dark:bg-slate-800 hover:border-[#2F80ED] dark:hover:border-blue-400 px-3 py-1 text-xs font-semibold text-[#17233C] dark:text-slate-200 transition-colors"
          >
            {t.create.presetEnergy}
          </button>
          <button
            type="button"
            onClick={() => applyStarter("neuro")}
            className="rounded-full border border-[#DFE6F0] dark:border-slate-700 bg-[#F3F6FC] dark:bg-slate-800 hover:border-[#2F80ED] dark:hover:border-blue-400 px-3 py-1 text-xs font-semibold text-[#17233C] dark:text-slate-200 transition-colors"
          >
            {t.create.presetNeuro}
          </button>
        </div>

        {/* Simplified Vault Identity Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                {t.create.vaultName} <span className="text-[#D95C5C]">*</span>
              </label>
              <input
                type="text"
                required
                value={vaultName}
                placeholder={t.create.vaultNamePlaceholder}
                onChange={(e) => {
                  dirtyRef.current = true;
                  setVaultName(e.target.value);
                }}
                className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2F80ED] dark:text-blue-400 mb-1">
                {t.create.mainInterest} <span className="text-[#D95C5C]">*</span>
              </label>
              <input
                type="text"
                required
                value={mainInterest}
                placeholder={t.create.mainInterestPlaceholder}
                onChange={(e) => {
                  dirtyRef.current = true;
                  setMainInterest(e.target.value);
                }}
                className="w-full rounded-xl border border-[#BFDBFE] dark:border-blue-900/60 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
              {t.create.shortDescription}
            </label>
            <textarea
              rows={2}
              value={shortDescription}
              placeholder={t.create.shortDescriptionPlaceholder}
              onChange={(e) => {
                dirtyRef.current = true;
                setShortDescription(e.target.value);
              }}
              className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                {t.create.focusQuestion}
              </label>
              <input
                type="text"
                value={focusQuestion}
                placeholder={t.create.focusQuestionPlaceholder}
                onChange={(e) => {
                  dirtyRef.current = true;
                  setFocusQuestion(e.target.value);
                }}
                className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                {t.create.learningGoal}
              </label>
              <input
                type="text"
                value={learningGoal}
                placeholder={t.create.learningGoalPlaceholder}
                onChange={(e) => {
                  dirtyRef.current = true;
                  setLearningGoal(e.target.value);
                }}
                className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
              />
            </div>
          </div>

          {/* Related Interests Tag Input */}
          <div>
            <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1.5">
              {t.create.relatedInterests}
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {relatedInterests.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-[#EAF2FF] dark:bg-blue-950/60 border border-[#BFDBFE] dark:border-blue-800 px-2.5 py-1 text-xs font-semibold text-[#2F80ED] dark:text-blue-300"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remove ${tag}`}
                    className="hover:text-[#17233C] dark:hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder={t.create.addInterestPlaceholder}
                className="flex-1 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-1.5 text-xs text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="inline-flex items-center gap-1 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#2F80ED] px-3 py-1.5 text-xs font-bold text-[#17233C] dark:text-slate-200"
              >
                <Plus className="h-3.5 w-3.5 text-[#2F80ED]" />
                {t.create.addTagBtn}
              </button>
            </div>
          </div>

          {/* Starting Difficulty Comfort */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-xs font-bold text-[#17233C] dark:text-slate-200">
              {t.create.difficultyComfort}
            </span>
            <div className="inline-flex rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F3F6FC] dark:bg-slate-900 p-0.5">
              {(["Foundation", "Intermediate", "Advanced"] as DifficultyLevel[]).map(
                (lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      dirtyRef.current = true;
                      setDifficultyComfort(lvl);
                    }}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                      difficultyComfort === lvl
                        ? "bg-[#2F80ED] text-white shadow-sm"
                        : "text-[#6F7E93] dark:text-slate-400 hover:text-[#17233C] dark:hover:text-slate-200"
                    }`}
                  >
                    {difficultyLabel(lvl, lang)}
                  </button>
                )
              )}
            </div>
          </div>

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
