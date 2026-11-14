"use client";

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
  Network,
  Plus,
  Search,
  Sparkles,
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
}: SkillTreeCanvasProps) {
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
      ? "Aura: Soft"
      : regionVisualMode === "aura_only"
      ? "Aura: Pure"
      : "Borders: Solid";

  return (
    <section className="flex flex-col h-[calc(100vh-56px)] lg:h-screen w-full bg-white overflow-hidden">
      {/* Unified Clean Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#DFE6F0] bg-white px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#2F80ED] shrink-0">
            <Network className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex flex-wrap items-center gap-2">
            <select
              aria-label="Select Active Vault"
              value={vault.id}
              onChange={(e) => onSwitchVault(e.target.value)}
              className="max-w-[240px] sm:max-w-[290px] truncate rounded-xl border border-[#DFE6F0] bg-[#F8FAFC] px-2.5 py-1 text-xs font-extrabold text-[#17233C] hover:border-[#2F80ED]/60 focus:border-[#2F80ED] focus:outline-none"
            >
              {vaults.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <span className="hidden sm:inline-flex rounded-full bg-[#EAF2FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#2F80ED]">
              {vault.inputContext.mode === "mode_a"
                ? "From Material"
                : "From Interest"}
            </span>
            <span className="hidden md:inline text-[11px] font-medium text-[#6F7E93]">
              {vault.nodes.length} concepts · {activeRegionCount} of 6 regions
            </span>
          </div>
        </div>

        {/* Right Controls: Overview, Tree/Outline, Search, Aura Toggle, Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenOverview}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFE6F0] bg-white hover:border-[#2F80ED] hover:bg-[#EAF2FF]/60 px-2.5 py-1.5 text-xs font-bold text-[#17233C] transition-colors"
            title="View Foundation Overview"
          >
            <BookOpen className="h-3.5 w-3.5 text-[#2F80ED]" />
            <span className="hidden xl:inline">Overview</span>
          </button>

          {/* Tree / Outline Switcher */}
          <div className="flex items-center rounded-xl border border-[#DFE6F0] bg-[#F3F6FC] p-1">
            <button
              type="button"
              onClick={() => setViewMode("graph")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "graph"
                  ? "bg-[#2F80ED] text-white shadow-sm"
                  : "text-[#6F7E93] hover:text-[#17233C]"
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              Tree
            </button>
            <button
              type="button"
              onClick={() => setViewMode("outline")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "outline"
                  ? "bg-[#2F80ED] text-white shadow-sm"
                  : "text-[#6F7E93] hover:text-[#17233C]"
              }`}
            >
              <ListTree className="h-3.5 w-3.5" />
              Outline
            </button>
          </div>

          {/* Concept Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8C9AAE]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts..."
              className="w-36 sm:w-44 rounded-xl border border-[#DFE6F0] bg-[#F3F6FC] pl-8 pr-2.5 py-1.5 text-xs text-[#17233C] placeholder:text-[#94A3B8] focus:border-[#2F80ED] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Aura / Region Borders Toggle */}
          {viewMode === "graph" && (
            <button
              type="button"
              onClick={cycleVisualMode}
              title="Toggle Region boundary style: Soft Aura, Pure Aura, or Solid Borders"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#2F80ED]/40 bg-[#EAF2FF] hover:bg-[#DCEAFE] px-3 py-1.5 text-xs font-bold text-[#2F80ED] transition-all"
            >
              <Eye className="h-3.5 w-3.5" />
              {visualModeLabel}
            </button>
          )}

          {/* Region Filter */}
          <div className="relative flex items-center">
            <Layers className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#6F7E93]" />
            <select
              aria-label="Filter Knowledge Region"
              value={regionFilter}
              onChange={(e) =>
                setRegionFilter(e.target.value as RegionCode | "ALL")
              }
              className="appearance-none rounded-xl border border-[#DFE6F0] bg-white pl-8 pr-7 py-1.5 text-xs font-semibold text-[#17233C] hover:border-[#2F80ED]/60 focus:border-[#2F80ED] focus:outline-none"
            >
              <option value="ALL">Regions: All 6</option>
              {regionCodes.map((rc) => (
                <option key={rc} value={rc}>
                  {rc} · {KNOWLEDGE_REGIONS[rc].shortName} (
                  {vault.nodes.filter((n) => n.region === rc).length})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[#6F7E93]" />
          </div>

          {/* Edge Relation Filter */}
          <div className="relative flex items-center">
            <GitBranch className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#6F7E93]" />
            <select
              aria-label="Filter Edge Relations"
              value={relationFilter}
              onChange={(e) =>
                setRelationFilter(e.target.value as EdgeRelationType | "ALL")
              }
              className="appearance-none rounded-xl border border-[#DFE6F0] bg-white pl-8 pr-7 py-1.5 text-xs font-semibold text-[#17233C] hover:border-[#2F80ED]/60 focus:border-[#2F80ED] focus:outline-none"
            >
              <option value="ALL">Relations: All 5</option>
              {relationTypes.map((rt) => (
                <option key={rt} value={rt}>
                  {EDGE_RELATIONS[rt].shortLabel}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[#6F7E93]" />
          </div>

          {/* Singkap Semua Fog button */}
          {fogCount > 0 && (
            <button
              type="button"
              onClick={onUnlockAllFog}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition-all"
              title="Lift Fog of War on all nodes"
            >
              <CloudFog className="h-3.5 w-3.5" />
              Reveal Fog ({fogCount})
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Area: Interactive Tree Canvas OR Accessible Outline View */}
      {viewMode === "graph" ? (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsPanning(false)}
          onWheel={handleWheel}
          style={{
            backgroundImage:
              "radial-gradient(#CFDCEB 1.25px, transparent 1.25px)",
            backgroundSize: "26px 26px",
          }}
          className={`relative w-full flex-1 min-h-0 select-none overflow-hidden bg-[#F3F6FC] ${
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
            <div className="pointer-events-auto inline-flex flex-wrap items-center gap-3 rounded-full border border-[#DFE6F0] bg-white/95 backdrop-blur-sm px-4 py-1.5 text-xs shadow-sm">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#17233C]">
                <Network className="h-3.5 w-3.5 text-[#2F80ED]" />
                {vault.nodes.length} mapped
              </span>
              <span className="h-3.5 w-px bg-[#DFE6F0]" />
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#475569]">
                <Eye className="h-3.5 w-3.5 text-[#6F7E93]" />
                {openedCount} opened
              </span>
              <span className="h-3.5 w-px bg-[#DFE6F0]" />
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#0D9468]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#0D9468]" />
                {masteredCount} mastered
              </span>
              <span className="h-3.5 w-px bg-[#DFE6F0]" />
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#7C3AED]">
                <Layers className="h-3.5 w-3.5 text-[#7C3AED]" />
                {activeRegionCount} / 6 regions
              </span>
            </div>
          </div>

          {/* Floating Left Zoom Controls */}
          <div
            data-canvas-ui="true"
            className="absolute left-3.5 top-3.5 z-20 flex flex-col items-center gap-2"
          >
            <div className="flex flex-col rounded-xl border border-[#DFE6F0] bg-white/95 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.min(1.8, Number((z + 0.12).toFixed(2))))
                }
                title="Zoom In"
                className="p-2 text-[#17233C] hover:bg-[#F3F6FC] border-b border-[#DFE6F0]"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.max(0.42, Number((z - 0.12).toFixed(2))))
                }
                title="Zoom Out"
                className="p-2 text-[#17233C] hover:bg-[#F3F6FC] border-b border-[#DFE6F0]"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={centerOnOrigin}
                title="Locate Origin Node"
                className="p-2 text-[#17233C] hover:bg-[#F3F6FC] border-b border-[#DFE6F0]"
              >
                <LocateFixed className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={fitGraphToViewport}
                title="Fit All Regions"
                className="p-2 text-[#17233C] hover:bg-[#F3F6FC]"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={fitGraphToViewport}
              className="rounded-lg border border-[#DFE6F0] bg-white/95 px-2 py-0.5 text-[11px] font-bold text-[#6F7E93] shadow-sm hover:text-[#17233C]"
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
                  const col = KNOWLEDGE_REGIONS[rc].accentHex;
                  return (
                    <radialGradient
                      key={rc}
                      id={`aura-${rc}`}
                      cx="0.5"
                      cy="0.5"
                      r="0.5"
                    >
                      <stop offset="0%" stopColor={col} stopOpacity="0.18" />
                      <stop offset="60%" stopColor={col} stopOpacity="0.07" />
                      <stop offset="100%" stopColor={col} stopOpacity="0" />
                    </radialGradient>
                  );
                })}
                {relationTypes.map((rt) => (
                  <marker
                    key={rt}
                    id={`trellis-arrow-${rt}`}
                    viewBox="0 0 10 10"
                    refX="8.5"
                    refY="5"
                    markerWidth="6.5"
                    markerHeight="6.5"
                    orient="auto-start-reverse"
                  >
                    <path
                      d="M 0 1.2 L 9 5 L 0 8.8 z"
                      fill={EDGE_RELATIONS[rt].strokeColor}
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
                      fill={reg.tintBg}
                      fillOpacity={regionVisualMode === "aura_only" ? 0.34 : 0.52}
                      stroke={showStroke ? reg.accentHex : "none"}
                      strokeWidth={
                        isExpandedHere
                          ? 2
                          : regionVisualMode === "bordered"
                          ? 1.7
                          : 1.25
                      }
                      strokeDasharray={isExpandedHere ? undefined : strokeDash}
                      strokeOpacity={
                        isExpandedHere
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
                    {/* Wide invisible hit target for easy hover */}
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
                        stroke={relDef.strokeColor}
                        strokeWidth={6.5}
                        strokeOpacity={0.18}
                      />
                    )}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={relDef.strokeColor}
                      strokeWidth={isSelectedEdge ? 2.8 : 2.1}
                      strokeDasharray={relDef.dashArray}
                      strokeLinecap="round"
                      markerEnd={
                        relDef.hasArrow
                          ? `url(#trellis-arrow-${edge.relation})`
                          : undefined
                      }
                    />
                    {(isCross || isSelectedEdge) && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x={-38}
                          y={-9.5}
                          width={76}
                          height={19}
                          rx={9.5}
                          fill={relDef.bgHex}
                          stroke={relDef.strokeColor}
                          strokeWidth={1}
                        />
                        <text
                          x={0}
                          y={3.5}
                          textAnchor="middle"
                          fill={relDef.strokeColor}
                          fontSize="9.5"
                          fontWeight="700"
                        >
                          {isCross ? "cross-region" : relDef.shortLabel}
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
                    style={{ borderColor: `${reg.accentHex}55` }}
                    className="inline-flex min-w-0 items-center gap-1.5 rounded-full border bg-white/95 px-2.5 py-1 text-[11px] font-bold shadow-sm"
                  >
                    <span
                      style={{ backgroundColor: reg.accentHex }}
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                    />
                    <span style={{ color: reg.darkAccentHex }} className="truncate">
                      {reg.code} · {reg.name}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border ${
                      isExpandedHere
                        ? "bg-[#FFA33A] text-[#3A2200] border-[#F59E0B]"
                        : "bg-white/95 text-[#6F7E93] border-[#DFE6F0]"
                    }`}
                  >
                    {box.nodeCount} node{box.nodeCount !== 1 ? "s" : ""}
                    {isExpandedHere ? " · +Expanded" : ""}
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
                        background:
                          "radial-gradient(ellipse at center, rgba(203,213,225,0.68) 0%, rgba(226,232,240,0.42) 55%, rgba(243,246,252,0) 78%)",
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
                              : reg.accentHex,
                          }
                    }
                    className={`relative flex h-full w-full items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left transition-all ${
                      isSelected
                        ? "z-20 ring-4 ring-[#2F80ED]/20 scale-[1.03]"
                        : "z-10 hover:scale-[1.02]"
                    } ${
                      isRoot
                        ? "bg-gradient-to-br from-[#2F80ED] to-[#1D5BC7] text-white border border-[#1B4FA8] node-root-glow"
                        : !node.explored
                        ? "bg-[#F8FAFC]/90 backdrop-blur-sm border border-dashed border-[#94A3B8] text-[#475569] hover:border-[#2F80ED] hover:bg-white"
                        : "bg-white border-[1.75px] text-[#17233C] shadow-sm hover:shadow-md"
                    }`}
                  >
                    {/* Corner Badges matching Figma */}
                    {isRoot && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#FFA33A] px-2.5 py-0.5 text-[9.5px] font-extrabold tracking-wider text-[#3A2200] shadow-sm">
                        START
                      </span>
                    )}
                    {!node.explored && !isRoot && (
                      <span className="absolute -top-2 right-2 rounded-full border border-[#94A3B8] bg-[#E2E8F0] px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-[#475569]">
                        FOG
                      </span>
                    )}
                    {node.explored && node.mastered && !isRoot && (
                      <span
                        title="Mastered"
                        className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#2D9D78] text-white ring-2 ring-white shadow-sm"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {isNew && node.explored && !node.mastered && (
                      <span className="absolute -top-2.5 right-2 rounded-full bg-[#FFA33A] px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-[#3A2200]">
                        NEW
                      </span>
                    )}

                    {/* Leading Icon Pill */}
                    <div
                      style={
                        !isRoot && node.explored
                          ? { backgroundColor: reg.tintBg, color: reg.accentHex }
                          : undefined
                      }
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isRoot
                          ? "bg-white/20 text-white ring-1 ring-white/40"
                          : !node.explored
                          ? "bg-[#E2E8F0] text-[#64748B]"
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
                            ? "text-[#475569]"
                            : "text-[#17233C]"
                        }`}
                      >
                        {node.title}
                      </div>
                      <div
                        className={`mt-0.5 text-[10px] font-medium truncate ${
                          isRoot ? "text-[#E3EEFF]" : "text-[#6F7E93]"
                        }`}
                      >
                        {node.explored ? node.region : "In fog · click to unlock"}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Hovered Edge Reason Floating Callout */}
          {hoveredEdge && (
            <div className="pointer-events-none absolute right-4 top-16 z-30 max-w-xs rounded-xl border border-[#C7D2FE] bg-white/95 backdrop-blur-sm p-3 shadow-lg">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5]">
                Edge Reason · {EDGE_RELATIONS[hoveredEdge.relation].shortLabel}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#17233C]">
                {hoveredEdge.reason}
              </p>
            </div>
          )}

          {/* Bottom-Left Edge Relations Legend Card (Collapsible to preserve canvas space) */}
          <div
            data-canvas-ui="true"
            className={`absolute bottom-3.5 left-3.5 z-20 rounded-2xl border border-[#DFE6F0] bg-white/95 backdrop-blur-sm shadow-sm transition-all ${
              legendExpanded ? "w-[264px] px-3.5 py-2.5" : "px-3 py-2"
            }`}
          >
            <button
              type="button"
              onClick={() => setLegendExpanded((s) => !s)}
              className="flex w-full items-center justify-between gap-2 text-[10.5px] font-extrabold uppercase tracking-wider text-[#6F7E93]"
            >
              <span>Edge Relations</span>
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
                            borderColor: r.strokeColor,
                            borderStyle: r.dashArray ? "dashed" : "solid",
                          }}
                          className="inline-block w-6 border-t-2"
                        />
                        <span className="font-bold text-[#17233C]">
                          {r.shortLabel}
                        </span>
                      </div>
                      <span className="text-[10.5px] text-[#6F7E93]">
                        {rt === "prerequisite"
                          ? "Must know first"
                          : rt === "extension"
                          ? "Direct deepen"
                          : rt === "application"
                          ? "Real-world use"
                          : rt === "related_concept"
                          ? "Two-way link"
                          : "Cross-region"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom-Right Live Mini-map (shifts cleanly when Concept Reader modal is docked right) */}
          <div
            data-canvas-ui="true"
            className={`hidden sm:block absolute bottom-3.5 z-20 rounded-xl border border-[#DFE6F0] bg-white/95 p-1.5 shadow-sm transition-all ${
              selectedNodeId ? "right-3.5 lg:right-[424px]" : "right-3.5"
            }`}
          >
            <svg
              width={156}
              height={96}
              viewBox={`0 0 ${layout.canvasWidth} ${layout.canvasHeight}`}
              className="rounded-lg bg-[#F8FAFC] border border-[#DFE6F0]"
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
                    fill={reg.tintBg}
                    stroke={reg.accentHex}
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
                      ? KNOWLEDGE_REGIONS[n.region].accentHex
                      : "#94A3B8"
                  }
                />
              ))}
            </svg>
          </div>
        </div>
      ) : (
        /* Accessible Outline View */
        <div className="flex-1 min-h-0 overflow-y-auto bg-[#F3F6FC] p-4 sm:p-6 space-y-2.5">
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
                      ? "border-[#2F80ED] bg-white ring-2 ring-[#2F80ED]/15 shadow-sm"
                      : "border-[#DFE6F0] bg-white hover:border-[#2F80ED]/50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#6F7E93]">
                        #{idx + 1}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${regDef.badgeClass}`}
                      >
                        {regDef.code} · {regDef.shortName}
                      </span>
                      <span className="rounded-full bg-[#F3F6FC] px-2.5 py-0.5 text-xs font-semibold text-[#6F7E93]">
                        {node.difficulty}
                      </span>
                      {!node.explored && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2 py-0.5 text-xs font-bold text-slate-600">
                          <Lock className="h-3 w-3" />
                          In Fog
                        </span>
                      )}
                      {node.mastered && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 text-xs font-bold text-[#047857]">
                          <CheckCircle2 className="h-3 w-3" />
                          Mastered
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#2F80ED]">
                      Read Concept →
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-[#17233C]">
                    {node.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#6F7E93] leading-relaxed">
                    {node.summary}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-[#6F7E93]">
                    <span>
                      <strong className="text-[#17233C]">Incoming:</strong>{" "}
                      {incoming.length} link
                    </span>
                    <span>
                      <strong className="text-[#17233C]">Outgoing:</strong>{" "}
                      {outgoing.length} branch
                    </span>
                    <span className="text-[#2F80ED] font-medium truncate max-w-xs">
                      Ref: {node.reference}
                    </span>
                  </div>
                </button>
              );
            })}
        </div>
      )}
    </section>
  );
}
