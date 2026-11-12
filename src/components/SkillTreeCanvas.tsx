"use client";

import { EDGE_RELATIONS, KNOWLEDGE_REGIONS } from "@/lib/regions";
import {
  EdgeRelationType,
  KnowledgeNode,
  KnowledgeVault,
  RegionCode,
} from "@/types/knowledge";
import {
  CheckCircle2,
  Compass,
  Eye,
  GitBranch,
  ListTree,
  Lock,
  Network,
  Sparkles,
} from "lucide-react";
import React, { useState } from "react";

interface SkillTreeCanvasProps {
  vault: KnowledgeVault;
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  onUnlockAllFog: () => void;
}

export default function SkillTreeCanvas({
  vault,
  selectedNodeId,
  onSelectNode,
  onUnlockAllFog,
}: SkillTreeCanvasProps) {
  const [viewMode, setViewMode] = useState<"graph" | "outline">("graph");
  const [regionFilter, setRegionFilter] = useState<RegionCode | "ALL">("ALL");
  const [relationFilter, setRelationFilter] = useState<EdgeRelationType | "ALL">(
    "ALL"
  );

  const regionCodes = Object.keys(KNOWLEDGE_REGIONS) as RegionCode[];
  const relationTypes = Object.keys(EDGE_RELATIONS) as EdgeRelationType[];

  const filteredNodes = vault.nodes.filter((n) =>
    regionFilter === "ALL" ? true : n.region === regionFilter
  );
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  const visibleEdges = vault.edges.filter((e) => {
    if (!filteredNodeIds.has(e.source) || !filteredNodeIds.has(e.target)) {
      return false;
    }
    if (relationFilter !== "ALL" && e.relation !== relationFilter) {
      return false;
    }
    return true;
  });

  const fogCount = vault.nodes.filter((n) => !n.explored).length;

  return (
    <section className="flex flex-col rounded-2xl border border-slate-800/90 bg-[#0d1320] p-4 shadow-xl">
      {/* Top Bar: View Toggle & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/90 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">
                Peta Regional Skill Tree (DAG)
              </h2>
              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                {vault.nodes.length} Nodes • {vault.edges.length} Edges
              </span>
            </div>
            <p className="text-xs text-slate-400">
              6 Kuadran Rumpun Ilmu (Path of Exile Region Analog) &amp; 5 Jenis Garis Relasi
            </p>
          </div>
        </div>

        {/* View Switcher & Unlock Fog Button */}
        <div className="flex flex-wrap items-center gap-2">
          {fogCount > 0 && (
            <button
              onClick={onUnlockAllFog}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 text-xs font-medium text-amber-300 transition-all"
              title="Buka seluruh node yang masih tertutup Fog of War"
            >
              <Eye className="h-3.5 w-3.5" />
              Singkap Fog ({fogCount})
            </button>
          )}
          <div className="flex items-center rounded-xl border border-slate-800 bg-[#090d16] p-1">
            <button
              onClick={() => setViewMode("graph")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "graph"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              Skill Tree View
            </button>
            <button
              onClick={() => setViewMode("outline")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "outline"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ListTree className="h-3.5 w-3.5" />
              Outline View (Aksesibel)
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar: 6 Knowledge Regions & 5 Edge Types */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pb-3">
        {/* Region Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400 mr-1">Region:</span>
          <button
            onClick={() => setRegionFilter("ALL")}
            className={`rounded-lg border px-2 py-0.5 text-xs font-medium transition-all ${
              regionFilter === "ALL"
                ? "border-indigo-500 bg-indigo-500/20 text-indigo-200"
                : "border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200"
            }`}
          >
            Semua (6)
          </button>
          {regionCodes.map((rc) => {
            const r = KNOWLEDGE_REGIONS[rc];
            const countInVault = vault.nodes.filter((n) => n.region === rc).length;
            const active = regionFilter === rc;
            return (
              <button
                key={rc}
                onClick={() => setRegionFilter(active ? "ALL" : rc)}
                className={`rounded-lg border px-2 py-0.5 text-xs font-medium transition-all ${
                  active
                    ? r.badgeClass
                    : "border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200"
                }`}
              >
                {rc} • {r.shortName} ({countInVault})
              </button>
            );
          })}
        </div>

        {/* Edge Legend & Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400 mr-1">Edge:</span>
          <button
            onClick={() => setRelationFilter("ALL")}
            className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${
              relationFilter === "ALL"
                ? "border-indigo-500 bg-indigo-500/20 text-indigo-200"
                : "border-slate-800 bg-slate-900/70 text-slate-400"
            }`}
          >
            Semua Garis
          </button>
          {relationTypes.map((rt) => {
            const rel = EDGE_RELATIONS[rt];
            const active = relationFilter === rt;
            return (
              <button
                key={rt}
                onClick={() => setRelationFilter(active ? "ALL" : rt)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-medium transition-all ${
                  active
                    ? rel.badgeClass
                    : "border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200"
                }`}
                title={rel.description}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: rel.strokeColor }}
                />
                {rel.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Graph vs Outline */}
      {viewMode === "graph" ? (
        <div className="relative w-full overflow-x-auto rounded-xl border border-slate-800 bg-[#080c14]">
          <div className="relative min-w-[860px] h-[536px] select-none">
            {/* SVG Layer: 6 Region Quadrants + Directed Edges */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 930 536"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern
                  id="poe-grid"
                  width="28"
                  height="28"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 28 0 L 0 0 0 28"
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.07)"
                    strokeWidth="1"
                  />
                </pattern>

                {/* Arrowhead markers for each edge relation type */}
                {relationTypes.map((rt) => (
                  <marker
                    key={rt}
                    id={`arrow-${rt}`}
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path
                      d="M 0 1.5 L 8.5 5 L 0 8.5 z"
                      fill={EDGE_RELATIONS[rt].strokeColor}
                    />
                  </marker>
                ))}
              </defs>

              {/* Background Grid */}
              <rect width="930" height="536" fill="url(#poe-grid)" />

              {/* 6 Knowledge Region Quadrants (Path of Exile Domain Zones) */}
              {regionCodes.map((rc) => {
                const reg = KNOWLEDGE_REGIONS[rc];
                const { x, y, width, height } = reg.quadrantBox;
                const hasNodes = vault.nodes.some((n) => n.region === rc);
                return (
                  <g key={rc}>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      rx={14}
                      fill={hasNodes ? reg.glowColor : "rgba(15, 23, 42, 0.25)"}
                      stroke={hasNodes ? reg.accentHex : "rgba(51, 65, 85, 0.45)"}
                      strokeWidth={hasNodes ? "1.3" : "0.8"}
                      strokeDasharray={hasNodes ? undefined : "4,4"}
                      fillOpacity={hasNodes ? "0.28" : "0.18"}
                    />
                    <text
                      x={x + 12}
                      y={y + 20}
                      fill={hasNodes ? reg.accentHex : "#64748b"}
                      fontSize="11"
                      fontWeight="700"
                      letterSpacing="0.04em"
                    >
                      {reg.code} • {reg.shortName.toUpperCase()}
                    </text>
                    <text
                      x={x + 12}
                      y={y + 34}
                      fill="#94a3b8"
                      fontSize="9.5"
                      opacity="0.75"
                    >
                      {reg.poeArchetype}
                    </text>
                  </g>
                );
              })}

              {/* Edges with 5 Distinct Visual Styles */}
              {visibleEdges.map((edge) => {
                const sNode = vault.nodes.find((n) => n.id === edge.source);
                const tNode = vault.nodes.find((n) => n.id === edge.target);
                if (!sNode || !tNode) return null;

                const x1 = sNode.x + 64;
                const y1 = sNode.y + 30;
                const x2 = tNode.x + 64;
                const y2 = tNode.y + 30;

                const relDef =
                  EDGE_RELATIONS[edge.relation] || EDGE_RELATIONS.extension;
                const isConnectedToSelected =
                  sNode.id === selectedNodeId || tNode.id === selectedNodeId;

                // Buat lengkungan kurva Bezier yang berbeda untuk cross_disciplinary vs intra-region
                const dx = x2 - x1;
                const dy = y2 - y1;
                const curveOffset =
                  edge.relation === "cross_disciplinary" || edge.isCrossRegion
                    ? -36
                    : 0;
                const cx1 = x1 + dx * 0.42;
                const cy1 = y1 + curveOffset;
                const cx2 = x1 + dx * 0.58;
                const cy2 = y2 + curveOffset;

                const pathData = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2 + curveOffset * 0.5;

                return (
                  <g key={edge.id}>
                    {/* Outer subtle glow when selected */}
                    {isConnectedToSelected && (
                      <path
                        d={pathData}
                        fill="none"
                        stroke={relDef.strokeColor}
                        strokeWidth="6"
                        strokeOpacity="0.2"
                      />
                    )}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={relDef.strokeColor}
                      strokeWidth={isConnectedToSelected ? "2.8" : "1.8"}
                      strokeOpacity={isConnectedToSelected ? "0.98" : "0.62"}
                      strokeDasharray={relDef.dashArray}
                      markerEnd={`url(#arrow-${edge.relation})`}
                    />
                    {/* Label badge on edge midpoint when connected to selected node */}
                    {isConnectedToSelected && (
                      <g transform={`translate(${midX - 34}, ${midY - 9})`}>
                        <rect
                          width="68"
                          height="17"
                          rx="5"
                          fill="#0f172a"
                          stroke={relDef.strokeColor}
                          strokeWidth="1"
                        />
                        <text
                          x="34"
                          y="11.5"
                          textAnchor="middle"
                          fill={relDef.strokeColor}
                          fontSize="9"
                          fontWeight="700"
                        >
                          {relDef.shortLabel}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* HTML Interactive Nodes Layer */}
            <div className="absolute inset-0">
              {filteredNodes.map((node) => {
                const isSelected = node.id === selectedNodeId;
                const isRoot = node.relationToOrigin === "root" || node.id === "root";
                const regDef = KNOWLEDGE_REGIONS[node.region];
                const relDef =
                  node.relationToOrigin !== "root"
                    ? EDGE_RELATIONS[node.relationToOrigin]
                    : null;

                const leftPct = (node.x / 930) * 100;
                const topPct = (node.y / 536) * 100;

                return (
                  <button
                    key={node.id}
                    onClick={() => onSelectNode(node.id)}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                    }}
                    className={`group absolute w-[132px] rounded-xl border p-2 text-left transition-all duration-200 ${
                      isSelected
                        ? "z-20 scale-105 border-indigo-400 bg-[#151f36] ring-2 ring-indigo-500/50 shadow-xl"
                        : node.mastered
                        ? "z-10 border-emerald-500/60 bg-[#10192b]/95 hover:border-emerald-400"
                        : !node.explored
                        ? "z-10 border-slate-700/70 bg-[#0d1422]/75 opacity-70 saturate-50 hover:opacity-95 hover:saturate-100"
                        : "z-10 border-slate-700/90 bg-[#101829]/95 hover:border-indigo-400/70"
                    } ${isRoot ? "node-root-glow" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                          isRoot
                            ? "bg-indigo-500/25 text-indigo-200 border-indigo-400/50"
                            : relDef
                            ? relDef.badgeClass
                            : regDef.badgeClass
                        }`}
                      >
                        {isRoot ? "★ ORIGIN" : relDef?.shortLabel || node.region}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {!node.explored ? (
                          <span className="inline-flex items-center gap-0.5 text-amber-300">
                            <Lock className="h-2.5 w-2.5" />
                            Fog
                          </span>
                        ) : node.mastered ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-400 font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                          </span>
                        ) : (
                          node.region
                        )}
                      </span>
                    </div>
                    <div className="text-xs font-bold leading-tight text-slate-100 line-clamp-2 group-hover:text-indigo-200">
                      {node.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Legend Bar inside Canvas */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 bg-[#0b101b] px-3.5 py-2 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                <strong className="text-amber-300">---► Amber:</strong> Prerequisite Wajib
              </span>
              <span>
                <strong className="text-indigo-300">───► Indigo:</strong> Extension
              </span>
              <span>
                <strong className="text-emerald-300">───► Emerald:</strong> Application
              </span>
              <span>
                <strong className="text-sky-300">···► Cyan:</strong> Related
              </span>
              <span>
                <strong className="text-purple-300">-·-► Ungu:</strong> Lintas-Region (PoE Cross-Border)
              </span>
            </div>
            <span className="text-slate-400">
              Klik node untuk membuka catatan Obsidian &amp; alasan hubungan
            </span>
          </div>
        </div>
      ) : (
        /* Accessible Outline View (Ramah Layar Kecil & Pembaca Teks - FR-11) */
        <div className="h-[536px] overflow-y-auto rounded-xl border border-slate-800 bg-[#090d16] p-4 space-y-3">
          {filteredNodes.map((node: KnowledgeNode, idx: number) => {
            const isSelected = node.id === selectedNodeId;
            const regDef = KNOWLEDGE_REGIONS[node.region];
            const incoming = vault.edges.filter((e) => e.target === node.id);
            const outgoing = vault.edges.filter((e) => e.source === node.id);

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node.id)}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-slate-800 bg-[#0f1624] hover:border-slate-700"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">
                      #{idx + 1}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs font-medium ${regDef.badgeClass}`}
                    >
                      {regDef.code} • {regDef.shortName}
                    </span>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                      Level: {node.difficulty}
                    </span>
                    {node.mastered && (
                      <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                        ✓ Dipahami
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                    <Compass className="h-3.5 w-3.5" />
                    Buka Catatan Node →
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100">{node.title}</h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  {node.summary}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>
                    <strong className="text-slate-300">Incoming Links:</strong>{" "}
                    {incoming.length} koneksi
                  </span>
                  <span>
                    <strong className="text-slate-300">Outgoing Branches:</strong>{" "}
                    {outgoing.length} cabang
                  </span>
                  <span className="inline-flex items-center gap-1 text-indigo-300">
                    <Sparkles className="h-3 w-3" />
                    Ref: {node.reference}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
