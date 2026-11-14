"use client";

import { deriveVaultIdentity } from "@/lib/vault-storage";
import { Language, UI_COPY } from "@/lib/i18n";
import {
  ExplanationDepth,
  ExplorationPath,
  KnowledgeVault,
  LearningSource,
  SourceFormat,
} from "@/types/knowledge";
import {
  BookOpen,
  Compass,
  Loader2,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

export interface AddExplorationSubmitData {
  path: ExplorationPath;
  saveSourceOnly: boolean;
  existingSourceId?: string;
  sourceFormat: SourceFormat;
  title: string;
  chapterOrSection: string;
  excerptOrNotes: string;
  focusQuestion: string;
  explorationGoal: string;
  depth: ExplanationDepth;
}

interface AddExplorationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault: KnowledgeVault;
  initialSourceId?: string;
  onSubmitExploration: (data: AddExplorationSubmitData) => Promise<void>;
  isLoading: boolean;
  lang: Language;
}

export default function AddExplorationModal({
  isOpen,
  onClose,
  vault,
  initialSourceId,
  onSubmitExploration,
  isLoading,
  lang,
}: AddExplorationModalProps) {
  const t = UI_COPY[lang];
  const identity = deriveVaultIdentity(vault);
  const existingSources: LearningSource[] = vault.learningSources || [];

  const [path, setPath] = useState<ExplorationPath>("material");
  const [sourceMode, setSourceMode] = useState<"new" | "existing">(
    initialSourceId ? "existing" : "new"
  );
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    initialSourceId || existingSources[0]?.id || ""
  );
  const [sourceFormat, setSourceFormat] = useState<SourceFormat>("book_chapter");
  const [title, setTitle] = useState("");
  const [chapterOrSection, setChapterOrSection] = useState("");
  const [excerptOrNotes, setExcerptOrNotes] = useState("");
  const [focusQuestion, setFocusQuestion] = useState(identity.focusQuestion);
  const [explorationGoal, setExplorationGoal] = useState(identity.learningGoal);
  const [depth, setDepth] = useState<ExplanationDepth>("standard");

  const resetToVaultDefaults = () => {
    const id = deriveVaultIdentity(vault);
    setFocusQuestion(id.focusQuestion);
    setExplorationGoal(id.learningGoal);
    setDepth(
      id.difficultyComfort === "Foundation"
        ? "simple"
        : id.difficultyComfort === "Advanced"
          ? "deep"
          : "standard"
    );
  };

  useEffect(() => {
    if (!isOpen) return;
    resetToVaultDefaults();
    if (initialSourceId) {
      setPath("material");
      setSourceMode("existing");
      setSelectedSourceId(initialSourceId);
      const found = existingSources.find((s) => s.id === initialSourceId);
      if (found) {
        setTitle(found.title);
        setChapterOrSection(found.chapterOrSection || "");
        setExcerptOrNotes(found.excerptOrNotes);
        if (found.focusQuestion) setFocusQuestion(found.focusQuestion);
      }
    } else {
      setSourceMode("new");
      setTitle("");
      setChapterOrSection("");
      setExcerptOrNotes("");
    }
  }, [isOpen, vault.id, initialSourceId]);

  if (!isOpen) return null;

  const isExistingReuse =
    path === "material" && sourceMode === "existing" && existingSources.length > 0;
  const activeExistingSource = isExistingReuse
    ? existingSources.find((s) => s.id === selectedSourceId) || existingSources[0]
    : undefined;

  const triggerSubmit = async (saveSourceOnly: boolean) => {
    const effectiveTitle = isExistingReuse
      ? activeExistingSource?.title || title
      : title.trim() || focusQuestion.trim() || vault.name;

    await onSubmitExploration({
      path,
      saveSourceOnly,
      existingSourceId: isExistingReuse ? activeExistingSource?.id : undefined,
      sourceFormat: path === "material" ? sourceFormat : "curiosity",
      title: effectiveTitle,
      chapterOrSection: isExistingReuse
        ? activeExistingSource?.chapterOrSection || ""
        : chapterOrSection.trim(),
      excerptOrNotes: isExistingReuse
        ? activeExistingSource?.excerptOrNotes || ""
        : excerptOrNotes.trim(),
      focusQuestion: focusQuestion.trim() || identity.focusQuestion,
      explorationGoal: explorationGoal.trim() || identity.learningGoal,
      depth,
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
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#DFE6F0] dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#EAF2FF] dark:bg-blue-950/60 border border-[#BFDBFE] dark:border-blue-800 px-2.5 py-0.5 text-[11px] font-bold text-[#2F80ED] dark:text-blue-300">
                {vault.name}
              </span>
              <span className="rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#A7F3D0] dark:border-emerald-700/60 px-2.5 py-0.5 text-[11px] font-bold text-[#047857] dark:text-emerald-300">
                {t.exploreModal.prefilledBadge}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[#17233C] dark:text-slate-100">
              {t.exploreModal.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={resetToVaultDefaults}
              className="inline-flex items-center gap-1 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 hover:border-[#2F80ED] px-2.5 py-1.5 text-[11px] font-bold text-[#6F7E93] dark:text-slate-300 hover:text-[#17233C] dark:hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              {t.exploreModal.resetDefaults}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-[#6F7E93] dark:text-slate-400 hover:bg-[#F3F6FC] dark:hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Exploration-Level Path Switcher */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPath("material")}
            className={`flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-all ${
              path === "material"
                ? "border-[#2F80ED] bg-[#EAF2FF]/70 dark:bg-blue-950/50 dark:border-blue-500 ring-2 ring-[#2F80ED]/15"
                : "border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                path === "material"
                  ? "bg-[#2F80ED] text-white"
                  : "bg-[#F3F6FC] dark:bg-slate-800 text-[#6F7E93] dark:text-slate-400"
              }`}
            >
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-sm font-extrabold text-[#17233C] dark:text-slate-100">
              {t.exploreModal.fromMaterial}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPath("curiosity")}
            className={`flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-all ${
              path === "curiosity"
                ? "border-[#2F80ED] bg-[#EAF2FF]/70 dark:bg-blue-950/50 dark:border-blue-500 ring-2 ring-[#2F80ED]/15"
                : "border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                path === "curiosity"
                  ? "bg-[#2F80ED] text-white"
                  : "bg-[#F3F6FC] dark:bg-slate-800 text-[#6F7E93] dark:text-slate-400"
              }`}
            >
              <Compass className="h-4 w-4" />
            </div>
            <span className="text-sm font-extrabold text-[#17233C] dark:text-slate-100">
              {t.exploreModal.fromCuriosity}
            </span>
          </button>
        </div>

        {/* Form Fields */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void triggerSubmit(false);
          }}
          className="mt-4 space-y-3.5"
        >
          {path === "material" ? (
            <>
              {existingSources.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#17233C] dark:text-slate-200">
                    {t.exploreModal.sourceModeLabel}
                  </span>
                  <div className="inline-flex rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F3F6FC] dark:bg-slate-900 p-0.5">
                    <button
                      type="button"
                      onClick={() => setSourceMode("new")}
                      className={`rounded-lg px-3 py-1 text-xs font-bold ${
                        sourceMode === "new"
                          ? "bg-[#2F80ED] text-white"
                          : "text-[#6F7E93] dark:text-slate-400"
                      }`}
                    >
                      {t.exploreModal.newSourceMode}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSourceMode("existing");
                        if (!selectedSourceId && existingSources[0]) {
                          setSelectedSourceId(existingSources[0].id);
                        }
                      }}
                      className={`rounded-lg px-3 py-1 text-xs font-bold ${
                        sourceMode === "existing"
                          ? "bg-[#2F80ED] text-white"
                          : "text-[#6F7E93] dark:text-slate-400"
                      }`}
                    >
                      {t.exploreModal.existingSourceMode} ({existingSources.length})
                    </button>
                  </div>
                </div>
              )}

              {isExistingReuse ? (
                <div>
                  <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                    {t.exploreModal.selectSource}
                  </label>
                  <select
                    value={activeExistingSource?.id || ""}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                  >
                    {existingSources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                        {s.chapterOrSection ? ` — ${s.chapterOrSection}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                        {t.exploreModal.materialTitle}{" "}
                        <span className="text-[#D95C5C]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        placeholder={t.exploreModal.materialTitlePlaceholder}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                        {t.exploreModal.sourceFormat}
                      </label>
                      <select
                        value={sourceFormat}
                        onChange={(e) =>
                          setSourceFormat(e.target.value as SourceFormat)
                        }
                        className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                      >
                        {(
                          [
                            "book_chapter",
                            "article",
                            "lecture_notes",
                            "topic",
                          ] as SourceFormat[]
                        ).map((fmt) => (
                          <option key={fmt} value={fmt}>
                            {t.exploreModal.formats[fmt]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                      {t.exploreModal.chapterSection}
                    </label>
                    <input
                      type="text"
                      value={chapterOrSection}
                      placeholder={t.exploreModal.chapterSectionPlaceholder}
                      onChange={(e) => setChapterOrSection(e.target.value)}
                      className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                      {t.exploreModal.excerptNotes}
                    </label>
                    <textarea
                      rows={2}
                      value={excerptOrNotes}
                      placeholder={t.exploreModal.excerptNotesPlaceholder}
                      onChange={(e) => setExcerptOrNotes(e.target.value)}
                      className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none resize-none"
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                  {t.exploreModal.curiosityTopic}{" "}
                  <span className="text-[#D95C5C]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  placeholder={t.exploreModal.curiosityTopicPlaceholder}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                  {t.exploreModal.curiositySpark}
                </label>
                <textarea
                  rows={2}
                  value={excerptOrNotes}
                  placeholder={t.exploreModal.curiositySparkPlaceholder}
                  onChange={(e) => setExcerptOrNotes(e.target.value)}
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none resize-none"
                />
              </div>
            </>
          )}

          {/* Prefilled Question, Goal & Depth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#2F80ED] dark:text-blue-400 mb-1">
                {t.exploreModal.focusQuestion}
              </label>
              <input
                type="text"
                value={focusQuestion}
                onChange={(e) => setFocusQuestion(e.target.value)}
                className="w-full rounded-xl border border-[#BFDBFE] dark:border-blue-900/60 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2F80ED] dark:text-blue-400 mb-1">
                {t.exploreModal.explorationGoal}
              </label>
              <input
                type="text"
                value={explorationGoal}
                onChange={(e) => setExplorationGoal(e.target.value)}
                className="w-full rounded-xl border border-[#BFDBFE] dark:border-blue-900/60 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-xs font-bold text-[#17233C] dark:text-slate-200">
              {t.exploreModal.depth}
            </span>
            <div className="inline-flex rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F3F6FC] dark:bg-slate-900 p-0.5">
              {(
                [
                  { id: "simple", label: t.reader.simple },
                  { id: "standard", label: t.reader.standard },
                  { id: "deep", label: t.reader.deep },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDepth(item.id)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                    depth === item.id
                      ? "bg-[#2F80ED] text-white shadow-sm"
                      : "text-[#6F7E93] dark:text-slate-400 hover:text-[#17233C] dark:hover:text-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#DFE6F0] dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-[#6F7E93] dark:text-slate-300"
            >
              {t.exploreModal.cancel}
            </button>
            {!isExistingReuse && (
              <button
                type="button"
                disabled={isLoading || !title.trim()}
                onClick={() => void triggerSubmit(true)}
                className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 hover:border-[#0D9468] disabled:opacity-50 px-4 py-2 text-xs font-bold text-[#047857] dark:text-emerald-300"
              >
                {t.exploreModal.saveSourceOnly}
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || (!isExistingReuse && !title.trim())}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-white shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.exploreModal.mapping}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t.exploreModal.saveAndMap} →
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
