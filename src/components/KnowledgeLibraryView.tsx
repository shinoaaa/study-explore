"use client";

import {
  difficultyLabel,
  edgeShortLabel,
  Language,
  regionShortName,
  revisionKindLabel,
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
  RegionCode,
  SourceFormat,
} from "@/types/knowledge";
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  History,
  Layers,
  ListFilter,
  Loader2,
  Lock,
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
  onToggleFavoriteSource?: (sourceId: string) => void;
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
  onSaveSource?: (source: {
    id?: string;
    title: string;
    format: SourceFormat;
    chapterOrSection: string;
    excerptOrNotes: string;
    focusQuestion: string;
  }) => LearningSource;
  onViewInTree: (nodeId: string) => void;
  onOpenAddExploration: (targetNode?: KnowledgeNode) => void;
  onExpandNode?: (nodeId: string) => Promise<void>;
  isExpandingNode?: boolean;
  openAddSourceTrigger?: number;
  lang: Language;
}

const ALL_REGION_CODES: RegionCode[] = [
  "REG-01",
  "REG-02",
  "REG-03",
  "REG-04",
  "REG-05",
  "REG-06",
];

export default function KnowledgeLibraryView({
  vault,
  initialSelection,
  initialFilter = "all",
  initialStatusFilter = "all",
  onToggleFavoriteNode,
  onSaveNodeEdit,
  onMarkNodeReviewed,
  onRestoreRevision,
  onViewInTree,
  onOpenAddExploration,
  onExpandNode,
  isExpandingNode = false,
  lang,
}: KnowledgeLibraryViewProps) {
  const t = UI_COPY[lang];

  // Drawer / Popup state for Node List & Filters
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "favorites">(
    initialFilter === "favorites" ? "favorites" : "all"
  );
  const [statusFilter, setStatusFilter] =
    useState<LibraryStatusFilter>(initialStatusFilter);
  const [regionFilter, setRegionFilter] = useState<RegionCode | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Node ID for Full-Page Reader
  const exploredNodes = useMemo(
    () => vault.nodes.filter((n) => n.explored),
    [vault.nodes]
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string>(() => {
    if (initialSelection?.itemId) {
      const target = vault.nodes.find((n) => n.id === initialSelection.itemId);
      if (target && target.explored) return target.id;
    }
    return exploredNodes[0]?.id || vault.nodes[0]?.id || "";
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

  // Revisions expanded state
  const [showRevisions, setShowRevisions] = useState(false);

  useEffect(() => {
    if (initialFilter === "favorites") setFilterTab("favorites");
    else setFilterTab("all");
  }, [initialFilter]);

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  useEffect(() => {
    if (initialSelection?.itemId) {
      const target = vault.nodes.find((n) => n.id === initialSelection.itemId);
      if (target && target.explored) {
        setSelectedNodeId(target.id);
        setIsEditingNode(Boolean(initialSelection.startInEditMode));
        setShowAiRevise(false);
        setAiPreview(null);
        return;
      }
    }
    if (
      !vault.nodes.some((n) => n.id === selectedNodeId && n.explored) &&
      exploredNodes[0]
    ) {
      setSelectedNodeId(exploredNodes[0].id);
    }
  }, [
    initialSelection?.itemId,
    initialSelection?.startInEditMode,
    vault.nodes,
    exploredNodes,
    selectedNodeId,
  ]);

  const filteredDrawerNodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vault.nodes.filter((n) => {
      if (regionFilter !== "ALL" && n.region !== regionFilter) return false;
      if (filterTab === "favorites" && !n.isFavorite) return false;
      if (
        statusFilter === "needs_review" &&
        n.reviewStatus !== "needs_review"
      ) {
        return false;
      }
      if (statusFilter === "user_edited" && n.origin !== "user_edited") {
        return false;
      }
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        (n.summary || "").toLowerCase().includes(q) ||
        (n.userAnnotation || "").toLowerCase().includes(q)
      );
    });
  }, [vault.nodes, regionFilter, filterTab, statusFilter, searchQuery]);

  const selectedNode = useMemo(() => {
    return (
      vault.nodes.find((n) => n.id === selectedNodeId && n.explored) ||
      exploredNodes[0] ||
      null
    );
  }, [vault.nodes, selectedNodeId, exploredNodes]);

  // Populate edit draft when switching node
  useEffect(() => {
    if (!selectedNode) return;
    setDraftSummary(selectedNode.summary);
    setDraftLevels({
      simple: selectedNode.levels.simple,
      standard: selectedNode.levels.standard,
      deep: selectedNode.levels.deep,
    });
    setDraftFormula(selectedNode.formula);
    setDraftApplication(selectedNode.application);
    setDraftAnnotation(selectedNode.userAnnotation || "");
  }, [selectedNode]);

  const currentExploredIdx = selectedNode
    ? exploredNodes.findIndex((n) => n.id === selectedNode.id)
    : -1;

  const handlePrevNode = () => {
    if (exploredNodes.length <= 1 || currentExploredIdx < 0) return;
    const prevIdx =
      (currentExploredIdx - 1 + exploredNodes.length) % exploredNodes.length;
    setSelectedNodeId(exploredNodes[prevIdx].id);
    setIsEditingNode(false);
    setShowAiRevise(false);
    setAiPreview(null);
  };

  const handleNextNode = () => {
    if (exploredNodes.length <= 1 || currentExploredIdx < 0) return;
    const nextIdx = (currentExploredIdx + 1) % exploredNodes.length;
    setSelectedNodeId(exploredNodes[nextIdx].id);
    setIsEditingNode(false);
    setShowAiRevise(false);
    setAiPreview(null);
  };

  const handleSaveManualEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;
    onSaveNodeEdit(selectedNode.id, {
      summary: draftSummary.trim() || selectedNode.summary,
      levels: {
        simple: draftLevels.simple.trim() || selectedNode.levels.simple,
        standard: draftLevels.standard.trim() || selectedNode.levels.standard,
        deep: draftLevels.deep.trim() || selectedNode.levels.deep,
      },
      formula: draftFormula.trim() || selectedNode.formula,
      application: draftApplication.trim() || selectedNode.application,
      userAnnotation: draftAnnotation.trim(),
      kind: "manual_edit",
      label: lang === "en" ? "Manual Note Edit" : "Edit Catatan Manual",
    });
    setIsEditingNode(false);
  };

  const handleRequestAiRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode || !reviseInstruction.trim()) return;
    setIsRevising(true);
    try {
      const res = await fetch("/api/revise-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vault,
          node: selectedNode,
          instruction: reviseInstruction.trim(),
          targetDepth: reviseDepth,
          lang,
        }),
      });
      const json = await res.json();
      if (json?.ok && json.preview) {
        setAiPreview(json.preview);
      }
    } finally {
      setIsRevising(false);
    }
  };

  const handleApplyAiRevision = () => {
    if (!selectedNode || !aiPreview) return;
    onSaveNodeEdit(selectedNode.id, {
      summary: aiPreview.summary,
      levels: aiPreview.levels,
      formula: selectedNode.formula,
      application: selectedNode.application,
      userAnnotation: selectedNode.userAnnotation || "",
      kind: "ai_revise_accepted",
      label:
        lang === "en"
          ? `AI Revised: ${reviseInstruction.slice(0, 28)}`
          : `Revisi AI: ${reviseInstruction.slice(0, 28)}`,
    });
    setAiPreview(null);
    setShowAiRevise(false);
    setReviseInstruction("");
  };

  if (exploredNodes.length === 0) {
    return (
      <div className="mx-auto max-w-[1040px] w-full px-4 sm:px-8 py-10">
        <div className="rounded-3xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center space-y-4 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF2FF] dark:bg-blue-950/70 text-[#2F80ED] dark:text-blue-400">
            <BookOpen className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-extrabold text-[#17233C] dark:text-slate-100">
            {t.library.emptyList}
          </h2>
          <p className="text-xs text-[#6F7E93] dark:text-slate-400 max-w-md mx-auto">
            {t.library.selectHint}
          </p>
          <button
            type="button"
            onClick={() => onOpenAddExploration()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-5 py-2.5 text-xs font-bold text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>{lang === "en" ? "Open First Node" : "Buka Node Pertama"}</span>
          </button>
        </div>
      </div>
    );
  }

  const regDef = selectedNode
    ? KNOWLEDGE_REGIONS[selectedNode.region] || KNOWLEDGE_REGIONS["REG-01"]
    : KNOWLEDGE_REGIONS["REG-01"];

  const incomingEdges = selectedNode
    ? vault.edges.filter((e) => e.target === selectedNode.id)
    : [];
  const outgoingEdges = selectedNode
    ? vault.edges.filter((e) => e.source === selectedNode.id)
    : [];

  return (
    <div className="mx-auto max-w-[1060px] w-full px-4 sm:px-8 py-6 space-y-5">
      {/* 1. CLEAN TOP READER BAR: Node Switcher Drawer Trigger + Prev/Next + Region Quick Filter + New Node */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            data-testid="library-open-drawer-btn"
            className="inline-flex items-center gap-2 rounded-xl border border-[#2F80ED]/40 bg-[#EAF2FF] dark:bg-blue-950/70 hover:bg-[#2F80ED] text-[#2F80ED] dark:text-blue-300 hover:text-white px-3.5 py-2 text-xs font-extrabold transition-colors"
          >
            <ListFilter className="h-4 w-4" />
            <span>
              {lang === "en" ? "Node List" : "Daftar Node"} ({vault.nodes.length})
            </span>
          </button>

          {/* Direct Region Filter Select in Top Bar */}
          <div className="relative flex items-center">
            <Layers className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#6F7E93] dark:text-slate-400" />
            <select
              aria-label="Filter by region"
              data-testid="library-region-filter"
              value={regionFilter}
              onChange={(e) => {
                const nextReg = e.target.value as RegionCode | "ALL";
                setRegionFilter(nextReg);
                if (nextReg !== "ALL") {
                  const firstInReg = exploredNodes.find(
                    (n) => n.region === nextReg
                  );
                  if (firstInReg) {
                    setSelectedNodeId(firstInReg.id);
                  } else {
                    setIsDrawerOpen(true);
                  }
                }
              }}
              className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 pl-8 pr-6 py-2 text-xs font-bold text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
            >
              <option value="ALL">
                {lang === "en" ? "All Regions" : "Semua Bidang"}
              </option>
              {ALL_REGION_CODES.map((rc) => {
                const count = vault.nodes.filter((n) => n.region === rc).length;
                if (count === 0) return null;
                return (
                  <option key={rc} value={rc}>
                    {regionShortName(rc, lang)} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Prev / Next Opened Node Switcher */}
          {exploredNodes.length > 1 && (
            <div className="inline-flex items-center rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 p-0.5">
              <button
                type="button"
                onClick={handlePrevNode}
                aria-label="Previous node"
                className="p-1.5 rounded-lg text-[#6F7E93] hover:text-[#17233C] dark:hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-[11px] font-bold text-[#6F7E93] dark:text-slate-300">
                {currentExploredIdx + 1} / {exploredNodes.length}
              </span>
              <button
                type="button"
                onClick={handleNextNode}
                aria-label="Next node"
                className="p-1.5 rounded-lg text-[#6F7E93] hover:text-[#17233C] dark:hover:text-white transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpenAddExploration()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{lang === "en" ? "New Node" : "Node Baru"}</span>
        </button>
      </div>

      {/* 2. SLIDE-OVER SIDEBAR / POPUP MODAL FOR NODE LIST & REGION FILTER */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 z-50 flex justify-start bg-[#0F172A]/55 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            data-testid="library-node-drawer"
            className="w-full max-w-md h-full bg-white dark:bg-[#111827] border-r border-[#DFE6F0] dark:border-slate-800 p-5 flex flex-col gap-4 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#DFE6F0] dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#2F80ED] dark:text-blue-400" />
                <h3 className="text-base font-extrabold text-[#17233C] dark:text-slate-100">
                  {lang === "en" ? "Vault Nodes" : "Daftar Node Vault"} (
                  {filteredDrawerNodes.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 p-1.5 text-[#6F7E93] hover:text-[#17233C] dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C9AAE]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === "en" ? "Search nodes..." : "Cari judul atau isi node..."
                }
                className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
              />
            </div>

            {/* Filter by Region */}
            <div className="space-y-1.5">
              <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#6F7E93] dark:text-slate-400">
                {lang === "en" ? "Filter by Region" : "Filter Bidang Ilmu"}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setRegionFilter("ALL")}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    regionFilter === "ALL"
                      ? "bg-[#2F80ED] text-white"
                      : "bg-[#F3F6FC] dark:bg-slate-800 text-[#6F7E93] dark:text-slate-300"
                  }`}
                >
                  {lang === "en" ? "All" : "Semua"} ({vault.nodes.length})
                </button>
                {ALL_REGION_CODES.map((rc) => {
                  const count = vault.nodes.filter((n) => n.region === rc).length;
                  if (count === 0) return null;
                  return (
                    <button
                      type="button"
                      key={rc}
                      onClick={() => setRegionFilter(rc)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                        regionFilter === rc
                          ? "bg-[#2F80ED] text-white"
                          : "bg-[#F3F6FC] dark:bg-slate-800 text-[#6F7E93] dark:text-slate-300 hover:text-[#17233C] dark:hover:text-white"
                      }`}
                    >
                      {regionShortName(rc, lang)} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* All vs Favorites + Status Filter */}
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex rounded-xl bg-[#F3F6FC] dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setFilterTab("all")}
                  className={`rounded-lg px-3 py-1 text-xs font-bold ${
                    filterTab === "all"
                      ? "bg-white dark:bg-[#111827] text-[#2F80ED] shadow-sm"
                      : "text-[#6F7E93] dark:text-slate-300"
                  }`}
                >
                  {lang === "en" ? "All" : "Semua"}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("favorites")}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold ${
                    filterTab === "favorites"
                      ? "bg-white dark:bg-[#111827] text-[#B45309] dark:text-amber-300 shadow-sm"
                      : "text-[#6F7E93] dark:text-slate-300"
                  }`}
                >
                  <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                  {lang === "en" ? "Favorites" : "Favorit"}
                </button>
              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as LibraryStatusFilter)
                }
                className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-[#17233C] dark:text-slate-200"
              >
                <option value="all">{t.library.statusAll}</option>
                <option value="needs_review">
                  {t.library.statusNeedsReview}
                </option>
                <option value="user_edited">
                  {t.library.statusEdited}
                </option>
              </select>
            </div>

            {/* Scrollable Node List inside Drawer */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredDrawerNodes.map((n) => {
                const nReg =
                  KNOWLEDGE_REGIONS[n.region] || KNOWLEDGE_REGIONS["REG-01"];
                const isCurrent = selectedNode?.id === n.id;
                const isFog = !n.explored;

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (isFog) {
                        setIsDrawerOpen(false);
                        onOpenAddExploration(n);
                      } else {
                        setSelectedNodeId(n.id);
                        setIsEditingNode(false);
                        setShowAiRevise(false);
                        setAiPreview(null);
                        setIsDrawerOpen(false);
                      }
                    }}
                    className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                      isCurrent
                        ? "border-[#2F80ED] bg-[#EAF2FF]/65 dark:bg-blue-950/40 shadow-sm"
                        : isFog
                          ? "border-dashed border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900/50 opacity-85 hover:opacity-100"
                          : "border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-[#2F80ED]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            isFog
                              ? "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500"
                              : nReg.badgeClass
                          }`}
                        >
                          {regionShortName(nReg.code, lang)}
                        </span>
                        {isFog && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            <Lock className="h-2.5 w-2.5" />
                            Fog
                          </span>
                        )}
                      </div>

                      {!isFog && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavoriteNode(n.id);
                          }}
                          className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800"
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${
                              n.isFavorite
                                ? "fill-[#F59E0B] text-[#F59E0B]"
                                : "text-[#94A3B8]"
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    <div className="text-xs font-extrabold text-[#17233C] dark:text-slate-100">
                      {n.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. FULL-PAGE SINGLE-COLUMN NODE READER */}
      {selectedNode && (
        <article
          data-testid="library-fullpage-reader"
          className="rounded-3xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-10 shadow-sm space-y-6"
        >
          {/* Top Metadata & Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#DFE6F0] dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${regDef.badgeClass}`}
              >
                {regionShortName(regDef.code, lang)}
              </span>
              <span className="rounded-full bg-[#F3F6FC] dark:bg-slate-800 px-3 py-1 text-xs font-bold text-[#475569] dark:text-slate-300">
                {difficultyLabel(selectedNode.difficulty, lang)}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  selectedNode.origin === "user_edited"
                    ? "bg-[#F3E8FF] dark:bg-purple-950/70 text-[#6D28D9] dark:text-purple-300"
                    : selectedNode.origin === "user_source"
                      ? "bg-[#ECFDF5] dark:bg-emerald-950/70 text-[#047857] dark:text-emerald-300"
                      : "bg-[#EAF2FF] dark:bg-blue-950/70 text-[#2F80ED] dark:text-blue-300"
                }`}
              >
                {t.library.statusBadges[selectedNode.origin || "ai_generated"]}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleFavoriteNode(selectedNode.id)}
                data-testid="library-fav-btn"
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                  selectedNode.isFavorite
                    ? "border-[#FDE68A] dark:border-amber-700 bg-[#FFFBEB] dark:bg-amber-950/60 text-[#B45309] dark:text-amber-300"
                    : "border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#475569] dark:text-slate-200 hover:border-[#F59E0B]"
                }`}
              >
                <Star
                  className={`h-3.5 w-3.5 ${
                    selectedNode.isFavorite
                      ? "fill-[#F59E0B] text-[#F59E0B]"
                      : "text-[#94A3B8]"
                  }`}
                />
                <span>
                  {selectedNode.isFavorite
                    ? t.reader.unfavorite
                    : t.reader.favorite}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEditingNode((v) => !v);
                  setShowAiRevise(false);
                }}
                data-testid="library-edit-btn"
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                  isEditingNode
                    ? "border-[#2F80ED] bg-[#EAF2FF] dark:bg-blue-950/70 text-[#2F80ED] dark:text-blue-300"
                    : "border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#17233C] dark:text-slate-200 hover:border-[#2F80ED]"
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{t.library.editNote}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAiRevise((v) => !v);
                  setIsEditingNode(false);
                }}
                data-testid="library-ai-revise-btn"
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                  showAiRevise
                    ? "border-[#6D28D9] bg-[#F3E8FF] dark:bg-purple-950/70 text-[#6D28D9] dark:text-purple-300"
                    : "border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#17233C] dark:text-slate-200 hover:border-[#6D28D9]"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#6D28D9] dark:text-purple-400" />
                <span>{t.library.askAiRevise}</span>
              </button>

              {onExpandNode && (
                <button
                  type="button"
                  onClick={() => onExpandNode(selectedNode.id)}
                  disabled={isExpandingNode}
                  data-testid="library-expand-node-btn"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#2F80ED]/40 bg-[#EAF2FF] dark:bg-blue-950/60 hover:bg-[#2F80ED] text-[#2F80ED] dark:text-blue-300 hover:text-white px-3 py-2 text-xs font-bold transition-colors"
                >
                  {isExpandingNode ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {lang === "en" ? "Expand Branches" : "Kembangkan Cabang"}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onViewInTree(selectedNode.id)}
                data-testid="library-view-tree-btn"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors"
              >
                <Network className="h-3.5 w-3.5" />
                <span>{t.library.viewInTree}</span>
              </button>
            </div>
          </div>

          {/* Needs Review Banner if flagged */}
          {selectedNode.reviewStatus === "needs_review" && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#FED7AA] dark:border-orange-800/70 bg-[#FFF7ED] dark:bg-orange-950/40 p-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-[#C2410C] dark:text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-extrabold text-[#9A3412] dark:text-orange-300">
                    {t.library.needsReviewBannerTitle}
                  </div>
                  <p className="text-xs text-[#C2410C] dark:text-orange-200/90 mt-0.5">
                    {selectedNode.reviewReason ||
                      t.library.needsReviewBannerTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onMarkNodeReviewed(selectedNode.id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] px-3.5 py-2 text-xs font-bold text-white"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{t.library.markReviewed}</span>
              </button>
            </div>
          )}

          {/* Full-Width Title (Never squished!) */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17233C] dark:text-slate-100 leading-tight">
              {selectedNode.title}
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-[#475569] dark:text-slate-300 bg-[#F8FAFC] dark:bg-slate-800/50 rounded-2xl p-4 border border-[#DFE6F0] dark:border-slate-800">
              {selectedNode.summary}
            </p>
          </div>

          {/* Attached Node Input / Chapter / Prompt if provided */}
          {selectedNode.nodeSourceContent && (
            <div className="rounded-2xl border border-[#A7F3D0] dark:border-emerald-800/60 bg-[#ECFDF5]/80 dark:bg-emerald-950/30 p-4 space-y-1.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#047857] dark:text-emerald-300">
                {selectedNode.nodeInputMode === "book_chapter"
                  ? lang === "en"
                    ? `Attached Chapter Material · ${selectedNode.nodeSourceTitle || selectedNode.title}`
                    : `Materi Bab Terlampir · ${selectedNode.nodeSourceTitle || selectedNode.title}`
                  : selectedNode.nodeInputMode === "custom_prompt"
                    ? lang === "en"
                      ? "Attached Node Prompt"
                      : "Prompt Node Terlampir"
                    : lang === "en"
                      ? "Attached Node Note"
                      : "Catatan Node Terlampir"}
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-[#065F46] dark:text-emerald-100 whitespace-pre-line">
                {selectedNode.nodeSourceContent}
              </p>
            </div>
          )}

          {/* Manual Edit Mode Form */}
          {isEditingNode && (
            <form
              onSubmit={handleSaveManualEdit}
              className="rounded-2xl border border-[#2F80ED]/40 bg-[#F8FAFC] dark:bg-slate-800/50 p-5 space-y-4"
            >
              <div className="text-sm font-extrabold text-[#17233C] dark:text-slate-100">
                {t.library.editNote}
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                  {t.library.summaryLabel}
                </label>
                <textarea
                  rows={2}
                  value={draftSummary}
                  onChange={(e) => setDraftSummary(e.target.value)}
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-[#111827] p-3 text-xs text-[#17233C] dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                    {t.reader.simple}
                  </label>
                  <textarea
                    rows={4}
                    value={draftLevels.simple}
                    onChange={(e) =>
                      setDraftLevels({ ...draftLevels, simple: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-[#111827] p-3 text-xs text-[#17233C] dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                    {t.reader.standard}
                  </label>
                  <textarea
                    rows={4}
                    value={draftLevels.standard}
                    onChange={(e) =>
                      setDraftLevels({
                        ...draftLevels,
                        standard: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-[#111827] p-3 text-xs text-[#17233C] dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                    {t.reader.deep}
                  </label>
                  <textarea
                    rows={4}
                    value={draftLevels.deep}
                    onChange={(e) =>
                      setDraftLevels({ ...draftLevels, deep: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-[#111827] p-3 text-xs text-[#17233C] dark:text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                  {t.library.annotationLabel}
                </label>
                <textarea
                  rows={2}
                  value={draftAnnotation}
                  onChange={(e) => setDraftAnnotation(e.target.value)}
                  placeholder={t.library.annotationPlaceholder}
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-[#111827] p-3 text-xs text-[#17233C] dark:text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingNode(false)}
                  className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 px-4 py-2 text-xs font-bold text-[#6F7E93]"
                >
                  {t.library.doneEditing}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-4 py-2 text-xs font-bold text-white"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{t.library.saveChanges}</span>
                </button>
              </div>
            </form>
          )}

          {/* Safe AI Revision Diff Panel */}
          {showAiRevise && (
            <div className="rounded-2xl border border-[#DDD6FE] dark:border-purple-800/70 bg-[#FAF5FF] dark:bg-purple-950/25 p-5 space-y-4">
              <form onSubmit={handleRequestAiRevision} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-extrabold text-[#6D28D9] dark:text-purple-300">
                    {t.library.previewTitle}
                  </div>
                  <select
                    value={reviseDepth}
                    onChange={(e) =>
                      setReviseDepth(e.target.value as ExplanationDepth)
                    }
                    className="rounded-xl border border-[#DDD6FE] dark:border-purple-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-[#17233C] dark:text-slate-100"
                  >
                    <option value="simple">{t.reader.simple}</option>
                    <option value="standard">{t.reader.standard}</option>
                    <option value="deep">{t.reader.deep}</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reviseInstruction}
                    onChange={(e) => setReviseInstruction(e.target.value)}
                    placeholder={t.library.aiRevisePlaceholder}
                    className="flex-1 rounded-xl border border-[#DDD6FE] dark:border-purple-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-[#17233C] dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={isRevising}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-4 py-2 text-xs font-bold text-white"
                  >
                    {isRevising ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    <span>{t.library.generatePreview}</span>
                  </button>
                </div>
              </form>

              {aiPreview && (
                <div className="rounded-xl border border-[#C4B5FD] dark:border-purple-700 bg-white dark:bg-slate-900 p-4 space-y-3">
                  <div className="text-xs font-bold text-[#6D28D9] dark:text-purple-300">
                    {aiPreview.rationale}
                  </div>
                  <p className="text-xs leading-relaxed text-[#17233C] dark:text-slate-200">
                    {aiPreview.levels[reviseDepth]}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAiPreview(null)}
                      className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-[#6F7E93]"
                    >
                      {t.library.discardPreview}
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyAiRevision}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D9468] hover:bg-[#0F766E] px-3.5 py-1.5 text-xs font-bold text-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{t.library.applyRevision}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3-Level Explanation Switcher & Spacious Reader Card */}
          <div className="space-y-3">
            <div className="inline-flex rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F3F6FC] dark:bg-slate-900 p-1">
              {(
                [
                  { key: "simple", label: t.reader.simple },
                  { key: "standard", label: t.reader.standard },
                  { key: "deep", label: t.reader.deep },
                ] as const
              ).map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => setReadDepth(item.key)}
                  className={`rounded-lg px-4 py-2 text-xs font-extrabold transition-all ${
                    readDepth === item.key
                      ? "bg-[#2F80ED] text-white shadow-sm"
                      : "text-[#6F7E93] dark:text-slate-400 hover:text-[#17233C] dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC]/60 dark:bg-slate-900/60 p-5 sm:p-6">
              <p className="text-sm sm:text-base leading-relaxed text-[#17233C] dark:text-slate-100">
                {selectedNode.levels[readDepth]}
              </p>
            </div>
          </div>

          {/* Formula / Core Principle & Real-World Application Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[#FDE68A] dark:border-amber-800/60 bg-[#FFFBEB] dark:bg-amber-950/25 p-5 space-y-1.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#B45309] dark:text-amber-300">
                {t.reader.formula}
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#78350F] dark:text-amber-100 leading-relaxed">
                {selectedNode.formula}
              </div>
            </div>

            <div className="rounded-2xl border border-[#A7F3D0] dark:border-emerald-800/60 bg-[#ECFDF5] dark:bg-emerald-950/25 p-5 space-y-1.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#047857] dark:text-emerald-300">
                {t.reader.realWorld}
              </div>
              <div className="text-xs sm:text-sm font-medium text-[#065F46] dark:text-emerald-100 leading-relaxed">
                {selectedNode.application}
              </div>
            </div>
          </div>

          {/* Personal Annotation if present */}
          {selectedNode.userAnnotation && selectedNode.userAnnotation.trim() && (
            <div className="rounded-2xl border border-[#DDD6FE] dark:border-violet-800/60 bg-[#FAF5FF] dark:bg-violet-950/25 p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-violet-300">
                <StickyNote className="h-3.5 w-3.5" />
                <span>{t.reader.personalNote}</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-[#334155] dark:text-slate-200">
                {selectedNode.userAnnotation}
              </p>
            </div>
          )}

          {/* Connected Nodes in the Knowledge Tree */}
          {(incomingEdges.length > 0 || outgoingEdges.length > 0) && (
            <div className="pt-4 border-t border-[#DFE6F0] dark:border-slate-800 space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#6F7E93] dark:text-slate-400">
                {lang === "en"
                  ? "Connected Nodes in Tree"
                  : "Node Terhubung di Pohon Ilmu"}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...incomingEdges, ...outgoingEdges].map((edge) => {
                  const otherId =
                    edge.source === selectedNode.id ? edge.target : edge.source;
                  const otherNode = vault.nodes.find((n) => n.id === otherId);
                  if (!otherNode) return null;
                  const isOtherFog = !otherNode.explored;

                  return (
                    <button
                      type="button"
                      key={edge.id}
                      onClick={() => {
                        if (isOtherFog) {
                          onOpenAddExploration(otherNode);
                        } else {
                          setSelectedNodeId(otherNode.id);
                        }
                      }}
                      className="text-left rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/50 hover:border-[#2F80ED] p-3.5 transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10.5px] font-bold text-[#2F80ED] dark:text-blue-400">
                          {edgeShortLabel(edge.relation, lang)}
                        </span>
                        {isOtherFog && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            <Lock className="h-2.5 w-2.5" />
                            {lang === "en" ? "Fog · Open" : "Fog · Buka"}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-extrabold text-[#17233C] dark:text-slate-100">
                        {otherNode.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collapsible Revision History */}
          {selectedNode.revisions && selectedNode.revisions.length > 0 && (
            <div className="pt-4 border-t border-[#DFE6F0] dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowRevisions((s) => !s)}
                className="inline-flex items-center gap-2 text-xs font-extrabold text-[#6F7E93] dark:text-slate-400 hover:text-[#17233C] dark:hover:text-white"
              >
                <History className="h-3.5 w-3.5" />
                <span>
                  {t.library.revisionsTitle} ({selectedNode.revisions.length})
                </span>
              </button>

              {showRevisions && (
                <div className="mt-3 space-y-2">
                  {selectedNode.revisions
                    .slice()
                    .reverse()
                    .map((rev) => (
                      <div
                        key={rev.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/40 px-3.5 py-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-[#2F80ED]/10 text-[#2F80ED] dark:text-blue-300 px-2 py-0.5 font-extrabold">
                            v{rev.version}
                          </span>
                          <span className="font-bold text-[#17233C] dark:text-slate-200">
                            {rev.label || revisionKindLabel(rev.kind, lang)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onRestoreRevision(selectedNode.id, rev)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-[#17233C] dark:text-slate-200 hover:border-[#2F80ED]"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>{t.library.restoreVersion}</span>
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </article>
      )}
    </div>
  );
}
