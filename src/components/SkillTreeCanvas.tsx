"use client";

import {
  difficultyLabel,
  edgeShortLabel,
  Language,
  regionName,
  regionShortName,
  ThemeMode,
  UI_COPY,
} from "@/lib/i18n";
import { EDGE_RELATIONS, KNOWLEDGE_REGIONS } from "@/lib/regions";
import {
  layoutGraphWithRegionContainment,
  NODE_CARD_H,
  NODE_CARD_W,
  RegionBounds,
} from "@/lib/validator";
import {
  EdgeRelationType,
  KnowledgeEdge,
  KnowledgeNode,
  KnowledgeVault,
  RegionCode,
} from "@/types/knowledge";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CloudFog,
  Compass,
  Eye,
  GitBranch,
  Layers,
  ListTree,
  Lock,
  LocateFixed,
  Maximize2,
  Minus,
  Moon,
  Network,
  Plus,
  Search,
  Sparkles,
  Sun,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

export type RegionVisualMode = "hybrid" | "aura_only" | "bordered";

interface SkillTreeCanvasProps {
  vault: KnowledgeVault;
  vaults: KnowledgeVault[];
  onSwitchVault: (vaultId: string) => void;
  onOpenOverview: () => void;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onUnlockAllFog: () => void;
  newlyAddedIds?: string[];
  expandedRegions?: RegionCode[];
  lang: Language;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onToggleLang: () => void;
  children?: React.ReactNode;
}

function trimToCardEdge(
  cx: number,
  cy: number,
  w: number,
  h: number,
  px: number,
  py: number,
  pad = 4
): [number, number] {
  const vx = px - cx;
  const vy = py - cy;
  if (vx === 0 && vy === 0) return [cx, cy];
  const sx = vx !== 0 ? (w / 2 + pad) / Math.abs(vx) : 1e9;
  const sy = vy !== 0 ? (h / 2 + pad) / Math.abs(vy) : 1e9;
  const k = Math.min(sx, sy, 1);
  return [cx + vx * k, cy + vy * k];
}

