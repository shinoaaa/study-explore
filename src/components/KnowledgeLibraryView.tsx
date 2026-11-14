"use client";

import { deriveVaultIdentity } from "@/lib/vault-storage";
import {
  difficultyLabel,
  Language,
  regionShortName,
  revisionKindLabel,
  sourceFormatLabel,
  UI_COPY,
} from "@/lib/i18n";
import { KNOWLEDGE_REGIONS } from "@/lib/regions";
import {
  ExplanationDepth,
  ExplanationLevels,
  KnowledgeNode,
  KnowledgeVault,
  LearningSource,
  NodeRevision,
  SourceFormat,
} from "@/types/knowledge";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Edit3,
  History,
  Loader2,
  Network,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  StickyNote,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

export type LibraryFilterTab = "all" | "sources" | "notes" | "favorites";
export type LibraryStatusFilter = "all" | "needs_review" | "user_edited";

export interface LibrarySelection {
  itemType: "node" | "source";
  itemId: string;
  startInEditMode?: boolean;
}

interface KnowledgeLibraryViewProps {
  vault: KnowledgeVault;
  initialSelection?: LibrarySelection | null;
  initialFilter?: LibraryFilterTab;
  initialStatusFilter?: LibraryStatusFilter;
  onToggleFavoriteNode: (nodeId: string) => void;
  onToggleFavoriteSource: (sourceId: string) => void;
  onSaveNodeEdit: (
    nodeId: string,
    payload: {
      summary: string;
      levels: ExplanationLevels;
      formula: string;
      application: string;
      userAnnotation: string;
      kind: "manual_edit" | "ai_revise_accepted";
      label: string;
    }
  ) => void;
  onMarkNodeReviewed: (nodeId: string) => void;
  onRestoreRevision: (nodeId: string, revision: NodeRevision) => void;
  onSaveSource: (source: {
    id?: string;
    title: string;
    format: SourceFormat;
    chapterOrSection: string;
    excerptOrNotes: string;
    focusQuestion: string;
  }) => LearningSource;
  onViewInTree: (nodeId: string) => void;
  onOpenAddExploration: (sourceId?: string) => void;
  openAddSourceTrigger?: number;
  lang: Language;
}

type UnifiedLibraryItem =
  | { kind: "source"; id: string; favorite: boolean; item: LearningSource }
  | { kind: "node"; id: string; favorite: boolean; item: KnowledgeNode };

