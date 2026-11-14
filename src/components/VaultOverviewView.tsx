"use client";

import { BooksStackVector } from "@/components/Illustrations";
import { deriveVaultIdentity, countVaultFavorites } from "@/lib/vault-storage";
import { Language, regionShortName, sourceFormatLabel, UI_COPY } from "@/lib/i18n";
import { KNOWLEDGE_REGIONS } from "@/lib/regions";
import { KnowledgeVault, VaultIdentity } from "@/types/knowledge";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Check,
  Compass,
  Edit3,
  Layers,
  Network,
  Plus,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface VaultOverviewViewProps {
  vault: KnowledgeVault;
  onUpdateIdentity: (vaultName: string, identity: VaultIdentity) => void;
  onOpenAddExploration: () => void;
  onOpenAddSourceModal: () => void;
  onOpenTree: (focusNodeId?: string) => void;
  onOpenLibrary: (options?: {
    itemType?: "node" | "source";
    itemId?: string;
    filter?: "all" | "sources" | "notes" | "favorites";
  }) => void;
  onToggleFavoriteNode: (nodeId: string) => void;
  onToggleFavoriteSource: (sourceId: string) => void;
  lang: Language;
}

export default function VaultOverviewView({
  vault,
  onUpdateIdentity,
  onOpenAddExploration,
  onOpenAddSourceModal,
  onOpenTree,
  onOpenLibrary,
  onToggleFavoriteNode,
  onToggleFavoriteSource,
  lang,
}: VaultOverviewViewProps) {
  const t = UI_COPY[lang];
  const identity = deriveVaultIdentity(vault);
  const sources = vault.learningSources || [];
  const explorations = vault.explorations || [];
  const favNodes = vault.nodes.filter((n) => n.isFavorite);
  const favSources = sources.filter((s) => s.isFavorite);
  const favCount = countVaultFavorites(vault);
  const isEmpty = sources.length === 0 && vault.nodes.length === 0;

  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [draftName, setDraftName] = useState(vault.name);
  const [draftInterest, setDraftInterest] = useState(identity.mainInterest);
  const [draftDesc, setDraftDesc] = useState(identity.shortDescription);
  const [draftQuestion, setDraftQuestion] = useState(identity.focusQuestion);
  const [draftGoal, setDraftGoal] = useState(identity.learningGoal);
  const [draftTags, setDraftTags] = useState<string[]>(identity.relatedInterests);
  const [tagDraft, setTagDraft] = useState("");

  useEffect(() => {
    const id = deriveVaultIdentity(vault);
    setDraftName(vault.name);
    setDraftInterest(id.mainInterest);
    setDraftDesc(id.shortDescription);
    setDraftQuestion(id.focusQuestion);
    setDraftGoal(id.learningGoal);
    setDraftTags(id.relatedInterests);
    setIsEditingIdentity(false);
  }, [vault.id]);

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftName.trim() || !draftInterest.trim()) return;
    const extra = tagDraft.trim();
    const finalTags =
      extra && !draftTags.includes(extra) ? [...draftTags, extra] : draftTags;
    onUpdateIdentity(draftName.trim(), {
      mainInterest: draftInterest.trim(),
      shortDescription: draftDesc.trim(),
      focusQuestion: draftQuestion.trim(),
      learningGoal: draftGoal.trim(),
      relatedInterests: finalTags,
      difficultyComfort: identity.difficultyComfort || "Intermediate",
    });
    setTagDraft("");
    setIsEditingIdentity(false);
  };

  const addDraftTag = () => {
    const clean = tagDraft.trim();
    if (clean && !draftTags.includes(clean)) {
      setDraftTags((prev) => [...prev, clean]);
    }
    setTagDraft("");
  };

  return (
    <div className="mx-auto max-w-[1260px] px-4 sm:px-8 py-5 space-y-6">
      {/* Identity Card */}
      <section className="rounded-3xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4">
        {!isEditingIdentity ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#EAF2FF] dark:bg-blue-950/60 border border-[#BFDBFE] dark:border-blue-800 px-3 py-0.5 text-xs font-bold text-[#2F80ED] dark:text-blue-300">
                    {identity.mainInterest}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6F7E93] dark:text-slate-400">
                    {t.vaultOverview.identityTitle}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17233C] dark:text-slate-100">
                  {vault.name}
                </h1>
                <p className="text-sm leading-relaxed text-[#475569] dark:text-slate-300">
                  {identity.shortDescription}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditingIdentity(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 hover:border-[#2F80ED] px-3.5 py-2 text-xs font-bold text-[#17233C] dark:text-slate-100 transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5 text-[#2F80ED] dark:text-blue-400" />
                  {t.vaultOverview.editIdentity}
                </button>
                <button
                  type="button"
                  onClick={onOpenAddExploration}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t.vaultBar.addExploration.replace(/^\+\s*/, "")}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/50 p-3.5">
                <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#2F80ED] dark:text-blue-400">
                  {t.vaultOverview.focusQuestion}
                </div>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-[#17233C] dark:text-slate-200">
                  {identity.focusQuestion || "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/50 p-3.5">
                <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#0D9468] dark:text-emerald-400">
                  {t.vaultOverview.learningGoal}
                </div>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-[#17233C] dark:text-slate-200">
                  {identity.learningGoal || "—"}
                </p>
              </div>
            </div>

            {identity.relatedInterests.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-[#6F7E93] dark:text-slate-400 mr-1">
                  {t.vaultOverview.relatedInterests}:
                </span>
                {identity.relatedInterests.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#DFE6F0] dark:border-slate-700 bg-[#F3F6FC] dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-[#17233C] dark:text-slate-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleSaveIdentity} className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#DFE6F0] dark:border-slate-800 pb-3">
              <h2 className="text-base font-extrabold text-[#17233C] dark:text-slate-100">
                {t.vaultOverview.editIdentity}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingIdentity(false)}
                className="rounded-lg p-1.5 text-[#6F7E93] hover:bg-[#F3F6FC] dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                  {t.create.vaultName}
                </label>
                <input
                  type="text"
                  required
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2F80ED] dark:text-blue-400 mb-1">
                  {t.vaultOverview.mainInterest}
                </label>
                <input
                  type="text"
                  required
                  value={draftInterest}
                  onChange={(e) => setDraftInterest(e.target.value)}
                  className="w-full rounded-xl border border-[#BFDBFE] dark:border-blue-900/60 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                {t.vaultOverview.shortDesc}
              </label>
              <textarea
                rows={2}
                value={draftDesc}
                onChange={(e) => setDraftDesc(e.target.value)}
                className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                  {t.vaultOverview.focusQuestion}
                </label>
                <input
                  type="text"
                  value={draftQuestion}
                  onChange={(e) => setDraftQuestion(e.target.value)}
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                  {t.vaultOverview.learningGoal}
                </label>
                <input
                  type="text"
                  value={draftGoal}
                  onChange={(e) => setDraftGoal(e.target.value)}
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                {t.vaultOverview.relatedInterests}
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {draftTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-[#EAF2FF] dark:bg-blue-950/60 border border-[#BFDBFE] dark:border-blue-800 px-2.5 py-0.5 text-xs font-semibold text-[#2F80ED] dark:text-blue-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        setDraftTags((prev) => prev.filter((item) => item !== tag))
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDraftTag();
                    }
                  }}
                  placeholder={t.create.addInterestPlaceholder}
                  className="flex-1 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-1.5 text-xs text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addDraftTag}
                  className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-[#17233C] dark:text-slate-200"
                >
                  {t.create.addTagBtn}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingIdentity(false)}
                className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 px-4 py-2 text-xs font-bold text-[#6F7E93] dark:text-slate-300"
              >
                {t.vaultOverview.cancelEdit}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-4 py-2 text-xs font-bold text-white"
              >
                <Check className="h-3.5 w-3.5" />
                {t.vaultOverview.saveIdentity}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 4 Open Count Metrics Cards (zero % bars) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onOpenLibrary({ filter: "sources" })}
          className="text-left rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-[#0D9468]/60 p-4 flex items-center gap-3.5 shadow-sm transition-all"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#0D9468] dark:text-emerald-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#17233C] dark:text-slate-100">
              {sources.length}
            </div>
            <div className="text-xs font-medium text-[#6F7E93] dark:text-slate-400">
              {t.vaultOverview.statSources}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onOpenLibrary({ filter: "notes" })}
          className="text-left rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-[#2F80ED]/60 p-4 flex items-center gap-3.5 shadow-sm transition-all"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2FF] dark:bg-blue-950/60 text-[#2F80ED] dark:text-blue-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#17233C] dark:text-slate-100">
              {vault.nodes.length}
            </div>
            <div className="text-xs font-medium text-[#6F7E93] dark:text-slate-400">
              {t.vaultOverview.statNotes}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onOpenTree()}
          className="text-left rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-[#2F80ED]/60 p-4 flex items-center gap-3.5 shadow-sm transition-all"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F3FF] dark:bg-violet-950/60 text-[#7C3AED] dark:text-violet-400">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#17233C] dark:text-slate-100">
              {explorations.length}
            </div>
            <div className="text-xs font-medium text-[#6F7E93] dark:text-slate-400">
              {t.vaultOverview.statExplorations}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onOpenLibrary({ filter: "favorites" })}
          className="text-left rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-amber-400/70 p-4 flex items-center gap-3.5 shadow-sm transition-all"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF4E5] dark:bg-amber-950/60 text-[#FFA33A]">
            <Star className="h-5 w-5 fill-current" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#17233C] dark:text-slate-100">
              {favCount}
            </div>
            <div className="text-xs font-medium text-[#6F7E93] dark:text-slate-400">
              {t.vaultOverview.statFavorites}
            </div>
          </div>
        </button>
      </section>

      {isEmpty ? (
        /* Empty Vault Launch Card */
        <section className="rounded-3xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="shrink-0">
              <BooksStackVector className="w-32 h-20" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-[#17233C] dark:text-slate-100">
                {t.vaultOverview.emptyTitle}
              </h2>
              <p className="text-xs font-medium text-[#6F7E93] dark:text-slate-400 max-w-md">
                {identity.focusQuestion || identity.learningGoal}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenAddSourceModal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 hover:border-[#2F80ED] px-4 py-2.5 text-xs font-bold text-[#17233C] dark:text-slate-100"
            >
              <BookOpen className="h-4 w-4 text-[#0D9468]" />
              {t.vaultOverview.emptyActionSource.replace(/^\+\s*/, "")}
            </button>
            <button
              type="button"
              onClick={onOpenAddExploration}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-5 py-2.5 text-xs font-bold text-white shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              {t.vaultOverview.emptyActionAdd.replace(/^\+\s*/, "")}
            </button>
          </div>
        </section>
      ) : (
        /* Two-Column Sources & Favorites + Workspace Shortcuts */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Recent Learning Sources */}
          <section className="lg:col-span-6 rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold text-[#17233C] dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#0D9468] dark:text-emerald-400" />
                {t.vaultOverview.recentSources}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenAddSourceModal}
                  className="rounded-lg bg-[#ECFDF5] dark:bg-emerald-950/60 px-2.5 py-1 text-[11px] font-bold text-[#047857] dark:text-emerald-300 hover:brightness-95"
                >
                  {t.vaultOverview.addSourceNote}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenLibrary({ filter: "sources" })}
                  className="text-xs font-bold text-[#2F80ED] dark:text-blue-400 hover:underline"
                >
                  {t.home.viewAll} →
                </button>
              </div>
            </div>

            {sources.length === 0 ? (
              <p className="text-xs text-[#6F7E93] dark:text-slate-400 py-4">
                {t.vaultOverview.noSourcesYet}
              </p>
            ) : (
              <div className="space-y-2.5">
                {sources.slice(0, 4).map((src) => (
                  <div
                    key={src.id}
                    className="rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/50 p-3 flex items-start justify-between gap-3 hover:border-[#2F80ED]/60 transition-all"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onOpenLibrary({
                          itemType: "source",
                          itemId: src.id,
                          filter: "sources",
                        })
                      }
                      className="min-w-0 flex-1 text-left space-y-1"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#A7F3D0] dark:border-emerald-700/60 px-2 py-0.5 text-[10px] font-bold text-[#047857] dark:text-emerald-300">
                          {t.library.statusBadges.user_source}
                        </span>
                        <span className="rounded-full bg-white dark:bg-slate-800 border border-[#DFE6F0] dark:border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-[#6F7E93] dark:text-slate-300">
                          {sourceFormatLabel(src.format, lang)}
                        </span>
                      </div>
                      <div className="text-xs font-extrabold text-[#17233C] dark:text-slate-100 truncate">
                        {src.title}
                      </div>
                      <div className="text-[11px] text-[#6F7E93] dark:text-slate-400 line-clamp-1">
                        {src.excerptOrNotes}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleFavoriteSource(src.id)}
                      aria-label={t.reader.favorite}
                      className={`shrink-0 rounded-lg p-1.5 transition-colors ${
                        src.isFavorite
                          ? "text-[#F59E0B]"
                          : "text-[#94A3B8] hover:text-[#F59E0B]"
                      }`}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          src.isFavorite ? "fill-current" : ""
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Starred Favorites & Explorations */}
          <section className="lg:col-span-6 space-y-4">
            <div className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold text-[#17233C] dark:text-slate-100 flex items-center gap-2">
                  <Star className="h-4 w-4 text-[#F59E0B] fill-current" />
                  {t.vaultOverview.starredTitle}
                </h2>
                <button
                  type="button"
                  onClick={() => onOpenLibrary({ filter: "favorites" })}
                  className="text-xs font-bold text-[#2F80ED] dark:text-blue-400 hover:underline"
                >
                  {t.vaultOverview.viewAllLibrary} →
                </button>
              </div>

              {favNodes.length === 0 && favSources.length === 0 ? (
                <p className="text-xs text-[#6F7E93] dark:text-slate-400 py-2">
                  {t.vaultOverview.noFavoritesYet}
                </p>
              ) : (
                <div className="space-y-2">
                  {favNodes.slice(0, 3).map((fn) => {
                    const reg =
                      KNOWLEDGE_REGIONS[fn.region] || KNOWLEDGE_REGIONS["REG-01"];
                    return (
                      <div
                        key={fn.id}
                        className="rounded-xl border border-[#FDE68A] dark:border-amber-800/60 bg-[#FFFBEB]/60 dark:bg-amber-950/25 p-2.5 flex items-center justify-between gap-2"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onOpenLibrary({
                              itemType: "node",
                              itemId: fn.id,
                              filter: "favorites",
                            })
                          }
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="text-xs font-extrabold text-[#17233C] dark:text-slate-100 truncate">
                            {fn.title}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className={`rounded-full border px-2 py-0 text-[10px] font-bold ${reg.badgeClass}`}
                            >
                              {regionShortName(fn.region, lang)}
                            </span>
                            {fn.origin === "user_edited" && (
                              <span className="rounded-full bg-[#F5F3FF] dark:bg-violet-950/60 px-2 py-0 text-[10px] font-bold text-[#6D28D9] dark:text-violet-300">
                                {t.library.statusBadges.user_edited}
                              </span>
                            )}
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onOpenTree(fn.id)}
                            className="rounded-lg bg-white dark:bg-slate-800 border border-[#DFE6F0] dark:border-slate-700 px-2 py-1 text-[10.5px] font-bold text-[#2F80ED] dark:text-blue-400 hover:border-[#2F80ED]"
                          >
                            {t.vaultBar.tree}
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleFavoriteNode(fn.id)}
                            className="p-1 text-[#F59E0B]"
                            aria-label={t.reader.unfavorite}
                          >
                            <Star className="h-4 w-4 fill-current" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {favSources.slice(0, 2).map((fs) => (
                    <div
                      key={fs.id}
                      className="rounded-xl border border-[#FDE68A] dark:border-amber-800/60 bg-[#FFFBEB]/60 dark:bg-amber-950/25 p-2.5 flex items-center justify-between gap-2"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onOpenLibrary({
                            itemType: "source",
                            itemId: fs.id,
                            filter: "favorites",
                          })
                        }
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="text-xs font-extrabold text-[#17233C] dark:text-slate-100 truncate">
                          {fs.title}
                        </div>
                        <span className="inline-block mt-0.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 px-2 py-0 text-[10px] font-bold text-[#047857] dark:text-emerald-300">
                          {t.library.statusBadges.user_source}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleFavoriteSource(fs.id)}
                        className="p-1 text-[#F59E0B] shrink-0"
                        aria-label={t.reader.unfavorite}
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Explorations List + Jump Buttons */}
            <div className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold text-[#17233C] dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#2F80ED] dark:text-blue-400" />
                  {t.vaultOverview.explorationsTitle}
                </h2>
                <button
                  type="button"
                  onClick={onOpenAddExploration}
                  className="text-xs font-bold text-[#2F80ED] dark:text-blue-400 hover:underline"
                >
                  {t.vaultBar.addExploration}
                </button>
              </div>
              {explorations.length === 0 ? (
                <p className="text-xs text-[#6F7E93] dark:text-slate-400">
                  {t.vaultOverview.noExplorationsYet}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {explorations.slice(0, 3).map((exp) => (
                    <div
                      key={exp.id}
                      className="rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/50 px-3 py-2 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-[#17233C] dark:text-slate-100 truncate">
                          {exp.title}
                        </div>
                        <div className="text-[11px] text-[#6F7E93] dark:text-slate-400 truncate">
                          {exp.path === "material"
                            ? t.exploreModal.fromMaterial
                            : t.exploreModal.fromCuriosity}{" "}
                          · {exp.mappedNodeIds.length} {t.home.concepts}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-white dark:bg-slate-800 border border-[#DFE6F0] dark:border-slate-700 px-2 py-0.5 text-[10px] font-bold text-[#6F7E93] dark:text-slate-300">
                        {exp.depth === "simple"
                          ? t.reader.simple
                          : exp.depth === "deep"
                            ? t.reader.deep
                            : t.reader.standard}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenTree()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-4 py-2.5 text-xs font-bold text-white shadow-sm"
                >
                  <Network className="h-4 w-4" />
                  {t.vaultOverview.openTree}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenLibrary({ filter: "all" })}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 hover:border-[#2F80ED] px-4 py-2.5 text-xs font-bold text-[#17233C] dark:text-slate-100"
                >
                  <BookMarked className="h-4 w-4 text-[#2F80ED] dark:text-blue-400" />
                  {t.vaultOverview.viewAllLibrary}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