export default function SkillTreeCanvas({
  vault,
  vaults,
  onSwitchVault,
  onOpenOverview,
  selectedNodeId,
  onSelectNode,
  onUnlockAllFog,
  newlyAddedIds = [],
  expandedRegions = [],
  lang,
  theme,
  onToggleTheme,
  onToggleLang,
  children,
}: SkillTreeCanvasProps) {
  const t = UI_COPY[lang];
  const isDark = theme === "dark";
  const [viewMode, setViewMode] = useState<"graph" | "outline">("graph");
  const [regionFilter, setRegionFilter] = useState<RegionCode | "ALL">("ALL");
  const [relationFilter, setRelationFilter] = useState<EdgeRelationType | "ALL">(
    "ALL"
  );
  const [regionVisualMode, setRegionVisualMode] =
    useState<RegionVisualMode>("hybrid");
  const [searchQuery, setSearchQuery] = useState("");
  const [legendExpanded, setLegendExpanded] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState<KnowledgeEdge | null>(null);

  // Pan & Zoom state
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.92);
  const [pan, setPan] = useState({ x: 18, y: 18 });
  const [isPanning, setIsPanning] = useState(false);
  const panOriginRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });

  const layout = useMemo(
    () => layoutGraphWithRegionContainment(vault.nodes),
    [vault.nodes]
  );

  const regionCodes = Object.keys(KNOWLEDGE_REGIONS) as RegionCode[];
  const relationTypes = Object.keys(EDGE_RELATIONS) as EdgeRelationType[];

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredNodes = useMemo(() => {
    return layout.nodes.filter((n) =>
      regionFilter === "ALL" ? true : n.region === regionFilter
    );
  }, [layout.nodes, regionFilter]);

  const filteredNodeMap = useMemo(() => {
    const m = new Map<string, KnowledgeNode>();
    filteredNodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [filteredNodes]);

  const visibleRegionBounds = useMemo(() => {
    if (regionFilter === "ALL") return layout.regionBounds;
    return layout.regionBounds.filter((b) => b.region === regionFilter);
  }, [layout.regionBounds, regionFilter]);

  const visibleEdges = useMemo(() => {
    return vault.edges.filter((e) => {
      if (!filteredNodeMap.has(e.source) || !filteredNodeMap.has(e.target)) {
        return false;
      }
      if (relationFilter !== "ALL" && e.relation !== relationFilter) {
        return false;
      }
      return true;
    });
  }, [vault.edges, filteredNodeMap, relationFilter]);

  const fogCount = vault.nodes.filter((n) => !n.explored).length;
  const openedCount = vault.nodes.filter((n) => n.explored).length;
  const masteredCount = vault.nodes.filter((n) => n.mastered).length;
  const activeRegionCount = layout.regionBounds.length;

  const fitGraphToViewport = () => {
    const el = containerRef.current;
    if (!el) {
      setZoom(0.9);
      setPan({ x: 16, y: 16 });
      return;
    }
    const cw = el.clientWidth || 860;
    const ch = el.clientHeight || 580;
    const scaleX = (cw - 32) / layout.canvasWidth;
    const scaleY = (ch - 32) / layout.canvasHeight;
    const nextZoom = Math.max(0.45, Math.min(1.15, Math.min(scaleX, scaleY)));
    const offsetX = Math.max(12, (cw - layout.canvasWidth * nextZoom) / 2);
    const offsetY = Math.max(12, (ch - layout.canvasHeight * nextZoom) / 2);
    setZoom(Number(nextZoom.toFixed(2)));
    setPan({ x: Math.round(offsetX), y: Math.round(offsetY) });
  };

  useEffect(() => {
    fitGraphToViewport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vault.id, regionFilter, vault.nodes.length]);

  const centerOnOrigin = () => {
    const origin =
      layout.nodes.find((n) => n.relationToOrigin === "root" || n.id === "root") ||
      layout.nodes[0];
    const el = containerRef.current;
    if (!origin || !el) return;
    const nextZoom = 1;
    setZoom(nextZoom);
    setPan({
      x: Math.round(el.clientWidth / 2 - origin.x * nextZoom),
      y: Math.round(el.clientHeight / 2 - origin.y * nextZoom),
    });
    onSelectNode(origin.id);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("[data-node-card='true']") ||
      target.closest("[data-canvas-ui='true']")
    ) {
      return;
    }
    setIsPanning(true);
    panOriginRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    const dx = e.clientX - panOriginRef.current.x;
    const dy = e.clientY - panOriginRef.current.y;
    setPan({
      x: panOriginRef.current.startPanX + dx,
      y: panOriginRef.current.startPanY + dy,
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      const moved = Math.hypot(
        e.clientX - panOriginRef.current.x,
        e.clientY - panOriginRef.current.y
      );
      if (moved < 5 && selectedNodeId) {
        onSelectNode(null);
      }
    }
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 40) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((z) => Math.max(0.42, Math.min(1.8, Number((z * factor).toFixed(2)))));
  };

  const cycleVisualMode = () => {
    setRegionVisualMode((m) =>
      m === "hybrid" ? "aura_only" : m === "aura_only" ? "bordered" : "hybrid"
    );
  };

  const visualModeLabel =
    regionVisualMode === "hybrid"
      ? t.tree.auraSoft
      : regionVisualMode === "aura_only"
      ? t.tree.auraPure
      : t.tree.bordersSolid;

  return (
    <section className="flex flex-col h-[calc(100vh-56px)] lg:h-screen w-full bg-white dark:bg-[#090F1C] overflow-hidden transition-colors">
      {/* Unified Clean Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] px-4 py-2.5 shrink-0 transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF2FF] dark:bg-blue-950/70 text-[#2F80ED] dark:text-blue-400 shrink-0">
            <Network className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex flex-wrap items-center gap-2">
            <select
              aria-label="Select Active Vault"
              value={vault.id}
              onChange={(e) => onSwitchVault(e.target.value)}
              className="max-w-[220px] sm:max-w-[260px] truncate rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 px-2.5 py-1 text-xs font-extrabold text-[#17233C] dark:text-slate-100 hover:border-[#2F80ED]/60 focus:border-[#2F80ED] focus:outline-none"
            >
              {vaults.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <span className="hidden sm:inline-flex rounded-full bg-[#EAF2FF] dark:bg-blue-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-[#2F80ED] dark:text-blue-300">
              {vault.inputContext.mode === "mode_a"
                ? t.home.modeMaterial
                : t.home.modeCuriosity}
            </span>
            <span className="hidden md:inline text-[11px] font-medium text-[#6F7E93] dark:text-slate-400">
              {vault.nodes.length} {t.home.concepts} · {activeRegionCount}{" "}
              {t.home.regions}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenOverview}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#2F80ED] hover:bg-[#EAF2FF]/60 dark:hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-[#17233C] dark:text-slate-100 transition-colors"
            title={t.tree.overview}
          >
            <BookOpen className="h-3.5 w-3.5 text-[#2F80ED] dark:text-blue-400" />
            <span className="hidden xl:inline">{t.tree.overview}</span>
          </button>

          {/* Tree / Outline Switcher */}
          <div className="flex items-center rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F3F6FC] dark:bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("graph")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "graph"
                  ? "bg-[#2F80ED] text-white shadow-sm"
                  : "text-[#6F7E93] dark:text-slate-400 hover:text-[#17233C] dark:hover:text-slate-200"
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              {t.tree.treeView}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("outline")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "outline"
                  ? "bg-[#2F80ED] text-white shadow-sm"
                  : "text-[#6F7E93] dark:text-slate-400 hover:text-[#17233C] dark:hover:text-slate-200"
              }`}
            >
              <ListTree className="h-3.5 w-3.5" />
              {t.tree.outlineView}
            </button>
          </div>

          {/* Concept Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8C9AAE]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.tree.searchConcepts}
              className="w-32 sm:w-40 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F3F6FC] dark:bg-slate-800 pl-8 pr-2.5 py-1.5 text-xs text-[#17233C] dark:text-slate-100 placeholder:text-[#94A3B8] focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
            />
          </div>

          {/* Aura / Region Borders Toggle */}
          {viewMode === "graph" && (
            <button
              type="button"
              onClick={cycleVisualMode}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#2F80ED]/40 dark:border-blue-500/40 bg-[#EAF2FF] dark:bg-blue-950/60 hover:bg-[#DCEAFE] dark:hover:bg-blue-900/60 px-2.5 py-1.5 text-xs font-bold text-[#2F80ED] dark:text-blue-300 transition-all"
            >
              <Eye className="h-3.5 w-3.5" />
              {visualModeLabel}
            </button>
          )}

          {/* Region Filter (clean domain names only) */}
          <div className="relative flex items-center">
            <Layers className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#6F7E93] dark:text-slate-400" />
            <select
              aria-label={t.tree.allRegions}
              value={regionFilter}
              onChange={(e) =>
                setRegionFilter(e.target.value as RegionCode | "ALL")
              }
              className="appearance-none rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-7 py-1.5 text-xs font-semibold text-[#17233C] dark:text-slate-100 hover:border-[#2F80ED]/60 focus:border-[#2F80ED] focus:outline-none"
            >
              <option value="ALL">{t.tree.allRegions}</option>
              {regionCodes.map((rc) => (
                <option key={rc} value={rc}>
                  {regionShortName(rc, lang)} (
                  {vault.nodes.filter((n) => n.region === rc).length})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[#6F7E93] dark:text-slate-400" />
          </div>

          {/* Edge Relation Filter */}
          <div className="relative flex items-center">
            <GitBranch className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#6F7E93] dark:text-slate-400" />
            <select
              aria-label={t.tree.allRelations}
              value={relationFilter}
              onChange={(e) =>
                setRelationFilter(e.target.value as EdgeRelationType | "ALL")
              }
              className="appearance-none rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-7 py-1.5 text-xs font-semibold text-[#17233C] dark:text-slate-100 hover:border-[#2F80ED]/60 focus:border-[#2F80ED] focus:outline-none"
            >
              <option value="ALL">{t.tree.allRelations}</option>
              {relationTypes.map((rt) => (
                <option key={rt} value={rt}>
                  {edgeShortLabel(rt, lang)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[#6F7E93] dark:text-slate-400" />
          </div>

          {/* Reveal Fog */}
          {fogCount > 0 && (
            <button
              type="button"
              onClick={onUnlockAllFog}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 px-2.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 transition-all"
            >
              <CloudFog className="h-3.5 w-3.5" />
              {t.tree.revealFog} ({fogCount})
            </button>
          )}

          {/* Theme & Language Quick Controls (desktop) */}
          <div className="hidden lg:inline-flex items-center gap-1 pl-1 border-l border-[#DFE6F0] dark:border-slate-700">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? t.nav.light : t.nav.dark}
              title={isDark ? t.nav.light : t.nav.dark}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#17233C] dark:text-amber-300 hover:border-[#2F80ED] transition-colors"
            >
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={onToggleLang}
              aria-label="Switch language"
              className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#2F80ED] px-2.5 py-1.5 text-[11px] font-extrabold text-[#17233C] dark:text-slate-100 transition-colors"
            >
              {lang === "en" ? "EN" : "ID"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Area: Interactive Tree Canvas OR Accessible Outline View */}
      <div className="relative flex-1 min-h-0 flex flex-col">
        {viewMode === "graph" ? (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsPanning(false)}
          onWheel={handleWheel}
          style={{
            backgroundImage: isDark
              ? "radial-gradient(#1E293B 1.25px, transparent 1.25px)"
              : "radial-gradient(#CFDCEB 1.25px, transparent 1.25px)",
            backgroundSize: "26px 26px",
          }}
          className={`relative w-full flex-1 min-h-0 select-none overflow-hidden bg-[#F3F6FC] dark:bg-[#090F1C] transition-colors ${
            isPanning ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {/* Floating Exploration Summary Pill */}
          <div
            data-canvas-ui="true"
            className={`pointer-events-none absolute inset-x-0 top-3.5 z-20 flex justify-center px-4 transition-all ${
              selectedNodeId ? "lg:pr-[416px]" : ""
            }`}
          >
            <div className="pointer-events-auto inline-flex flex-wrap items-center gap-3 rounded-full border border-[#DFE6F0] dark:border-slate-800 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-sm px-4 py-1.5 text-xs shadow-sm">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#17233C] dark:text-slate-100">
                <Network className="h-3.5 w-3.5 text-[#2F80ED] dark:text-blue-400" />
                {vault.nodes.length} {t.home.mapped}
              </span>
              <span className="h-3.5 w-px bg-[#DFE6F0] dark:bg-slate-700" />
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#475569] dark:text-slate-300">
                <Eye className="h-3.5 w-3.5 text-[#6F7E93] dark:text-slate-400" />
                {openedCount} {t.home.opened}
              </span>
              <span className="h-3.5 w-px bg-[#DFE6F0] dark:bg-slate-700" />
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#0D9468] dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#0D9468] dark:text-emerald-400" />
                {masteredCount} {t.home.mastered}
              </span>
              <span className="h-3.5 w-px bg-[#DFE6F0] dark:bg-slate-700" />
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#7C3AED] dark:text-violet-400">
                <Layers className="h-3.5 w-3.5 text-[#7C3AED] dark:text-violet-400" />
                {activeRegionCount} {t.home.regions}
              </span>
            </div>
          </div>

          {/* Floating Left Zoom Controls */}
          <div
            data-canvas-ui="true"
            className="absolute left-3.5 top-3.5 z-20 flex flex-col items-center gap-2"
          >
            <div className="flex flex-col rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-white/95 dark:bg-[#111827]/95 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.min(1.8, Number((z + 0.12).toFixed(2))))
                }
                title="Zoom In"
                className="p-2 text-[#17233C] dark:text-slate-200 hover:bg-[#F3F6FC] dark:hover:bg-slate-800 border-b border-[#DFE6F0] dark:border-slate-800"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.max(0.42, Number((z - 0.12).toFixed(2))))
                }
                title="Zoom Out"
                className="p-2 text-[#17233C] dark:text-slate-200 hover:bg-[#F3F6FC] dark:hover:bg-slate-800 border-b border-[#DFE6F0] dark:border-slate-800"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={centerOnOrigin}
                title="Center Origin"
                className="p-2 text-[#17233C] dark:text-slate-200 hover:bg-[#F3F6FC] dark:hover:bg-slate-800 border-b border-[#DFE6F0] dark:border-slate-800"
              >
                <LocateFixed className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={fitGraphToViewport}
                title="Fit All"
                className="p-2 text-[#17233C] dark:text-slate-200 hover:bg-[#F3F6FC] dark:hover:bg-slate-800"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={fitGraphToViewport}
              className="rounded-lg border border-[#DFE6F0] dark:border-slate-800 bg-white/95 dark:bg-[#111827]/95 px-2 py-0.5 text-[11px] font-bold text-[#6F7E93] dark:text-slate-300 shadow-sm hover:text-[#17233C] dark:hover:text-white"
            >
              {Math.round(zoom * 100)}%
            </button>
          </div>

          {/* Transformed Infinite Pan/Zoom Stage */}
          <div
            style={{
              width: layout.canvasWidth,
              height: layout.canvasHeight,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
            className="relative transition-transform duration-75"
          >
            {/* SVG Layer: Hybrid Outward Region Auras + Edges */}
            <svg
              width={layout.canvasWidth}
              height={layout.canvasHeight}
              className="absolute inset-0 overflow-visible pointer-events-none"
            >
              <defs>
                {regionCodes.map((rc) => {
                  const reg = KNOWLEDGE_REGIONS[rc];
                  const col = isDark ? reg.darkPillTextHex : reg.accentHex;
                  return (
                    <radialGradient
                      key={rc}
                      id={`aura-${rc}`}
                      cx="0.5"
                      cy="0.5"
                      r="0.5"
                    >
                      <stop
                        offset="0%"
                        stopColor={col}
                        stopOpacity={isDark ? "0.22" : "0.18"}
                      />
                      <stop
                        offset="60%"
                        stopColor={col}
                        stopOpacity={isDark ? "0.08" : "0.07"}
                      />
                      <stop offset="100%" stopColor={col} stopOpacity="0" />
                    </radialGradient>
                  );
                })}
                {relationTypes.map((rt) => (
                  <marker
                    key={rt}
                    id={`curiora-arrow-${rt}`}
                    viewBox="0 0 10 10"
                    refX="8.5"
                    refY="5"
                    markerWidth="6.5"
                    markerHeight="6.5"
                    orient="auto-start-reverse"
                  >
                    <path
                      d="M 0 1.2 L 9 5 L 0 8.8 z"
                      fill={
                        isDark
                          ? EDGE_RELATIONS[rt].darkStrokeColor
                          : EDGE_RELATIONS[rt].strokeColor
                      }
                    />
                  </marker>
                ))}
              </defs>

              {/* Hybrid Region Auras & Borders */}
              {visibleRegionBounds.map((box: RegionBounds) => {
                const reg = KNOWLEDGE_REGIONS[box.region];
                const isExpandedHere = expandedRegions.includes(box.region);
                const cx = box.x + box.width / 2;
                const cy = box.y + box.height / 2;
                const strokeDash =
                  regionVisualMode === "hybrid"
                    ? "6 6"
                    : regionVisualMode === "bordered"
                    ? undefined
                    : "none";
                const showStroke = regionVisualMode !== "aura_only";

                return (
                  <g key={box.region}>
                    {/* Soft Outward Radial Aura */}
                    <ellipse
                      cx={cx}
                      cy={cy}
                      rx={box.width * 0.58}
                      ry={box.height * 0.6}
                      fill={`url(#aura-${box.region})`}
                    />
                    {/* Translucent Territory Wash + Optional Contour */}
                    <rect
                      x={box.x}
                      y={box.y}
                      width={box.width}
                      height={box.height}
                      rx={30}
                      fill={isDark ? reg.darkTintBg : reg.tintBg}
                      fillOpacity={
                        isDark
                          ? regionVisualMode === "aura_only"
                            ? 0.25
                            : 0.36
                          : regionVisualMode === "aura_only"
                          ? 0.34
                          : 0.52
                      }
                      stroke={
                        showStroke
                          ? isDark
                            ? reg.darkPillTextHex
                            : reg.accentHex
                          : "none"
                      }
                      strokeWidth={
                        isExpandedHere
                          ? 2
                          : regionVisualMode === "bordered"
                          ? 1.7
                          : 1.25
                      }
                      strokeDasharray={isExpandedHere ? undefined : strokeDash}
                      strokeOpacity={
                        isDark
                          ? isExpandedHere
                            ? 0.65
                            : regionVisualMode === "bordered"
                            ? 0.52
                            : 0.32
                          : isExpandedHere
                          ? 0.72
                          : regionVisualMode === "bordered"
                          ? 0.65
                          : 0.42
                      }
                    />
                  </g>
                );
              })}

              {/* 5 Distinct Edge Styles */}
              {visibleEdges.map((edge, edgeIdx) => {
                const sNode = filteredNodeMap.get(edge.source);
                const tNode = filteredNodeMap.get(edge.target);
                if (!sNode || !tNode) return null;

                const relDef =
                  EDGE_RELATIONS[edge.relation] || EDGE_RELATIONS.extension;
                const strokeCol = isDark
                  ? relDef.darkStrokeColor
                  : relDef.strokeColor;
                const pillBg = isDark ? relDef.darkBgHex : relDef.bgHex;
                const isSelectedEdge =
                  sNode.id === selectedNodeId || tNode.id === selectedNodeId;
                const isDimmed =
                  (!sNode.explored || !tNode.explored) && !isSelectedEdge;
                const isCross =
                  edge.relation === "cross_disciplinary" || edge.isCrossRegion;

                let pathData = "";
                let midX = (sNode.x + tNode.x) / 2;
                let midY = (sNode.y + tNode.y) / 2;

                if (isCross) {
                  const dx = tNode.x - sNode.x;
                  const dy = tNode.y - sNode.y;
                  const L = Math.max(1, Math.hypot(dx, dy));
                  const sign = edgeIdx % 2 === 0 ? (dy >= 0 ? -1 : 1) : (dy >= 0 ? 1 : -1);
                  const bow = Math.min(82, L * 0.14) + (edgeIdx % 3) * 16;
                  const ctrlX = midX + sign * (-dy / L) * bow;
                  const ctrlY = midY + sign * (dx / L) * bow;
                  const [x1, y1] = trimToCardEdge(
                    sNode.x,
                    sNode.y,
                    NODE_CARD_W,
                    NODE_CARD_H,
                    ctrlX,
                    ctrlY,
                    5
                  );
                  const [x2, y2] = trimToCardEdge(
                    tNode.x,
                    tNode.y,
                    NODE_CARD_W,
                    NODE_CARD_H,
                    ctrlX,
                    ctrlY,
                    relDef.hasArrow ? 9 : 5
                  );
                  pathData = `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`;
                  const tPos = 0.36 + (edgeIdx % 3) * 0.14;
                  const omt = 1 - tPos;
                  midX = omt * omt * x1 + 2 * omt * tPos * ctrlX + tPos * tPos * x2;
                  midY = omt * omt * y1 + 2 * omt * tPos * ctrlY + tPos * tPos * y2;
                } else {
                  const [x1, y1] = trimToCardEdge(
                    sNode.x,
                    sNode.y,
                    NODE_CARD_W,
                    NODE_CARD_H,
                    tNode.x,
                    tNode.y,
                    5
                  );
                  const [x2, y2] = trimToCardEdge(
                    tNode.x,
                    tNode.y,
                    NODE_CARD_W,
                    NODE_CARD_H,
                    sNode.x,
                    sNode.y,
                    relDef.hasArrow ? 9 : 5
                  );
                  pathData = `M ${x1} ${y1} L ${x2} ${y2}`;
                  midX = (x1 + x2) / 2;
                  midY = (y1 + y2) / 2;
                }

                return (
                  <g
                    key={edge.id}
                    opacity={isDimmed ? 0.42 : 0.94}
                    className="pointer-events-auto cursor-help"
                    onMouseEnter={() => setHoveredEdge(edge)}
                    onMouseLeave={() => setHoveredEdge(null)}
                  >
                    <path
                      d={pathData}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={14}
                    />
                    {isSelectedEdge && (
                      <path
                        d={pathData}
                        fill="none"
                        stroke={strokeCol}
                        strokeWidth={6.5}
                        strokeOpacity={0.22}
                      />
                    )}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={strokeCol}
                      strokeWidth={isSelectedEdge ? 2.8 : 2.1}
                      strokeDasharray={relDef.dashArray}
                      strokeLinecap="round"
                      markerEnd={
                        relDef.hasArrow
                          ? `url(#curiora-arrow-${edge.relation})`
                          : undefined
                      }
                    />
                    {(isCross || isSelectedEdge) && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x={-46}
                          y={-9.5}
                          width={92}
                          height={19}
                          rx={9.5}
                          fill={pillBg}
                          stroke={strokeCol}
                          strokeWidth={1}
                        />
                        <text
                          x={0}
                          y={3.5}
                          textAnchor="middle"
                          fill={strokeCol}
                          fontSize="9.5"
                          fontWeight="700"
                        >
                          {isCross
                            ? t.tree.crossRegionBadge
                            : edgeShortLabel(edge.relation, lang)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Region Headers strictly anchored inside Region top bar */}
            {visibleRegionBounds.map((box) => {
              const reg = KNOWLEDGE_REGIONS[box.region];
              const isExpandedHere = expandedRegions.includes(box.region);
              return (
                <div
                  key={`hdr-${box.region}`}
                  style={{
                    left: box.x + 14,
                    top: box.y + 12,
                    width: box.width - 28,
                  }}
                  className="pointer-events-none absolute flex items-center justify-between gap-2"
                >
                  <div
                    style={{
                      borderColor: isDark
                        ? `${reg.darkPillTextHex}44`
                        : `${reg.accentHex}55`,
                    }}
                    className="inline-flex min-w-0 items-center gap-1.5 rounded-full border bg-white/95 dark:bg-[#0F172A]/95 px-2.5 py-1 text-[11px] font-bold shadow-sm"
                  >
                    <span
                      style={{
                        backgroundColor: isDark
                          ? reg.darkPillTextHex
                          : reg.accentHex,
                      }}
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                    />
                    <span
                      style={{
                        color: isDark ? reg.darkPillTextHex : reg.darkAccentHex,
                      }}
                      className="truncate"
                    >
                      {regionName(box.region, lang)}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border ${
                      isExpandedHere
                        ? "bg-[#FFA33A] text-[#3A2200] border-[#F59E0B]"
                        : "bg-white/95 dark:bg-[#0F172A]/95 text-[#6F7E93] dark:text-slate-300 border-[#DFE6F0] dark:border-slate-700"
                    }`}
                  >
                    {box.nodeCount}{" "}
                    {box.nodeCount === 1
                      ? t.tree.nodeSingular
                      : t.tree.nodePlural}
                    {isExpandedHere ? ` · ${t.tree.expandedTag}` : ""}
                  </span>
                </div>
              );
            })}

            {/* Interactive Graph Nodes */}
            {filteredNodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              const isRoot =
                node.relationToOrigin === "root" || node.id === "root";
              const isNew = newlyAddedIds.includes(node.id);
              const reg = KNOWLEDGE_REGIONS[node.region];
              const matchesSearch =
                !normalizedQuery ||
                node.title.toLowerCase().includes(normalizedQuery) ||
                node.summary.toLowerCase().includes(normalizedQuery);

              return (
                <div
                  key={node.id}
                  data-node-card="true"
                  style={{
                    left: node.x - NODE_CARD_W / 2,
                    top: node.y - NODE_CARD_H / 2,
                    width: NODE_CARD_W,
                    height: NODE_CARD_H,
                  }}
                  className={`absolute transition-all duration-200 ${
                    matchesSearch ? "opacity-100" : "opacity-30"
                  }`}
                >
                  {/* Atmospheric Fog of War Cloud Shroud when unexplored */}
                  {!node.explored && (
                    <div
                      aria-hidden="true"
                      style={{
                        background: isDark
                          ? "radial-gradient(ellipse at center, rgba(30,41,59,0.78) 0%, rgba(15,23,42,0.52) 55%, rgba(9,15,28,0) 78%)"
                          : "radial-gradient(ellipse at center, rgba(203,213,225,0.68) 0%, rgba(226,232,240,0.42) 55%, rgba(243,246,252,0) 78%)",
                      }}
                      className="pointer-events-none absolute -inset-5 rounded-3xl blur-[2px]"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectNode(node.id)}
                    style={
                      isRoot
                        ? undefined
                        : isSelected
                        ? { borderColor: "#2F80ED" }
                        : !node.explored
                        ? undefined
                        : {
                            borderColor: isNew
                              ? "#FFA33A"
                              : node.mastered
                              ? "#2D9D78"
                              : isDark
                              ? reg.darkPillTextHex
                              : reg.accentHex,
                          }
                    }
                    className={`relative flex h-full w-full items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left transition-all ${
                      isSelected
                        ? "z-20 ring-4 ring-[#2F80ED]/25 scale-[1.03]"
                        : "z-10 hover:scale-[1.02]"
                    } ${
                      isRoot
                        ? "bg-gradient-to-br from-[#2F80ED] to-[#1D5BC7] text-white border border-[#1B4FA8] node-root-glow"
                        : !node.explored
                        ? "bg-[#F8FAFC]/90 dark:bg-slate-800/85 backdrop-blur-sm border border-dashed border-[#94A3B8] dark:border-slate-600 text-[#475569] dark:text-slate-300 hover:border-[#2F80ED] hover:bg-white dark:hover:bg-slate-800"
                        : "bg-white dark:bg-[#111827] border-[1.75px] text-[#17233C] dark:text-slate-100 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {/* Corner Badges */}
                    {isRoot && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#FFA33A] px-2.5 py-0.5 text-[9.5px] font-extrabold tracking-wider text-[#3A2200] shadow-sm">
                        {t.tree.startBadge}
                      </span>
                    )}
                    {!node.explored && !isRoot && (
                      <span className="absolute -top-2 right-2 rounded-full border border-[#94A3B8] dark:border-slate-600 bg-[#E2E8F0] dark:bg-slate-700 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-[#475569] dark:text-slate-200">
                        {t.tree.fogBadge}
                      </span>
                    )}
                    {node.explored && node.mastered && !isRoot && (
                      <span
                        title={t.reader.mastered}
                        className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#2D9D78] text-white ring-2 ring-white dark:ring-[#111827] shadow-sm"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {isNew && node.explored && !node.mastered && (
                      <span className="absolute -top-2.5 right-2 rounded-full bg-[#FFA33A] px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-[#3A2200]">
                        {t.tree.newBadge}
                      </span>
                    )}

                    {/* Leading Icon Pill */}
                    <div
                      style={
                        !isRoot && node.explored
                          ? isDark
                            ? {
                                backgroundColor: reg.darkTintBg,
                                color: reg.darkPillTextHex,
                              }
                            : {
                                backgroundColor: reg.tintBg,
                                color: reg.accentHex,
                              }
                          : undefined
                      }
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isRoot
                          ? "bg-white/20 text-white ring-1 ring-white/40"
                          : !node.explored
                          ? "bg-[#E2E8F0] dark:bg-slate-700 text-[#64748B] dark:text-slate-300"
                          : ""
                      }`}
                    >
                      {isRoot ? (
                        <Sparkles className="h-4 w-4" />
                      ) : !node.explored ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : (
                        <Compass className="h-4 w-4" />
                      )}
                    </div>

                    {/* Node Title */}
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-xs font-bold leading-snug line-clamp-2 ${
                          isRoot
                            ? "text-white"
                            : !node.explored
                            ? "text-[#475569] dark:text-slate-300"
                            : "text-[#17233C] dark:text-slate-100"
                        }`}
                      >
                        {node.title}
                      </div>
                      <div
                        className={`mt-0.5 text-[10px] font-medium truncate ${
                          isRoot
                            ? "text-[#E3EEFF]"
                            : "text-[#6F7E93] dark:text-slate-400"
                        }`}
                      >
                        {node.explored
                          ? regionShortName(node.region, lang)
                          : t.tree.inFogHint}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Hovered Edge Reason Floating Callout */}
          {hoveredEdge && (
            <div className="pointer-events-none absolute right-4 top-16 z-30 max-w-xs rounded-xl border border-[#C7D2FE] dark:border-indigo-800/60 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-sm p-3 shadow-lg">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-300">
                {t.tree.edgeReason} ·{" "}
                {edgeShortLabel(hoveredEdge.relation, lang)}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#17233C] dark:text-slate-200">
                {hoveredEdge.reason}
              </p>
            </div>
          )}

          {/* Bottom-Left Edge Relations Legend Card */}
          <div
            data-canvas-ui="true"
            className={`absolute bottom-3.5 left-3.5 z-20 rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-sm shadow-sm transition-all ${
              legendExpanded ? "w-[272px] px-3.5 py-2.5" : "px-3 py-2"
            }`}
          >
            <button
              type="button"
              onClick={() => setLegendExpanded((s) => !s)}
              className="flex w-full items-center justify-between gap-2 text-[10.5px] font-extrabold uppercase tracking-wider text-[#6F7E93] dark:text-slate-300"
            >
              <span>{t.tree.edgeRelations}</span>
              {legendExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              )}
            </button>
            {legendExpanded && (
              <div className="mt-2 space-y-1.5 text-[11px]">
                {relationTypes.map((rt) => {
                  const r = EDGE_RELATIONS[rt];
                  return (
                    <div
                      key={rt}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            borderColor: isDark
                              ? r.darkStrokeColor
                              : r.strokeColor,
                            borderStyle: r.dashArray ? "dashed" : "solid",
                          }}
                          className="inline-block w-6 border-t-2"
                        />
                        <span className="font-bold text-[#17233C] dark:text-slate-100">
                          {edgeShortLabel(rt, lang)}
                        </span>
                      </div>
                      <span className="text-[10.5px] text-[#6F7E93] dark:text-slate-400">
                        {t.tree.edgeLegendHint[rt]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom-Right Live Mini-map */}
          <div
            data-canvas-ui="true"
            className={`hidden sm:block absolute bottom-3.5 z-20 rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-white/95 dark:bg-[#111827]/95 p-1.5 shadow-sm transition-all ${
              selectedNodeId ? "right-3.5 lg:right-[424px]" : "right-3.5"
            }`}
          >
            <svg
              width={156}
              height={96}
              viewBox={`0 0 ${layout.canvasWidth} ${layout.canvasHeight}`}
              className="rounded-lg bg-[#F8FAFC] dark:bg-[#090F1C] border border-[#DFE6F0] dark:border-slate-800"
            >
              {layout.regionBounds.map((box) => {
                const reg = KNOWLEDGE_REGIONS[box.region];
                return (
                  <rect
                    key={box.region}
                    x={box.x}
                    y={box.y}
                    width={box.width}
                    height={box.height}
                    rx={20}
                    fill={isDark ? reg.darkTintBg : reg.tintBg}
                    fillOpacity={isDark ? 0.55 : 0.9}
                    stroke={isDark ? reg.darkPillTextHex : reg.accentHex}
                    strokeWidth={8}
                    strokeOpacity={0.7}
                  />
                );
              })}
              {layout.nodes.map((n) => (
                <circle
                  key={n.id}
                  cx={n.x}
                  cy={n.y}
                  r={n.id === selectedNodeId ? 24 : 16}
                  fill={
                    n.id === selectedNodeId
                      ? "#2F80ED"
                      : n.explored
                      ? isDark
                        ? KNOWLEDGE_REGIONS[n.region].darkPillTextHex
                        : KNOWLEDGE_REGIONS[n.region].accentHex
                      : "#94A3B8"
                  }
                />
              ))}
            </svg>
          </div>
        </div>
      ) : (
        /* Accessible Outline View */
        <div className="flex-1 min-h-0 overflow-y-auto bg-[#F3F6FC] dark:bg-[#090F1C] p-4 sm:p-6 space-y-2.5 transition-colors">
          {filteredNodes
            .filter(
              (n) =>
                !normalizedQuery ||
                n.title.toLowerCase().includes(normalizedQuery) ||
                n.summary.toLowerCase().includes(normalizedQuery)
            )
            .map((node: KnowledgeNode, idx: number) => {
              const isSelected = node.id === selectedNodeId;
              const regDef = KNOWLEDGE_REGIONS[node.region];
              const incoming = vault.edges.filter((e) => e.target === node.id);
              const outgoing = vault.edges.filter((e) => e.source === node.id);

              return (
                <button
                  type="button"
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? "border-[#2F80ED] bg-white dark:bg-[#111827] ring-2 ring-[#2F80ED]/15 shadow-sm"
                      : "border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-[#2F80ED]/50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#6F7E93] dark:text-slate-400">
                        #{idx + 1}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${regDef.badgeClass}`}
                      >
                        {regionShortName(node.region, lang)}
                      </span>
                      <span className="rounded-full bg-[#F3F6FC] dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-[#6F7E93] dark:text-slate-300">
                        {difficultyLabel(node.difficulty, lang)}
                      </span>
                      {!node.explored && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-2 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                          <Lock className="h-3 w-3" />
                          {t.tree.inFogPill}
                        </span>
                      )}
                      {node.mastered && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#A7F3D0] dark:border-emerald-700/60 px-2 py-0.5 text-xs font-bold text-[#047857] dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          {t.reader.mastered}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#2F80ED] dark:text-blue-400">
                      {t.tree.readConcept} →
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-[#17233C] dark:text-slate-100">
                    {node.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#6F7E93] dark:text-slate-400 leading-relaxed">
                    {node.summary}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-[#6F7E93] dark:text-slate-400">
                    <span>
                      <strong className="text-[#17233C] dark:text-slate-200">
                        {t.tree.incoming}:
                      </strong>{" "}
                      {incoming.length} {t.tree.linkSingular}
                    </span>
                    <span>
                      <strong className="text-[#17233C] dark:text-slate-200">
                        {t.tree.outgoing}:
                      </strong>{" "}
                      {outgoing.length} {t.tree.branchSingular}
                    </span>
                    <span className="text-[#2F80ED] dark:text-blue-400 font-medium truncate max-w-xs">
                      {node.reference}
                    </span>
                  </div>
                </button>
              );
            })}
        </div>
      )}
        {children}
      </div>
    </section>
  );
}