export default function KnowledgeLibraryView({
  vault,
  initialSelection,
  initialFilter = "all",
  initialStatusFilter = "all",
  onToggleFavoriteNode,
  onToggleFavoriteSource,
  onSaveNodeEdit,
  onMarkNodeReviewed,
  onRestoreRevision,
  onSaveSource,
  onViewInTree,
  onOpenAddExploration,
  openAddSourceTrigger = 0,
  lang,
}: KnowledgeLibraryViewProps) {
  const t = UI_COPY[lang];
  const sources = vault.learningSources || [];
  const identity = deriveVaultIdentity(vault);

  const [filterTab, setFilterTab] = useState<LibraryFilterTab>(initialFilter);
  const [statusFilter, setStatusFilter] =
    useState<LibraryStatusFilter>(initialStatusFilter);
  const [favoritesFirst, setFavoritesFirst] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<{
    itemType: "node" | "source";
    itemId: string;
  } | null>(() => {
    if (initialSelection) {
      return {
        itemType: initialSelection.itemType,
        itemId: initialSelection.itemId,
      };
    }
    if (vault.nodes[0]) return { itemType: "node", itemId: vault.nodes[0].id };
    if (sources[0]) return { itemType: "source", itemId: sources[0].id };
    return null;
  });

  // Reading / Manual Editing / AI Revise Preview state
  const [readDepth, setReadDepth] = useState<ExplanationDepth>("standard");
  const [isEditingNode, setIsEditingNode] = useState(
    Boolean(initialSelection?.startInEditMode)
  );
  const [draftSummary, setDraftSummary] = useState("");
  const [draftLevels, setDraftLevels] = useState<ExplanationLevels>({
    simple: "",
    standard: "",
    deep: "",
  });
  const [draftFormula, setDraftFormula] = useState("");
  const [draftApplication, setDraftApplication] = useState("");
  const [draftAnnotation, setDraftAnnotation] = useState("");

  // AI Revise preview state
  const [showAiRevise, setShowAiRevise] = useState(false);
  const [reviseDepth, setReviseDepth] = useState<ExplanationDepth>("standard");
  const [reviseInstruction, setReviseInstruction] = useState("");
  const [isRevising, setIsRevising] = useState(false);
  const [aiPreview, setAiPreview] = useState<{
    summary: string;
    levels: ExplanationLevels;
    rationale: string;
  } | null>(null);

  // Source Edit / Add Source Modal state
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [showNewSourceModal, setShowNewSourceModal] = useState(false);
  const [srcTitle, setSrcTitle] = useState("");
  const [srcFormat, setSrcFormat] = useState<SourceFormat>("book_chapter");
  const [srcChapter, setSrcChapter] = useState("");
  const [srcExcerpt, setSrcExcerpt] = useState("");
  const [srcQuestion, setSrcQuestion] = useState("");

  // Revisions expanded state
  const [showRevisions, setShowRevisions] = useState(true);
  const [expandedRevId, setExpandedRevId] = useState<string | null>(null);

  // Sync external initial props when jumping from Overview or Tree
  useEffect(() => {
    setFilterTab(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  useEffect(() => {
    if (initialSelection) {
      setSelected({
        itemType: initialSelection.itemType,
        itemId: initialSelection.itemId,
      });
      setIsEditingNode(Boolean(initialSelection.startInEditMode));
      setShowAiRevise(false);
      setAiPreview(null);
      setIsEditingSource(false);
    }
  }, [
    initialSelection?.itemType,
    initialSelection?.itemId,
    initialSelection?.startInEditMode,
  ]);

  useEffect(() => {
    if (openAddSourceTrigger > 0) {
      setSrcTitle("");
      setSrcFormat("book_chapter");
      setSrcChapter("");
      setSrcExcerpt("");
      setSrcQuestion(identity.focusQuestion);
      setShowNewSourceModal(true);
    }
  }, [openAddSourceTrigger]);

  // Filtered unified items
  const items = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list: UnifiedLibraryItem[] = [];

    if (filterTab === "all" || filterTab === "sources" || filterTab === "favorites") {
      for (const s of sources) {
        if (filterTab === "favorites" && !s.isFavorite) continue;
        if (statusFilter !== "all") continue; // status filters focus on topic notes
        if (q) {
          const hay = `${s.title} ${s.chapterOrSection || ""} ${s.excerptOrNotes} ${s.focusQuestion}`.toLowerCase();
          if (!hay.includes(q)) continue;
        }
        list.push({
          kind: "source",
          id: s.id,
          favorite: Boolean(s.isFavorite),
          item: s,
        });
      }
    }

    if (filterTab === "all" || filterTab === "notes" || filterTab === "favorites") {
      for (const n of vault.nodes) {
        if (filterTab === "favorites" && !n.isFavorite) continue;
        if (
          statusFilter === "needs_review" &&
          n.reviewStatus !== "needs_review"
        ) {
          continue;
        }
        if (statusFilter === "user_edited" && n.origin !== "user_edited") {
          continue;
        }
        if (q) {
          const hay = `${n.title} ${n.summary} ${n.levels.simple} ${n.levels.standard} ${n.levels.deep} ${n.userAnnotation || ""}`.toLowerCase();
          if (!hay.includes(q)) continue;
        }
        list.push({
          kind: "node",
          id: n.id,
          favorite: Boolean(n.isFavorite),
          item: n,
        });
      }
    }

    if (favoritesFirst) {
      list.sort((a, b) => Number(b.favorite) - Number(a.favorite));
    }

    return list;
  }, [sources, vault.nodes, filterTab, statusFilter, searchQuery, favoritesFirst]);

  // Ensure valid active selection when filter/vault changes
  useEffect(() => {
    const stillExists = selected
      ? selected.itemType === "node"
        ? vault.nodes.some((n) => n.id === selected.itemId)
        : sources.some((s) => s.id === selected.itemId)
      : false;

    if (!stillExists) {
      if (items[0]) {
        setSelected({ itemType: items[0].kind, itemId: items[0].id });
      } else {
        setSelected(null);
      }
      setIsEditingNode(false);
      setIsEditingSource(false);
      setShowAiRevise(false);
      setAiPreview(null);
    }
  }, [vault.id, vault.nodes.length, sources.length, items.length]);

  const activeNode: KnowledgeNode | null =
    selected?.itemType === "node"
      ? vault.nodes.find((n) => n.id === selected.itemId) || null
      : null;
  const activeSource: LearningSource | null =
    selected?.itemType === "source"
      ? sources.find((s) => s.id === selected.itemId) || null
      : null;

  // Hydrate draft editors whenever activeNode / activeSource switches
  useEffect(() => {
    if (activeNode) {
      setDraftSummary(activeNode.summary);
      setDraftLevels({ ...activeNode.levels });
      setDraftFormula(activeNode.formula || "");
      setDraftApplication(activeNode.application || "");
      setDraftAnnotation(activeNode.userAnnotation || "");
      setAiPreview(null);
    }
  }, [activeNode?.id, activeNode?.updatedAt]);

  useEffect(() => {
    if (activeSource) {
      setSrcTitle(activeSource.title);
      setSrcFormat(activeSource.format);
      setSrcChapter(activeSource.chapterOrSection || "");
      setSrcExcerpt(activeSource.excerptOrNotes);
      setSrcQuestion(activeSource.focusQuestion);
      setIsEditingSource(false);
    }
  }, [activeSource?.id]);

  const handleSaveManualEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNode) return;
    onSaveNodeEdit(activeNode.id, {
      summary: draftSummary.trim() || activeNode.summary,
      levels: {
        simple: draftLevels.simple.trim() || activeNode.levels.simple,
        standard: draftLevels.standard.trim() || activeNode.levels.standard,
        deep: draftLevels.deep.trim() || activeNode.levels.deep,
      },
      formula: draftFormula.trim(),
      application: draftApplication.trim(),
      userAnnotation: draftAnnotation.trim(),
      kind: "manual_edit",
      label: lang === "en" ? "Manual Edit" : "Edit Manual",
    });
    setIsEditingNode(false);
  };

  const handleRequestAiPreview = async () => {
    if (!activeNode) return;
    setIsRevising(true);
    try {
      const res = await fetch("/api/revise-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaultName: vault.name,
          mainInterest: identity.mainInterest,
          learningGoal: identity.learningGoal,
          node: activeNode,
          depth: reviseDepth,
          instruction: reviseInstruction,
          lang,
        }),
      });
      const data = await res.json();
      if (data?.ok && data.preview) {
        setAiPreview(data.preview);
      }
    } finally {
      setIsRevising(false);
    }
  };

  const handleApplyAiPreview = () => {
    if (!activeNode || !aiPreview) return;
    onSaveNodeEdit(activeNode.id, {
      summary: aiPreview.summary,
      levels: aiPreview.levels,
      formula: activeNode.formula,
      application: activeNode.application,
      userAnnotation: activeNode.userAnnotation || "",
      kind: "ai_revise_accepted",
      label:
        lang === "en"
          ? `AI Revise (${reviseDepth})`
          : `Revisi AI (${reviseDepth})`,
    });
    setAiPreview(null);
    setShowAiRevise(false);
    setReviseInstruction("");
  };

  const handleCreateOrSaveSource = (e: React.FormEvent, isNew: boolean) => {
    e.preventDefault();
    if (!srcTitle.trim()) return;
    const saved = onSaveSource({
      id: isNew ? undefined : activeSource?.id,
      title: srcTitle.trim(),
      format: srcFormat,
      chapterOrSection: srcChapter.trim(),
      excerptOrNotes: srcExcerpt.trim(),
      focusQuestion: srcQuestion.trim() || identity.focusQuestion,
    });
    setSelected({ itemType: "source", itemId: saved.id });
    setShowNewSourceModal(false);
    setIsEditingSource(false);
  };

  return (
    <div className="mx-auto max-w-[1260px] px-4 sm:px-8 py-5 space-y-4">
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#17233C] dark:text-slate-100">
            {t.library.title}
          </h1>
          <span className="rounded-full bg-[#EAF2FF] dark:bg-blue-950/60 border border-[#BFDBFE] dark:border-blue-800 px-2.5 py-0.5 text-xs font-bold text-[#2F80ED] dark:text-blue-300">
            {sources.length + vault.nodes.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setSrcTitle("");
            setSrcFormat("book_chapter");
            setSrcChapter("");
            setSrcExcerpt("");
            setSrcQuestion(identity.focusQuestion);
            setShowNewSourceModal(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-[#111827] hover:border-[#0D9468] px-3.5 py-2 text-xs font-bold text-[#047857] dark:text-emerald-300 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          {t.library.addSourceBtn.replace(/^\+\s*/, "")}
        </button>
      </div>

      {/* Two-Pane Master-Detail Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANE: Filter + Search + List */}
        <aside className="lg:col-span-5 rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3 shadow-sm">
          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C9AAE]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.library.searchPlaceholder}
              className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 pl-9 pr-3 py-2 text-xs text-[#17233C] dark:text-slate-100 placeholder:text-[#94A3B8] focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
            />
          </div>

          {/* 4 Main Filter Tabs */}
          <div className="grid grid-cols-4 gap-1 rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F3F6FC] dark:bg-slate-900 p-1">
            {(
              [
                { id: "all", label: t.library.allTab },
                { id: "sources", label: t.library.sourcesTab },
                { id: "notes", label: t.library.notesTab },
                { id: "favorites", label: t.library.favoritesTab },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`rounded-lg py-1.5 px-1.5 text-[11px] font-bold truncate transition-colors ${
                  filterTab === tab.id
                    ? "bg-[#2F80ED] text-white shadow-sm"
                    : "text-[#6F7E93] dark:text-slate-400 hover:text-[#17233C] dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Secondary Status Filter & Favorites-First Sort */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <select
              aria-label={t.library.statusAll}
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as LibraryStatusFilter)
              }
              className="rounded-lg border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-[#17233C] dark:text-slate-200 focus:border-[#2F80ED] focus:outline-none"
            >
              <option value="all">{t.library.statusAll}</option>
              <option value="needs_review">{t.library.statusNeedsReview}</option>
              <option value="user_edited">{t.library.statusEdited}</option>
            </select>

            <button
              type="button"
              onClick={() => setFavoritesFirst((f) => !f)}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                favoritesFirst
                  ? "border-[#FCD34D] dark:border-amber-700/70 bg-[#FFFBEB] dark:bg-amber-950/50 text-[#B45309] dark:text-amber-300"
                  : "border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#6F7E93] dark:text-slate-400"
              }`}
            >
              <Star className={`h-3 w-3 ${favoritesFirst ? "fill-current" : ""}`} />
              {t.library.favoritesFirst}
            </button>
          </div>

          {/* Scrollable Item Cards */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#DFE6F0] dark:border-slate-700 p-6 text-center text-xs text-[#6F7E93] dark:text-slate-400">
                {t.library.emptyList}
              </div>
            ) : (
              items.map((entry) => {
                const isSelected =
                  selected?.itemType === entry.kind &&
                  selected?.itemId === entry.id;

                if (entry.kind === "source") {
                  const s = entry.item;
                  return (
                    <div
                      key={`src-${s.id}`}
                      onClick={() => {
                        setSelected({ itemType: "source", itemId: s.id });
                        setIsEditingNode(false);
                        setShowAiRevise(false);
                        setAiPreview(null);
                      }}
                      className={`cursor-pointer rounded-xl border p-3 transition-all flex items-start justify-between gap-2.5 ${
                        isSelected
                          ? "border-[#2F80ED] bg-[#EAF2FF]/50 dark:bg-blue-950/35 ring-2 ring-[#2F80ED]/15"
                          : s.isFavorite
                            ? "border-[#FCD34D] dark:border-amber-800/70 bg-[#FFFBEB]/40 dark:bg-amber-950/15 hover:border-[#2F80ED]/60"
                            : "border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/40 hover:border-[#2F80ED]/50"
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#A7F3D0] dark:border-emerald-700/60 px-2 py-0.5 text-[10px] font-bold text-[#047857] dark:text-emerald-300">
                            {t.library.statusBadges.user_source}
                          </span>
                          <span className="rounded-full bg-white dark:bg-slate-800 border border-[#DFE6F0] dark:border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-[#6F7E93] dark:text-slate-300">
                            {sourceFormatLabel(s.format, lang)}
                          </span>
                        </div>
                        <div className="text-xs font-extrabold text-[#17233C] dark:text-slate-100 truncate">
                          {s.title}
                        </div>
                        <div className="text-[11px] text-[#6F7E93] dark:text-slate-400 line-clamp-1">
                          {s.excerptOrNotes}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavoriteSource(s.id);
                        }}
                        aria-label={t.reader.favorite}
                        className={`shrink-0 rounded-lg p-1 transition-colors ${
                          s.isFavorite
                            ? "text-[#F59E0B]"
                            : "text-[#94A3B8] hover:text-[#F59E0B]"
                        }`}
                      >
                        <Star
                          className={`h-4 w-4 ${s.isFavorite ? "fill-current" : ""}`}
                        />
                      </button>
                    </div>
                  );
                }

                const n = entry.item;
                const reg =
                  KNOWLEDGE_REGIONS[n.region] || KNOWLEDGE_REGIONS["REG-01"];
                return (
                  <div
                    key={`node-${n.id}`}
                    onClick={() => {
                      setSelected({ itemType: "node", itemId: n.id });
                      setIsEditingNode(false);
                      setIsEditingSource(false);
                      setShowAiRevise(false);
                      setAiPreview(null);
                    }}
                    className={`cursor-pointer rounded-xl border p-3 transition-all flex items-start justify-between gap-2.5 ${
                      isSelected
                        ? "border-[#2F80ED] bg-[#EAF2FF]/50 dark:bg-blue-950/35 ring-2 ring-[#2F80ED]/15"
                        : n.isFavorite
                          ? "border-[#FCD34D] dark:border-amber-800/70 bg-[#FFFBEB]/40 dark:bg-amber-950/15 hover:border-[#2F80ED]/60"
                          : "border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#0F172A]/60 hover:border-[#2F80ED]/50"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {n.origin === "user_edited" ? (
                          <span className="rounded-full bg-[#F5F3FF] dark:bg-violet-950/60 border border-[#DDD6FE] dark:border-violet-700/60 px-2 py-0.5 text-[10px] font-bold text-[#6D28D9] dark:text-violet-300">
                            {t.library.statusBadges.user_edited}
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#EAF2FF] dark:bg-blue-950/60 border border-[#BFDBFE] dark:border-blue-800 px-2 py-0.5 text-[10px] font-bold text-[#2F80ED] dark:text-blue-300">
                            {t.library.statusBadges.ai_generated}
                          </span>
                        )}
                        {n.reviewStatus === "needs_review" && (
                          <span className="rounded-full bg-[#FEF3C7] dark:bg-amber-950/60 border border-[#FCD34D] dark:border-amber-700/60 px-2 py-0.5 text-[10px] font-bold text-[#92400E] dark:text-amber-300">
                            {t.library.statusBadges.needs_review}
                          </span>
                        )}
                        {n.reviewStatus === "reviewed" && (
                          <span className="rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#A7F3D0] dark:border-emerald-700/60 px-2 py-0.5 text-[10px] font-bold text-[#047857] dark:text-emerald-300">
                            {t.library.statusBadges.reviewed}
                          </span>
                        )}
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${reg.badgeClass}`}
                        >
                          {regionShortName(n.region, lang)}
                        </span>
                      </div>
                      <div className="text-xs font-extrabold text-[#17233C] dark:text-slate-100 truncate">
                        {n.title}
                      </div>
                      <div className="text-[11px] text-[#6F7E93] dark:text-slate-400 line-clamp-1">
                        {n.userAnnotation ? `📝 ${n.userAnnotation}` : n.summary}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavoriteNode(n.id);
                      }}
                      aria-label={t.reader.favorite}
                      className={`shrink-0 rounded-lg p-1 transition-colors ${
                        n.isFavorite
                          ? "text-[#F59E0B]"
                          : "text-[#94A3B8] hover:text-[#F59E0B]"
                      }`}
                    >
                      <Star
                        className={`h-4 w-4 ${n.isFavorite ? "fill-current" : ""}`}
                      />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT PANE: Detail Reader / Editor / AI Revise / History */}
        <section className="lg:col-span-7 rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 sm:p-6 shadow-sm space-y-5 min-h-[540px]">
          {!activeNode && !activeSource && (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 text-xs text-[#6F7E93] dark:text-slate-400">
              <BookOpen className="h-8 w-8 mb-3 text-[#2F80ED]/60" />
              <p className="max-w-sm leading-relaxed">{t.library.selectHint}</p>
            </div>
          )}

          {/* SOURCE DETAIL WORKSPACE */}
          {activeSource && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#DFE6F0] dark:border-slate-800 pb-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#A7F3D0] dark:border-emerald-700/60 px-2.5 py-0.5 text-xs font-bold text-[#047857] dark:text-emerald-300">
                      {t.library.statusBadges.user_source}
                    </span>
                    <span className="rounded-full bg-[#F3F6FC] dark:bg-slate-800 border border-[#DFE6F0] dark:border-slate-700 px-2.5 py-0.5 text-xs font-semibold text-[#6F7E93] dark:text-slate-300">
                      {sourceFormatLabel(activeSource.format, lang)}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-[#17233C] dark:text-slate-100">
                    {activeSource.title}
                  </h2>
                  {activeSource.chapterOrSection && (
                    <div className="text-xs font-semibold text-[#6F7E93] dark:text-slate-400">
                      {activeSource.chapterOrSection}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleFavoriteSource(activeSource.id)}
                    aria-label={t.reader.favorite}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 ${
                      activeSource.isFavorite
                        ? "border-[#FCD34D] bg-[#FFFBEB] dark:bg-amber-950/60 text-[#B45309] dark:text-amber-300"
                        : "border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#6F7E93] dark:text-slate-300"
                    }`}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${
                        activeSource.isFavorite ? "fill-current" : ""
                      }`}
                    />
                    {activeSource.isFavorite ? t.reader.unfavorite : t.reader.favorite}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingSource((s) => !s)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 hover:border-[#2F80ED] px-3 py-1.5 text-xs font-bold text-[#17233C] dark:text-slate-100"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-[#2F80ED]" />
                    {isEditingSource ? t.library.doneEditing : t.library.editNote}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAddExploration(activeSource.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-3.5 py-1.5 text-xs font-bold text-white"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {t.library.mapFromSource}
                  </button>
                </div>
              </div>

              {isEditingSource ? (
                <form
                  onSubmit={(e) => handleCreateOrSaveSource(e, false)}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                        {t.exploreModal.materialTitle}
                      </label>
                      <input
                        type="text"
                        required
                        value={srcTitle}
                        onChange={(e) => setSrcTitle(e.target.value)}
                        className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                        {t.exploreModal.chapterSection}
                      </label>
                      <input
                        type="text"
                        value={srcChapter}
                        onChange={(e) => setSrcChapter(e.target.value)}
                        className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                      {t.exploreModal.focusQuestion}
                    </label>
                    <input
                      type="text"
                      value={srcQuestion}
                      onChange={(e) => setSrcQuestion(e.target.value)}
                      className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                      {t.library.excerptLabel}
                    </label>
                    <textarea
                      rows={4}
                      value={srcExcerpt}
                      onChange={(e) => setSrcExcerpt(e.target.value)}
                      className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingSource(false)}
                      className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 px-4 py-2 text-xs font-bold text-[#6F7E93] dark:text-slate-300"
                    >
                      {t.library.cancel}
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-4 py-2 text-xs font-bold text-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {t.library.saveSource}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/50 p-4 space-y-2">
                    <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#2F80ED] dark:text-blue-400">
                      {t.exploreModal.focusQuestion}
                    </div>
                    <p className="text-xs font-semibold text-[#17233C] dark:text-slate-200">
                      {activeSource.focusQuestion || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4 space-y-2">
                    <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#0D9468] dark:text-emerald-400">
                      {t.library.excerptLabel}
                    </div>
                    <p className="text-sm leading-relaxed text-[#334155] dark:text-slate-300 whitespace-pre-line">
                      {activeSource.excerptOrNotes}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#6F7E93] dark:text-slate-400">
                      {t.library.linkedTopics}
                    </div>
                    {activeSource.linkedNodeIds.length === 0 ? (
                      <p className="text-xs text-[#6F7E93] dark:text-slate-400">
                        {t.library.noLinkedTopics}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {activeSource.linkedNodeIds.map((nid) => {
                          const target = vault.nodes.find((vn) => vn.id === nid);
                          if (!target) return null;
                          return (
                            <button
                              key={nid}
                              type="button"
                              onClick={() => onViewInTree(target.id)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#BFDBFE] dark:border-blue-800 bg-[#EAF2FF] dark:bg-blue-950/60 px-3 py-1 text-xs font-bold text-[#2F80ED] dark:text-blue-300 hover:brightness-95"
                            >
                              <Network className="h-3.5 w-3.5" />
                              {target.title}
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TOPIC NOTE DETAIL WORKSPACE */}
          {activeNode && (
            <div className="space-y-5">
              {/* Top Bar */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#DFE6F0] dark:border-slate-800 pb-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {activeNode.origin === "user_edited" ? (
                      <span className="rounded-full bg-[#F5F3FF] dark:bg-violet-950/60 border border-[#DDD6FE] dark:border-violet-700/60 px-2.5 py-0.5 text-xs font-bold text-[#6D28D9] dark:text-violet-300">
                        {t.library.statusBadges.user_edited}
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#EAF2FF] dark:bg-blue-950/60 border border-[#BFDBFE] dark:border-blue-800 px-2.5 py-0.5 text-xs font-bold text-[#2F80ED] dark:text-blue-300">
                        {t.library.statusBadges.ai_generated}
                      </span>
                    )}
                    {activeNode.reviewStatus === "needs_review" && (
                      <span className="rounded-full bg-[#FEF3C7] dark:bg-amber-950/60 border border-[#FCD34D] dark:border-amber-700/60 px-2.5 py-0.5 text-xs font-bold text-[#92400E] dark:text-amber-300">
                        {t.library.statusBadges.needs_review}
                      </span>
                    )}
                    {activeNode.reviewStatus === "reviewed" && (
                      <span className="rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#A7F3D0] dark:border-emerald-700/60 px-2.5 py-0.5 text-xs font-bold text-[#047857] dark:text-emerald-300">
                        {t.library.statusBadges.reviewed}
                      </span>
                    )}
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                        (KNOWLEDGE_REGIONS[activeNode.region] || KNOWLEDGE_REGIONS["REG-01"])
                          .badgeClass
                      }`}
                    >
                      {regionShortName(activeNode.region, lang)}
                    </span>
                    <span className="rounded-full bg-[#F3F6FC] dark:bg-slate-800 border border-[#DFE6F0] dark:border-slate-700 px-2.5 py-0.5 text-xs font-semibold text-[#6F7E93] dark:text-slate-300">
                      {difficultyLabel(activeNode.difficulty, lang)}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-[#17233C] dark:text-slate-100">
                    {activeNode.title}
                  </h2>
                </div>

                {/* Action Pills */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleFavoriteNode(activeNode.id)}
                    aria-label={t.reader.favorite}
                    className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold inline-flex items-center gap-1 ${
                      activeNode.isFavorite
                        ? "border-[#FCD34D] bg-[#FFFBEB] dark:bg-amber-950/60 text-[#B45309] dark:text-amber-300"
                        : "border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#6F7E93] dark:text-slate-300"
                    }`}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${
                        activeNode.isFavorite ? "fill-current" : ""
                      }`}
                    />
                    <span className="hidden sm:inline">
                      {activeNode.isFavorite
                        ? t.reader.unfavorite
                        : t.reader.favorite}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingNode((e) => !e);
                      setShowAiRevise(false);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                      isEditingNode
                        ? "border-[#6D28D9] bg-[#F5F3FF] dark:bg-violet-950/60 text-[#6D28D9] dark:text-violet-300"
                        : "border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 hover:border-[#2F80ED] text-[#17233C] dark:text-slate-100"
                    }`}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    {isEditingNode ? t.library.doneEditing : t.library.editNote}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAiRevise((s) => !s);
                      setIsEditingNode(false);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                      showAiRevise
                        ? "border-[#2F80ED] bg-[#EAF2FF] dark:bg-blue-950/60 text-[#2F80ED] dark:text-blue-300"
                        : "border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 hover:border-[#2F80ED] text-[#17233C] dark:text-slate-100"
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#2F80ED] dark:text-blue-400" />
                    {t.library.askAiRevise}
                  </button>

                  <button
                    type="button"
                    onClick={() => onViewInTree(activeNode.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                  >
                    <Network className="h-3.5 w-3.5" />
                    {t.library.viewInTree}
                  </button>
                </div>
              </div>

              {/* Non-Destructive Needs Review Banner */}
              {activeNode.reviewStatus === "needs_review" && (
                <div className="rounded-2xl border border-[#FCD34D] dark:border-amber-700/70 bg-[#FFFBEB] dark:bg-amber-950/35 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <AlertTriangle className="h-4 w-4 text-[#D97706] dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold text-[#92400E] dark:text-amber-200">
                        {t.library.needsReviewBannerTitle}
                      </div>
                      <p className="text-xs text-[#78350F] dark:text-amber-100/90">
                        {activeNode.reviewReason}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onMarkNodeReviewed(activeNode.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D9468] hover:bg-[#0B7C57] px-3.5 py-2 text-xs font-bold text-white shrink-0"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t.library.markReviewed}
                  </button>
                </div>
              )}

              {/* AI Revise Preview Drawer (Never auto-overwrites!) */}
              {showAiRevise && (
                <div className="rounded-2xl border border-[#BFDBFE] dark:border-blue-800/70 bg-[#F5F9FF] dark:bg-blue-950/25 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-[#2F80ED] dark:text-blue-300">
                      <Sparkles className="h-4 w-4" />
                      {t.library.askAiRevise}
                    </div>
                    <div className="inline-flex rounded-lg border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5">
                      {(
                        [
                          { id: "simple", label: t.reader.simple },
                          { id: "standard", label: t.reader.standard },
                          { id: "deep", label: t.reader.deep },
                        ] as const
                      ).map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setReviseDepth(d.id)}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${
                            reviseDepth === d.id
                              ? "bg-[#2F80ED] text-white"
                              : "text-[#6F7E93] dark:text-slate-400"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {t.library.aiRevisePresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setReviseInstruction(preset)}
                        className="rounded-full border border-[#BFDBFE] dark:border-blue-800 bg-white dark:bg-slate-900 px-2.5 py-0.5 text-[11px] font-semibold text-[#2F80ED] dark:text-blue-300 hover:bg-[#EAF2FF]"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={reviseInstruction}
                      onChange={(e) => setReviseInstruction(e.target.value)}
                      placeholder={t.library.aiRevisePlaceholder}
                      className="flex-1 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={isRevising}
                      onClick={() => void handleRequestAiPreview()}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] disabled:opacity-50 px-4 py-2 text-xs font-bold text-white shrink-0"
                    >
                      {isRevising ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {t.library.revising}
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          {t.library.generatePreview}
                        </>
                      )}
                    </button>
                  </div>

                  {aiPreview && (
                    <div className="rounded-xl border border-[#2F80ED]/50 bg-white dark:bg-[#0F172A] p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-[#17233C] dark:text-slate-100">
                          {t.library.previewTitle}
                        </span>
                        <span className="text-[11px] font-medium text-[#6F7E93] dark:text-slate-400">
                          {aiPreview.rationale}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/50 p-3 space-y-1">
                          <div className="text-[10px] font-extrabold uppercase text-[#6F7E93]">
                            {t.library.previewCurrent}
                          </div>
                          <p className="text-[#475569] dark:text-slate-300 leading-relaxed">
                            {activeNode.levels[reviseDepth]}
                          </p>
                        </div>
                        <div className="rounded-xl border border-[#A7F3D0] dark:border-emerald-700/70 bg-[#ECFDF5]/60 dark:bg-emerald-950/30 p-3 space-y-1">
                          <div className="text-[10px] font-extrabold uppercase text-[#047857] dark:text-emerald-300">
                            {t.library.previewProposed}
                          </div>
                          <p className="text-[#17233C] dark:text-slate-100 leading-relaxed font-medium">
                            {aiPreview.levels[reviseDepth]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setAiPreview(null)}
                          className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 px-3.5 py-1.5 text-xs font-bold text-[#6F7E93] dark:text-slate-300"
                        >
                          {t.library.discardPreview}
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyAiPreview}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D9468] hover:bg-[#0B7C57] px-4 py-1.5 text-xs font-bold text-white"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t.library.applyRevision}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Editor vs Reading View */}
              {isEditingNode ? (
                <form onSubmit={handleSaveManualEdit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                      {t.library.summaryLabel}
                    </label>
                    <textarea
                      rows={2}
                      value={draftSummary}
                      onChange={(e) => setDraftSummary(e.target.value)}
                      className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2.5">
                    {(
                      [
                        { key: "simple", label: t.reader.simple },
                        { key: "standard", label: t.reader.standard },
                        { key: "deep", label: t.reader.deep },
                      ] as const
                    ).map((lvl) => (
                      <div key={lvl.key}>
                        <label className="block text-xs font-bold text-[#2F80ED] dark:text-blue-400 mb-1">
                          {lvl.label}
                        </label>
                        <textarea
                          rows={2}
                          value={draftLevels[lvl.key]}
                          onChange={(e) =>
                            setDraftLevels((prev) => ({
                              ...prev,
                              [lvl.key]: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-xs text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                        {t.library.formulaLabel}
                      </label>
                      <input
                        type="text"
                        value={draftFormula}
                        onChange={(e) => setDraftFormula(e.target.value)}
                        className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-xs font-mono text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                        {t.library.applicationLabel}
                      </label>
                      <input
                        type="text"
                        value={draftApplication}
                        onChange={(e) => setDraftApplication(e.target.value)}
                        className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-xs text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#6D28D9] dark:text-violet-300 mb-1">
                      {t.library.annotationLabel}
                    </label>
                    <textarea
                      rows={2}
                      value={draftAnnotation}
                      placeholder={t.library.annotationPlaceholder}
                      onChange={(e) => setDraftAnnotation(e.target.value)}
                      className="w-full rounded-xl border border-[#DDD6FE] dark:border-violet-800/70 bg-[#FAF5FF] dark:bg-violet-950/20 px-3 py-2 text-xs text-[#17233C] dark:text-slate-100 focus:border-[#6D28D9] focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingNode(false)}
                      className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 px-4 py-2 text-xs font-bold text-[#6F7E93] dark:text-slate-300"
                    >
                      {t.library.cancel}
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-5 py-2 text-xs font-bold text-white shadow-sm"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {t.library.saveChanges}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* Explanation Depth Switcher */}
                  <div className="grid grid-cols-3 gap-1 rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F3F6FC] dark:bg-slate-900 p-1">
                    {(
                      [
                        { key: "simple", label: t.reader.simple },
                        { key: "standard", label: t.reader.standard },
                        { key: "deep", label: t.reader.deep },
                      ] as const
                    ).map((lvl) => (
                      <button
                        key={lvl.key}
                        type="button"
                        onClick={() => setReadDepth(lvl.key)}
                        className={`rounded-lg py-1.5 text-xs font-bold transition-colors ${
                          readDepth === lvl.key
                            ? "bg-[#2F80ED] text-white shadow-sm"
                            : "text-[#6F7E93] dark:text-slate-400 hover:text-[#17233C] dark:hover:text-slate-200"
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/45 p-4 space-y-2">
                    <p className="text-xs font-semibold text-[#6F7E93] dark:text-slate-400">
                      {activeNode.summary}
                    </p>
                    <p className="text-sm leading-relaxed text-[#17233C] dark:text-slate-200">
                      {activeNode.levels[readDepth]}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#FDE68A] dark:border-amber-800/60 bg-[#FFFBEB] dark:bg-amber-950/35 px-3.5 py-2.5">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#B45309] dark:text-amber-300">
                        {t.library.formulaLabel}
                      </div>
                      <div className="mt-1 font-mono text-xs font-semibold text-[#78350F] dark:text-amber-100">
                        {activeNode.formula}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/60 px-3.5 py-2.5">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#0D9468] dark:text-emerald-400">
                        {t.library.applicationLabel}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#475569] dark:text-slate-300">
                        {activeNode.application}
                      </p>
                    </div>
                  </div>

                  {/* Personal Annotation Block */}
                  <div className="rounded-2xl border border-[#DDD6FE] dark:border-violet-800/60 bg-[#FAF5FF] dark:bg-violet-950/25 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#6D28D9] dark:text-violet-300">
                        <StickyNote className="h-3.5 w-3.5" />
                        {t.library.annotationLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingNode(true)}
                        className="text-[11px] font-bold text-[#6D28D9] dark:text-violet-300 hover:underline"
                      >
                        {t.library.editNote}
                      </button>
                    </div>
                    <p className="text-xs leading-relaxed text-[#334155] dark:text-slate-200">
                      {activeNode.userAnnotation?.trim()
                        ? activeNode.userAnnotation
                        : t.library.annotationPlaceholder}
                    </p>
                  </div>
                </div>
              )}

              {/* Revision History & Restore */}
              <div className="border-t border-[#DFE6F0] dark:border-slate-800 pt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setShowRevisions((s) => !s)}
                  className="flex w-full items-center justify-between text-xs font-extrabold uppercase tracking-wider text-[#6F7E93] dark:text-slate-400"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-[#2F80ED]" />
                    {t.library.revisionsTitle} (
                    {(activeNode.revisions || []).length})
                  </span>
                  <span>{showRevisions ? "−" : "+"}</span>
                </button>

                {showRevisions && (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {[...(activeNode.revisions || [])]
                      .sort((a, b) => b.version - a.version)
                      .map((rev, idx) => {
                        const isLatest = idx === 0;
                        const isExpanded = expandedRevId === rev.id;
                        return (
                          <div
                            key={rev.id}
                            className="rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/45 p-3 text-xs space-y-1.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono font-extrabold text-[#17233C] dark:text-slate-100">
                                  {t.library.versionPrefix}
                                  {rev.version}
                                </span>
                                <span className="rounded-full bg-white dark:bg-slate-800 border border-[#DFE6F0] dark:border-slate-700 px-2 py-0.5 text-[10px] font-bold text-[#2F80ED] dark:text-blue-300">
                                  {revisionKindLabel(rev.kind, lang)}
                                </span>
                                <span className="text-[11px] font-semibold text-[#6F7E93] dark:text-slate-400">
                                  {rev.label}
                                </span>
                                {isLatest && (
                                  <span className="rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-[#047857] dark:text-emerald-300">
                                    {t.library.currentTag}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedRevId((prev) =>
                                      prev === rev.id ? null : rev.id
                                    )
                                  }
                                  className="text-[11px] font-bold text-[#6F7E93] dark:text-slate-300 hover:underline"
                                >
                                  {isExpanded ? "−" : "+"}
                                </button>
                                {!isLatest && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onRestoreRevision(activeNode.id, rev)
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-[#BFDBFE] dark:border-blue-800 bg-[#EAF2FF] dark:bg-blue-950/60 px-2.5 py-0.5 text-[10.5px] font-bold text-[#2F80ED] dark:text-blue-300 hover:brightness-95"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    {t.library.restoreVersion}
                                  </button>
                                )}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="pt-1.5 border-t border-[#DFE6F0] dark:border-slate-700 space-y-1 text-[11px] text-[#475569] dark:text-slate-300">
                                <p>
                                  <strong>{t.library.summaryLabel}:</strong>{" "}
                                  {rev.summary}
                                </p>
                                <p>
                                  <strong>{t.reader.standard}:</strong>{" "}
                                  {rev.levels.standard}
                                </p>
                                {rev.userAnnotation && (
                                  <p>
                                    <strong>{t.library.annotationLabel}:</strong>{" "}
                                    {rev.userAnnotation}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Add Standalone User Source Modal */}
      {showNewSourceModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#17263C]/45 dark:bg-black/65 backdrop-blur-sm p-4"
          onClick={() => setShowNewSourceModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#DFE6F0] dark:border-slate-800 pb-3">
              <h2 className="text-lg font-extrabold text-[#17233C] dark:text-slate-100">
                {t.library.sourceModalTitle}
              </h2>
              <button
                type="button"
                onClick={() => setShowNewSourceModal(false)}
                className="rounded-xl p-1.5 text-[#6F7E93] hover:bg-[#F3F6FC] dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => handleCreateOrSaveSource(e, true)}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                    {t.exploreModal.materialTitle} *
                  </label>
                  <input
                    type="text"
                    required
                    value={srcTitle}
                    placeholder={t.exploreModal.materialTitlePlaceholder}
                    onChange={(e) => setSrcTitle(e.target.value)}
                    className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                    {t.exploreModal.sourceFormat}
                  </label>
                  <select
                    value={srcFormat}
                    onChange={(e) =>
                      setSrcFormat(e.target.value as SourceFormat)
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
                  value={srcChapter}
                  placeholder={t.exploreModal.chapterSectionPlaceholder}
                  onChange={(e) => setSrcChapter(e.target.value)}
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                  {t.exploreModal.focusQuestion}
                </label>
                <input
                  type="text"
                  value={srcQuestion}
                  onChange={(e) => setSrcQuestion(e.target.value)}
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                  {t.library.excerptLabel}
                </label>
                <textarea
                  rows={3}
                  value={srcExcerpt}
                  placeholder={t.exploreModal.excerptNotesPlaceholder}
                  onChange={(e) => setSrcExcerpt(e.target.value)}
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DFE6F0] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewSourceModal(false)}
                  className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 px-4 py-2 text-xs font-bold text-[#6F7E93] dark:text-slate-300"
                >
                  {t.library.cancel}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D9468] hover:bg-[#0B7C57] px-4 py-2 text-xs font-bold text-white"
                >
                  <Check className="h-3.5 w-3.5" />
                  {t.library.saveSource}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
