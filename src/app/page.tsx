"use client";

import CreateVaultModal from "@/components/CreateVaultModal";
import NodeInspector from "@/components/NodeInspector";
import OverviewModal from "@/components/OverviewModal";
import SkillTreeCanvas from "@/components/SkillTreeCanvas";
import ValidatorModal from "@/components/ValidatorModal";
import { PRESET_VAULTS } from "@/lib/presets";
import { KNOWLEDGE_REGIONS } from "@/lib/regions";
import { KnowledgeVault, VaultInputContext } from "@/types/knowledge";
import {
  BookOpen,
  Code2,
  Compass,
  FolderKanban,
  FolderPlus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";

const STORAGE_KEY = "nexusvault_ai_vaults_v1";

export default function HomePage() {
  const [vaults, setVaults] = useState<KnowledgeVault[]>(PRESET_VAULTS);
  const [activeVaultId, setActiveVaultId] = useState<string>(
    PRESET_VAULTS[0].id
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string>("n_respsel");

  // Modals & loading state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isValidatorOpen, setIsValidatorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [engineBadge, setEngineBadge] = useState<string>(
    "Curated OpenStax/Campbell Preset + DAG Validator"
  );

  // Load saved vaults from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVaults(parsed);
          setActiveVaultId(parsed[0].id);
          const defaultNode =
            parsed[0].nodes.find((n: { id: string }) => n.id !== "root") ||
            parsed[0].nodes[0];
          if (defaultNode) setSelectedNodeId(defaultNode.id);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const persistVaults = (nextVaults: KnowledgeVault[]) => {
    setVaults(nextVaults);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextVaults));
    } catch {
      // ignore quota errors
    }
  };

  const activeVault =
    vaults.find((v) => v.id === activeVaultId) || vaults[0] || PRESET_VAULTS[0];

  const selectedNode =
    activeVault.nodes.find((n) => n.id === selectedNodeId) ||
    activeVault.nodes[0];

  const handleSwitchVault = (vaultId: string) => {
    setActiveVaultId(vaultId);
    const targetVault = vaults.find((v) => v.id === vaultId);
    if (targetVault && targetVault.nodes.length > 0) {
      const preferred =
        targetVault.nodes.length > 2
          ? targetVault.nodes[2].id
          : targetVault.nodes[0].id;
      setSelectedNodeId(preferred);
    }
  };

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    // Buka Fog of War otomatis saat node diklik (BR-09)
    const targetNode = activeVault.nodes.find((n) => n.id === nodeId);
    if (targetNode && !targetNode.explored) {
      const updatedVaults = vaults.map((v) => {
        if (v.id !== activeVault.id) return v;
        return {
          ...v,
          nodes: v.nodes.map((n) =>
            n.id === nodeId ? { ...n, explored: true } : n
          ),
        };
      });
      persistVaults(updatedVaults);
    }
  };

  const handleUnlockAllFog = () => {
    const updatedVaults = vaults.map((v) => {
      if (v.id !== activeVault.id) return v;
      return {
        ...v,
        nodes: v.nodes.map((n) => ({ ...n, explored: true })),
      };
    });
    persistVaults(updatedVaults);
  };

  const handleMarkMastered = (nodeId: string) => {
    const updatedVaults = vaults.map((v) => {
      if (v.id !== activeVault.id) return v;
      return {
        ...v,
        nodes: v.nodes.map((n) =>
          n.id === nodeId ? { ...n, explored: true, mastered: true } : n
        ),
      };
    });
    persistVaults(updatedVaults);
  };

  const handleCreateVault = async (
    vaultName: string,
    inputContext: VaultInputContext
  ) => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaultName, inputContext }),
      });
      const data = await res.json();
      if (data?.ok && data.vault) {
        const createdVault: KnowledgeVault = data.vault;
        const nextVaults = [createdVault, ...vaults];
        persistVaults(nextVaults);
        setActiveVaultId(createdVault.id);
        setSelectedNodeId(createdVault.nodes[0]?.id || "root");
        setEngineBadge(
          data.engineUsed === "gemini-api"
            ? "Google Gemini 2.5 Flash + DAG Validator"
            : "Deterministic Synthesis Engine + DAG Validator"
        );
        setIsCreateOpen(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleExpandNode = async (nodeId: string) => {
    setIsExpanding(true);
    try {
      const res = await fetch("/api/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vault: activeVault,
          targetNodeId: nodeId,
        }),
      });
      const data = await res.json();
      if (data?.ok && data.vault) {
        const updatedVault: KnowledgeVault = data.vault;
        const nextVaults = vaults.map((v) =>
          v.id === activeVault.id ? updatedVault : v
        );
        persistVaults(nextVaults);
        if (Array.isArray(data.addedNodeIds) && data.addedNodeIds[0]) {
          setSelectedNodeId(data.addedNodeIds[0]);
        }
      }
    } finally {
      setIsExpanding(false);
    }
  };

  const handleDeleteVault = (vaultId: string) => {
    const remaining = vaults.filter((v) => v.id !== vaultId);
    const safeList = remaining.length > 0 ? remaining : PRESET_VAULTS;
    persistVaults(safeList);
    if (activeVaultId === vaultId) {
      setActiveVaultId(safeList[0].id);
      setSelectedNodeId(safeList[0].nodes[0]?.id || "root");
    }
  };

  const handleResetPresets = () => {
    persistVaults(PRESET_VAULTS);
    setActiveVaultId(PRESET_VAULTS[0].id);
    setSelectedNodeId("n_respsel");
  };

  const exploredCount = activeVault.nodes.filter((n) => n.explored).length;
  const masteredCount = activeVault.nodes.filter((n) => n.mastered).length;
  const crossEdgesCount = activeVault.edges.filter(
    (e) => e.relation === "cross_disciplinary" || e.isCrossRegion
  ).length;
  const activeRegions = Array.from(
    new Set(activeVault.nodes.map((n) => n.region))
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* Top Navbar: Brand + Obsidian Vault Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#0b111e]/95 backdrop-blur-md px-4 py-3">
        <div className="mx-auto max-w-[1440px] flex flex-wrap items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-lg shadow-indigo-600/25">
              NV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">
                  NexusVault AI
                </h1>
                <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300">
                  Smart &amp; Fun Education • LOGICODIX 2026
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Obsidian-Style Knowledge Vaults × Path of Exile Regional Skill Tree
              </p>
            </div>
          </div>

          {/* Vault Switcher Bar (BR-01: Vault Isolation) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <FolderKanban className="h-4 w-4 text-indigo-400" />
              Active Vault:
            </span>
            {vaults.map((v) => {
              const isActive = v.id === activeVault.id;
              return (
                <div key={v.id} className="inline-flex items-center">
                  <button
                    onClick={() => handleSwitchVault(v.id)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    {v.name}
                  </button>
                  {!v.isPreset && (
                    <button
                      onClick={() => handleDeleteVault(v.id)}
                      title="Hapus Vault kustom ini"
                      className="ml-1 rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:border-rose-500/40 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition-all"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              + Buat Vault Baru
            </button>

            <button
              onClick={handleResetPresets}
              title="Reset ke 3 Preset Vault awal"
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-1.5 text-slate-400 hover:text-slate-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 space-y-4">
        {/* Top Context & Telemetry Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Vault Context Card (7 cols) */}
          <section className="lg:col-span-7 rounded-2xl border border-slate-800/90 bg-[#0d1320] p-4 shadow-lg flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                  {activeVault.inputContext.mode === "mode_a" ? (
                    <>
                      <BookOpen className="h-3.5 w-3.5" />
                      Mode A: Eksplorasi dari Materi Kurikulum
                    </>
                  ) : (
                    <>
                      <Compass className="h-3.5 w-3.5" />
                      Mode B: Eksplorasi dari Minat &amp; Tujuan
                    </>
                  )}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Engine: {engineBadge}
                </span>
              </div>

              <button
                onClick={() => setIsOverviewOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/25 px-3 py-1 text-xs font-semibold text-indigo-200 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Baca Modul Fondasi Vault
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-slate-800/90 bg-[#090d16] p-2.5">
                <div className="text-[11px] text-slate-400">
                  {activeVault.inputContext.mode === "mode_a"
                    ? "Mata Pelajaran / Domain"
                    : "Bidang Minat Utama"}
                </div>
                <div className="mt-0.5 text-xs font-bold text-slate-100 truncate">
                  {activeVault.inputContext.mode === "mode_a"
                    ? activeVault.inputContext.subject
                    : activeVault.inputContext.interestDomain}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/90 bg-[#090d16] p-2.5">
                <div className="text-[11px] text-slate-400">
                  {activeVault.inputContext.mode === "mode_a"
                    ? "Bab Materi Awal"
                    : "Topik Tujuan Eksplorasi"}
                </div>
                <div className="mt-0.5 text-xs font-bold text-slate-100 truncate">
                  {activeVault.inputContext.mode === "mode_a"
                    ? activeVault.inputContext.chapter
                    : activeVault.inputContext.targetGoal}
                </div>
              </div>

              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2.5">
                <div className="text-[11px] text-indigo-300">
                  Arah Personalisasi Minat &amp; Tujuan
                </div>
                <div className="mt-0.5 text-xs font-bold text-indigo-100 truncate">
                  {activeVault.inputContext.interestDomain}
                </div>
              </div>
            </div>
          </section>

          {/* Exploration Telemetry & Validator Card (5 cols) */}
          <section className="lg:col-span-5 rounded-2xl border border-slate-800/90 bg-[#0d1320] p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                Progres Eksplorasi &amp; DAG Guardrails
              </span>
              <button
                onClick={() => setIsValidatorOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:border-indigo-500 px-2.5 py-1 text-xs font-mono text-slate-200"
              >
                <Code2 className="h-3.5 w-3.5 text-indigo-400" />
                Inspect JSON &amp; Validator
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-slate-800 bg-[#090d16] p-2.5">
                <div className="text-[11px] text-slate-400">Node Terbuka</div>
                <div className="text-base font-bold text-indigo-300">
                  {exploredCount} / {activeVault.nodes.length}
                </div>
                <div className="text-[10px] text-slate-400">Fog of War Aktif</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#090d16] p-2.5">
                <div className="text-[11px] text-slate-400">Konsep Dipahami</div>
                <div className="text-base font-bold text-emerald-300">
                  {masteredCount} / {activeVault.nodes.length}
                </div>
                <div className="text-[10px] text-slate-400">Cek Paham 1-Klik</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#090d16] p-2.5">
                <div className="text-[11px] text-slate-400">Sebaran Region</div>
                <div className="text-base font-bold text-purple-300">
                  {activeRegions.length} / 6 Region
                </div>
                <div className="text-[10px] text-slate-400">
                  {crossEdgesCount} Lintas-Bidang
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Main 12-Col Workspace: SkillTreeCanvas (7 cols) + NodeInspector (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-7">
            <SkillTreeCanvas
              vault={activeVault}
              selectedNodeId={selectedNode.id}
              onSelectNode={handleSelectNode}
              onUnlockAllFog={handleUnlockAllFog}
            />
          </div>
          <div className="lg:col-span-5">
            <NodeInspector
              vault={activeVault}
              node={selectedNode}
              onSelectNode={handleSelectNode}
              onMarkMastered={handleMarkMastered}
              onExpandNode={handleExpandNode}
              isExpanding={isExpanding}
            />
          </div>
        </div>

        {/* Bottom 6 Knowledge Regions Reference Strip */}
        <section className="rounded-2xl border border-slate-800/80 bg-[#0d1320]/80 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Kompas 6 Knowledge Regions (Sistem Kuadran Lintas-Disiplin ala Path of Exile — BR-04)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
            {Object.values(KNOWLEDGE_REGIONS).map((reg) => {
              const count = activeVault.nodes.filter(
                (n) => n.region === reg.code
              ).length;
              return (
                <div
                  key={reg.code}
                  className={`rounded-xl border p-2.5 text-xs ${
                    count > 0
                      ? "border-slate-700 bg-[#090d16]"
                      : "border-slate-800/60 bg-[#090d16]/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${reg.badgeClass}`}
                    >
                      {reg.code}
                    </span>
                    <span className="font-mono text-[11px] text-slate-300">
                      {count} node
                    </span>
                  </div>
                  <div className="font-bold text-slate-200">{reg.shortName}</div>
                  <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">
                    {reg.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Modals */}
      <CreateVaultModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateVault={handleCreateVault}
        isLoading={isCreating}
      />
      <OverviewModal
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        vault={activeVault}
      />
      <ValidatorModal
        isOpen={isValidatorOpen}
        onClose={() => setIsValidatorOpen(false)}
        vault={activeVault}
      />
    </div>
  );
}
