"use client";

import { BooksStackVector } from "@/components/Illustrations";
import { deriveVaultIdentity } from "@/lib/vault-storage";
import { Language, regionShortName, UI_COPY } from "@/lib/i18n";
import { KNOWLEDGE_REGIONS } from "@/lib/regions";
import {
  DifficultyLevel,
  KnowledgeNode,
  KnowledgeVault,
  VaultIdentity,
} from "@/types/knowledge";
import {
  BookOpen,
  Check,
  Edit3,
  Lock,
  Network,
  Plus,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface VaultOverviewViewProps {
  vault: KnowledgeVault;
  onUpdateIdentity: (vaultName: string, identity: VaultIdentity) => void;
  onOpenAddExploration: (targetNode?: KnowledgeNode) => void;
  onOpenTree: (focusNodeId?: string) => void;
  onOpenLibrary: (options?: {
    itemType?: "node" | "source";
    itemId?: string;
    filter?: "all" | "sources" | "notes" | "favorites";
  }) => void;
  onToggleFavoriteNode: (nodeId: string) => void;
  lang: Language;
}

export default function VaultOverviewView({
  vault,
  onUpdateIdentity,
  onOpenAddExploration,
  onOpenTree,
  onOpenLibrary,
  onToggleFavoriteNode,
  lang,
}: VaultOverviewViewProps) {
  const t = UI_COPY[lang];
  const identity = deriveVaultIdentity(vault);
  const isEmpty = vault.nodes.length === 0;

  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [nameInput, setNameInput] = useState(vault.name);
  const [mainInterest, setMainInterest] = useState(identity.mainInterest);
  const [shortDescription, setShortDescription] = useState(
    identity.shortDescription
  );
  const [focusQuestion, setFocusQuestion] = useState(identity.focusQuestion);
  const [learningGoal, setLearningGoal] = useState(identity.learningGoal);
  const [relatedInterests, setRelatedInterests] = useState<string[]>(
    identity.relatedInterests
  );
  const [tagDraft, setTagDraft] = useState("");
  const [difficultyComfort, setDifficultyComfort] = useState<DifficultyLevel>(
    identity.difficultyComfort || "Basic"
  );

  // Clean Node list filter
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [nodeQuery, setNodeQuery] = useState("");

  useEffect(() => {
    const nextId = deriveVaultIdentity(vault);
    setNameInput(vault.name);
    setMainInterest(nextId.mainInterest);
    setShortDescription(nextId.shortDescription);
    setFocusQuestion(nextId.focusQuestion);
    setLearningGoal(nextId.learningGoal);
    setRelatedInterests(nextId.relatedInterests);
    setDifficultyComfort(nextId.difficultyComfort || "Basic");
    setIsEditingIdentity(false);
  }, [vault]);

  const handleAddTag = () => {
    const clean = tagDraft.trim();
    if (!clean) return;
    if (!relatedInterests.includes(clean)) {
      setRelatedInterests([...relatedInterests, clean]);
    }
    setTagDraft("");
  };

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateIdentity(nameInput.trim() || vault.name, {
      mainInterest: mainInterest.trim() || identity.mainInterest,
      shortDescription: shortDescription.trim(),
      focusQuestion: focusQuestion.trim(),
      learningGoal: learningGoal.trim(),
      relatedInterests,
      difficultyComfort,
    });
    setIsEditingIdentity(false);
  };

  const filteredNodes = vault.nodes.filter((n) => {
    if (onlyFavorites && !n.isFavorite) return false;
    const q = nodeQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      n.summary.toLowerCase().includes(q)
    );
  });

  const startReg =
    KNOWLEDGE_REGIONS[vault.overview.startingRegion] ||
    KNOWLEDGE_REGIONS["REG-01"];

  return (
    <div className="mx-auto max-w-[1260px] w-full px-4 sm:px-8 py-6 space-y-6">
      {/* 1. VAULT PROFILE / IDENTITY CARD */}
      <section className="rounded-3xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-7 shadow-sm">
        {!isEditingIdentity ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${startReg.badgeClass}`}
                  >
                    {regionShortName(startReg.code, lang)}
                  </span>
                  <span className="rounded-full bg-[#EAF2FF] dark:bg-blue-950/70 px-3 py-0.5 text-xs font-bold text-[#2F80ED] dark:text-blue-300">
                    {identity.mainInterest}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17233C] dark:text-slate-100">
                  {vault.name}
                </h1>
                {identity.shortDescription && (
                  <p className="text-sm leading-relaxed text-[#6F7E93] dark:text-slate-400">
                    {identity.shortDescription}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsEditingIdentity(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 hover:border-[#2F80ED] px-3.5 py-2 text-xs font-bold text-[#17233C] dark:text-slate-200 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5 text-[#2F80ED] dark:text-blue-400" />
                {t.vaultOverview.editIdentity}
              </button>
            </div>

            {(identity.focusQuestion ||
              identity.learningGoal ||
              identity.relatedInterests.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#DFE6F0] dark:border-slate-800">
                {identity.focusQuestion && (
                  <div className="rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/60 p-3.5">
                    <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#6F7E93] dark:text-slate-400">
                      {t.vaultOverview.focusQuestion}
                    </div>
                    <div className="mt-1 text-xs font-bold text-[#17233C] dark:text-slate-100">
                      {identity.focusQuestion}
                    </div>
                  </div>
                )}
                {identity.learningGoal && (
                  <div className="rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/60 p-3.5">
                    <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#6F7E93] dark:text-slate-400">
                      {t.vaultOverview.learningGoal}
                    </div>
                    <div className="mt-1 text-xs font-bold text-[#17233C] dark:text-slate-100">
                      {identity.learningGoal}
                    </div>
                  </div>
                )}
              </div>
            )}

            {identity.relatedInterests.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {identity.relatedInterests.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-[#17233C] dark:text-slate-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSaveIdentity} className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#DFE6F0] dark:border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-[#17233C] dark:text-slate-100">
                {t.vaultOverview.identityTitle}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingIdentity(false)}
                className="rounded-lg p-1 text-[#6F7E93] hover:text-[#17233C] dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                  {t.create.vaultName}
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/90 px-3.5 py-2 text-xs text-[#17233C] dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                  {t.vaultOverview.mainInterest}
                </label>
                <input
                  type="text"
                  required
                  value={mainInterest}
                  onChange={(e) => setMainInterest(e.target.value)}
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/90 px-3.5 py-2 text-xs text-[#17233C] dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                {t.vaultOverview.shortDesc}
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/90 px-3.5 py-2 text-xs text-[#17233C] dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                  {t.vaultOverview.focusQuestion}
                </label>
                <input
                  type="text"
                  value={focusQuestion}
                  onChange={(e) => setFocusQuestion(e.target.value)}
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/90 px-3.5 py-2 text-xs text-[#17233C] dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                  {t.vaultOverview.learningGoal}
                </label>
                <input
                  type="text"
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/90 px-3.5 py-2 text-xs text-[#17233C] dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                {t.vaultOverview.relatedInterests}
              </label>
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {relatedInterests.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-[#EAF2FF] dark:bg-blue-950/70 px-2.5 py-0.5 text-xs font-bold text-[#2F80ED] dark:text-blue-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        setRelatedInterests(
                          relatedInterests.filter((item) => item !== tag)
                        )
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder={t.create.addInterestPlaceholder}
                  className="flex-1 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/90 px-3 py-1.5 text-xs text-[#17233C] dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-[#17233C] dark:text-slate-200"
                >
                  {t.create.addTagBtn}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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

      {/* 2. DIRECT NODES SECTION BELOW VAULT PROFILE (Clean, Zero Clutter) */}
      {isEmpty ? (
        <section className="rounded-3xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-28 h-24 shrink-0">
              <BooksStackVector className="w-full h-full" />
            </div>
            <div className="space-y-1.5 max-w-lg">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#17233C] dark:text-slate-100">
                {t.vaultOverview.emptyTitle}
              </h2>
              <p className="text-xs text-[#6F7E93] dark:text-slate-400">
                {identity.focusQuestion || identity.mainInterest}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenAddExploration()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-5 py-3 text-xs font-bold text-white shadow-md shadow-[#2F80ED]/25 transition-all shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            {lang === "en" ? "Open First Node" : "Buka Node Pertama"}
          </button>
        </section>
      ) : (
        <section className="space-y-4">
          {/* Clean Nodes Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-extrabold text-[#17233C] dark:text-slate-100">
                {lang === "en" ? "Nodes" : "Daftar Node"} ({vault.nodes.length})
              </h2>

              <div className="inline-flex rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-[#111827] p-1">
                <button
                  type="button"
                  onClick={() => setOnlyFavorites(false)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                    !onlyFavorites
                      ? "bg-[#2F80ED] text-white"
                      : "text-[#6F7E93] dark:text-slate-300 hover:text-[#17233C] dark:hover:text-white"
                  }`}
                >
                  {lang === "en" ? "All" : "Semua"}
                </button>
                <button
                  type="button"
                  onClick={() => setOnlyFavorites(true)}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                    onlyFavorites
                      ? "bg-[#FFFBEB] dark:bg-amber-950/70 text-[#B45309] dark:text-amber-300"
                      : "text-[#6F7E93] dark:text-slate-300 hover:text-[#17233C] dark:hover:text-white"
                  }`}
                >
                  <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                  {lang === "en" ? "Favorites" : "Favorit"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C9AAE]" />
                <input
                  type="text"
                  value={nodeQuery}
                  onChange={(e) => setNodeQuery(e.target.value)}
                  placeholder={
                    lang === "en" ? "Search nodes..." : "Cari node..."
                  }
                  className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-[#111827] pl-8 pr-3 py-1.5 text-xs text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => onOpenAddExploration()}
                data-testid="overview-add-node-btn"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#EAF2FF] dark:bg-blue-950/70 hover:bg-[#2F80ED] text-[#2F80ED] dark:text-blue-300 hover:text-white px-3.5 py-2 text-xs font-bold transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{lang === "en" ? "Add Node" : "Tambah Node"}</span>
              </button>
            </div>
          </div>

          {/* Direct Node Cards Grid with 2 Clean Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNodes.map((node) => {
              const reg =
                KNOWLEDGE_REGIONS[node.region] || KNOWLEDGE_REGIONS["REG-01"];
              const isLocked = !node.explored;

              return (
                <div
                  key={node.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 shadow-sm transition-all ${
                    isLocked
                      ? "border-dashed border-slate-300 dark:border-slate-700 bg-[#F8FAFC]/80 dark:bg-slate-900/60"
                      : "border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-[#2F80ED]/60"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${
                            isLocked
                              ? "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                              : reg.badgeClass
                          }`}
                        >
                          {regionShortName(reg.code, lang)}
                        </span>
                        {isLocked && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/70 dark:bg-slate-800 px-2.5 py-0.5 text-[10.5px] font-bold text-[#6F7E93] dark:text-slate-400">
                            <Lock className="h-3 w-3" />
                            {lang === "en" ? "Fog · Unopened" : "Fog · Belum Dibuka"}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleFavoriteNode(node.id)}
                        className="p-1 rounded-lg hover:bg-[#F3F6FC] dark:hover:bg-slate-800 transition-colors"
                        aria-label="Toggle favorite"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            node.isFavorite
                              ? "fill-[#F59E0B] text-[#F59E0B]"
                              : "text-[#94A3B8]"
                          }`}
                        />
                      </button>
                    </div>

                    <h3
                      className={`text-base font-extrabold ${
                        isLocked
                          ? "text-[#475569] dark:text-slate-300"
                          : "text-[#17233C] dark:text-slate-100"
                      }`}
                    >
                      {node.title}
                    </h3>

                    {!isLocked && node.summary && (
                      <p className="text-xs text-[#6F7E93] dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {node.summary}
                      </p>
                    )}
                  </div>

                  {/* Two Clean Action Buttons: 1) Read Material / Open Node  2) Go to Node in Tree */}
                  <div className="flex items-center gap-2 pt-3 border-t border-[#DFE6F0] dark:border-slate-800">
                    {isLocked ? (
                      <button
                        type="button"
                        onClick={() => onOpenAddExploration(node)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] py-2.5 px-3 text-xs font-bold text-white transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>
                          {lang === "en" ? "Open Node" : "Buka Node"}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenLibrary({
                            itemType: "node",
                            itemId: node.id,
                            filter: "all",
                          })
                        }
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] py-2.5 px-3 text-xs font-bold text-white transition-colors"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>
                          {lang === "en" ? "Read Material" : "Baca Materi"}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenTree(node.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 hover:border-[#2F80ED] py-2.5 px-3 text-xs font-bold text-[#17233C] dark:text-slate-100 transition-colors"
                    >
                      <Network className="h-3.5 w-3.5 text-[#2F80ED] dark:text-blue-400" />
                      <span>
                        {lang === "en" ? "View in Tree" : "Ke Node di Tree"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
