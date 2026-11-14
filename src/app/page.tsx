"use client";

import CreateVaultModal from "@/components/CreateVaultModal";
import {
  EmptyExplorerVector,
  HeroLearnerVector,
  TrellisLogo,
} from "@/components/Illustrations";
import NodeInspector from "@/components/NodeInspector";
import OverviewModal from "@/components/OverviewModal";
import SkillTreeCanvas from "@/components/SkillTreeCanvas";
import { PRESET_VAULTS } from "@/lib/presets";
import { EDGE_RELATIONS, KNOWLEDGE_REGIONS } from "@/lib/regions";
import {
  EdgeRelationType,
  KnowledgeVault,
  RegionCode,
  VaultInputContext,
} from "@/types/knowledge";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CloudFog,
  Compass,
  Database,
  Eye,
  Folder,
  FolderPlus,
  GitBranch,
  HelpCircle,
  Home,
  Keyboard,
  Layers,
  Maximize2,
  Menu,
  MousePointerClick,
  Network,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "trellis_vaults_v1";
const LEGACY_STORAGE_KEY = "nexusvault_ai_vaults_v1";

type AppTab = "home" | "vaults" | "presets" | "tree" | "guide";

export default function HomePage() {
  const [vaults, setVaults] = useState<KnowledgeVault[]>(PRESET_VAULTS);
  const [activeVaultId, setActiveVaultId] = useState<string>(
    PRESET_VAULTS[0].id
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters & search
  const [vaultSearch, setVaultSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modals & loading states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [showEmptyDemo, setShowEmptyDemo] = useState(false);

  // Expansion feedback
  const [newlyAddedIds, setNewlyAddedIds] = useState<string[]>([]);
  const [expandedRegions, setExpandedRegions] = useState<RegionCode[]>([]);
  const [expandToast, setExpandToast] = useState<string | null>(null);

  // Hydrate persisted Vaults
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVaults(parsed);
          setActiveVaultId(parsed[0].id);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const persistVaults = (nextVaults: KnowledgeVault[]) => {
    setVaults(nextVaults);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextVaults));
    } catch {
      // ignore storage errors
    }
  };

  const activeVault =
    vaults.find((v) => v.id === activeVaultId) || vaults[0] || PRESET_VAULTS[0];
  const selectedNode = selectedNodeId
    ? activeVault.nodes.find((n) => n.id === selectedNodeId) || null
    : null;

  const openVaultInTree = (vaultId: string) => {
    setActiveVaultId(vaultId);
    setSelectedNodeId(null);
    setNewlyAddedIds([]);
    setExpandedRegions([]);
    setActiveTab("tree");
    setMobileMenuOpen(false);
  };

  const handleSelectNode = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (!nodeId) return;
    // Lift Fog of War immediately when user clicks a shrouded frontier node
    const targetNode = activeVault.nodes.find((n) => n.id === nodeId);
    if (targetNode && !targetNode.explored) {
      const updatedVaults = vaults.map((v) => {
        if (v.id !== activeVault.id) return v;
        return {
          ...v,
          updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
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
        setSelectedNodeId(null);
        setIsCreateOpen(false);
        setShowEmptyDemo(false);
        setActiveTab("tree");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleExpandNode = async (nodeId: string) => {
    setIsExpanding(true);
    try {
      const prevIds = new Set(activeVault.nodes.map((n) => n.id));
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

        const newNodes = updatedVault.nodes.filter((n) => !prevIds.has(n.id));
        const touchedRegs = Array.from(new Set(newNodes.map((n) => n.region)));
        setNewlyAddedIds(newNodes.map((n) => n.id));
        setExpandedRegions(touchedRegs);
        setExpandToast(
          `${newNodes.length} new branch${
            newNodes.length > 1 ? "es" : ""
          } mapped · ${touchedRegs.join(" & ")} expanded`
        );
        setTimeout(() => setExpandToast(null), 5000);

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
      setSelectedNodeId(null);
    }
  };

  const handleResetPresets = () => {
    persistVaults(PRESET_VAULTS);
    setActiveVaultId(PRESET_VAULTS[0].id);
    setSelectedNodeId(null);
    setShowEmptyDemo(false);
  };

  // Global aggregate activity metrics
  const totalMappedAllVaults = vaults.reduce(
    (sum, v) => sum + v.nodes.length,
    0
  );
  const totalMasteredAllVaults = vaults.reduce(
    (sum, v) => sum + v.nodes.filter((n) => n.mastered).length,
    0
  );
  const globalRegionsExplored = Array.from(
    new Set(vaults.flatMap((v) => v.nodes.map((n) => n.region)))
  );

  const filteredVaults = vaults.filter((v) => {
    const q = vaultSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      v.name.toLowerCase().includes(q) ||
      v.inputContext.interestDomain.toLowerCase().includes(q) ||
      (v.inputContext.chapter || "").toLowerCase().includes(q)
    );
  });

  const navItems: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Home", icon: <Home className="h-4 w-4" /> },
    {
      id: "vaults",
      label: "My Vaults",
      icon: <Folder className="h-4 w-4" />,
    },
    {
      id: "presets",
      label: "Explore Presets",
      icon: <Compass className="h-4 w-4" />,
    },
    {
      id: "tree",
      label: "Knowledge Tree",
      icon: <Network className="h-4 w-4" />,
    },
    {
      id: "guide",
      label: "Getting Started",
      icon: <HelpCircle className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F3F6FC] text-[#17233C]">
      {/* Mobile Header */}
      <header className="flex lg:hidden items-center justify-between bg-[#17263C] px-4 py-3 text-white sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <TrellisLogo size={32} />
          <span className="text-lg font-extrabold tracking-tight">Trellis</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg bg-[#2F80ED] px-3 py-1.5 text-xs font-bold text-white"
          >
            + New Vault
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((s) => !s)}
            className="rounded-lg border border-white/15 p-1.5 text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {/* Left Navy Navigation Sidebar (#17263C matching Figma Screens 01-06) */}
      <aside
        className={`${
          mobileMenuOpen ? "flex" : "hidden"
        } lg:flex lg:w-64 lg:shrink-0 flex-col justify-between bg-[#17263C] text-white p-4 lg:sticky lg:top-0 lg:h-screen z-30`}
      >
        <div className="space-y-6">
          {/* Brand Logo (Preserved icon + Trellis name) */}
          <div className="hidden lg:flex items-center gap-3 px-2 pt-1">
            <TrellisLogo size={36} />
            <div>
              <div className="text-xl font-extrabold tracking-tight text-white">
                Trellis
              </div>
              <div className="text-[10.5px] font-medium text-[#8FA2BD]">
                Your Knowledge Cosmos
              </div>
            </div>
          </div>

          {/* Primary Nav */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
                    active
                      ? "bg-[#2F80ED] text-white shadow-md shadow-[#2F80ED]/30"
                      : "text-[#B4C2D6] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Recent Vaults Switcher */}
          <div>
            <div className="px-2 mb-2 text-[10.5px] font-bold uppercase tracking-wider text-[#647B99]">
              Recent Vaults
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {vaults.slice(0, 6).map((v) => {
                const isCur = v.id === activeVault.id && activeTab === "tree";
                return (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => openVaultInTree(v.id)}
                    className={`w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium transition-all ${
                      isCur
                        ? "bg-white/10 text-white font-bold"
                        : "text-[#B4C2D6] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Folder className="h-3.5 w-3.5 shrink-0 text-[#60A5FA]" />
                    <span className="truncate">{v.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Storage Note + Primary CTA */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <div className="rounded-xl bg-[#1E314D] p-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#DCE6F5]">
              <Database className="h-4 w-4 text-[#60A5FA]" />
              Saved on this device
            </div>
            <p className="mt-0.5 text-[11px] text-[#8FA2BD]">
              Autosaved locally · Always ready
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsCreateOpen(true);
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] py-2.5 px-4 text-xs font-bold text-white shadow-md shadow-[#2F80ED]/25 transition-all"
          >
            <FolderPlus className="h-4 w-4" />
            + Create New Vault
          </button>
        </div>
      </aside>

      {/* Main Content Stage */}
      <main className="flex-1 min-w-0">
        {/* Top Utility Search & Actions Strip (when not in full Tree view, or slim in Tree view) */}
        {activeTab !== "tree" && (
          <div className="mx-auto max-w-[1260px] px-4 sm:px-8 pt-5 pb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C9AAE]" />
              <input
                ref={searchInputRef}
                type="text"
                value={vaultSearch}
                onChange={(e) => {
                  setVaultSearch(e.target.value);
                  if (activeTab === "home" && e.target.value.trim()) {
                    setActiveTab("vaults");
                  }
                }}
                placeholder="Search your vaults..."
                className="w-full rounded-xl border border-[#DFE6F0] bg-white pl-10 pr-14 py-2.5 text-sm text-[#17233C] placeholder:text-[#94A3B8] shadow-sm focus:border-[#2F80ED] focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-[#DFE6F0] bg-[#F3F6FC] px-1.5 py-0.5 text-[10px] font-bold text-[#6F7E93]">
                Ctrl K
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === "home" && (
                <button
                  type="button"
                  onClick={() => setShowEmptyDemo((d) => !d)}
                  className="rounded-xl border border-[#DFE6F0] bg-white hover:border-[#2F80ED] px-3 py-2 text-xs font-semibold text-[#6F7E93] hover:text-[#17233C]"
                  title="Preview first-time empty state layout"
                >
                  {showEmptyDemo ? "Show Populated Home" : "Preview Empty State"}
                </button>
              )}
              <button
                type="button"
                onClick={handleResetPresets}
                title="Reset preset vaults"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFE6F0] bg-white hover:bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#6F7E93] hover:text-[#17233C]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Presets
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tree")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#EAF2FF] hover:bg-[#DCEAFE] px-3.5 py-2 text-xs font-bold text-[#2F80ED]"
              >
                <Network className="h-3.5 w-3.5" />
                Open Active Tree
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: HOME DASHBOARD (Figma Screen 01 & Screen 02) */}
        {activeTab === "home" && (
          <div className="mx-auto max-w-[1260px] px-4 sm:px-8 py-4 space-y-6">
            {/* Hero Welcome & Transparent Pure-SVG Illustration */}
            <section className="relative pt-2">
              <div className="mb-4 max-w-xl">
                <h1 className="text-[26px] sm:text-4xl font-extrabold tracking-tight text-[#17233C]">
                  Your Knowledge{" "}
                  <span className="whitespace-nowrap">
                    Cosmos
                    <span className="inline-block ml-1.5 h-2.5 w-2.5 rounded-full bg-[#FFA33A] align-baseline" />
                  </span>
                </h1>
                <p className="mt-1.5 text-base text-[#6F7E93]">
                  Where curiosity grows into a universe of connected knowledge.
                </p>
              </div>

              <div className="relative overflow-visible">
                <div
                  style={{
                    background:
                      "linear-gradient(90deg, #2F80ED 0%, #3F8EFC 65%, #CFE2FF 100%)",
                  }}
                  className="rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-[#2F80ED]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="max-w-lg z-10">
                    <h2 className="text-xl sm:text-2xl font-extrabold">
                      Start a new exploration
                    </h2>
                    <p className="mt-1.5 text-sm text-[#E3EEFF]">
                      Begin from a study material or follow your personal
                      curiosity in a living, ever-expanding knowledge tree.
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="rounded-xl bg-white hover:bg-[#F8FAFC] px-5 py-2.5 text-sm font-bold text-[#2F80ED] shadow-sm transition-all"
                      >
                        + Create New Vault
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("tree")}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
                        aria-label="Open Active Skill Tree"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="hidden md:block w-[360px] h-[120px] shrink-0" />
                </div>

                {/* Overlapping transparent vector on desktop! */}
                <div className="hidden md:block pointer-events-none absolute -top-24 right-4 w-[400px] h-[270px]">
                  <HeroLearnerVector className="w-full h-full drop-shadow-sm" />
                </div>
              </div>
            </section>

            {showEmptyDemo ? (
              /* Screen 02: Empty State First-Time User + Preset Shortcuts */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-7 rounded-3xl border border-[#DFE6F0] bg-white p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                  <div className="w-56 h-48 shrink-0">
                    <EmptyExplorerVector />
                  </div>
                  <div className="space-y-3 text-center sm:text-left">
                    <h3 className="text-xl font-extrabold text-[#17233C]">
                      No vaults created yet
                    </h3>
                    <p className="text-xs leading-relaxed text-[#6F7E93]">
                      Create your first Knowledge Vault from a school chapter
                      (Mode A) or a personal curiosity (Mode B), or explore a
                      ready-made preset right away.
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-4 py-2.5 text-xs font-bold text-white"
                      >
                        <FolderPlus className="h-4 w-4" />
                        Create First Vault
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("presets")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#EAF2FF] hover:bg-[#DCEAFE] px-4 py-2.5 text-xs font-bold text-[#2F80ED]"
                      >
                        <Compass className="h-4 w-4" />
                        Browse {PRESET_VAULTS.length} Presets
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-[#17233C]">
                      Explore Presets
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("presets")}
                      className="text-xs font-bold text-[#2F80ED] hover:underline"
                    >
                      View all →
                    </button>
                  </div>
                  {PRESET_VAULTS.map((pv) => {
                    const reg = KNOWLEDGE_REGIONS[pv.overview.startingRegion];
                    return (
                      <div
                        key={pv.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[#DFE6F0] bg-white p-3.5 shadow-sm"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-[#17233C] truncate">
                            {pv.name}
                          </div>
                          <div className="text-xs text-[#6F7E93] mt-0.5">
                            {pv.nodes.length} mapped · {pv.overview.startingRegion}
                          </div>
                          <span
                            className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${reg.badgeClass}`}
                          >
                            {reg.code} · {reg.shortName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openVaultInTree(pv.id)}
                          className="shrink-0 rounded-xl bg-[#EAF2FF] hover:bg-[#DCEAFE] px-3 py-2 text-xs font-bold text-[#2F80ED]"
                        >
                          Open →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* 4 Open Activity Metrics */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-[#DFE6F0] bg-white p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF4E5] text-[#FFA33A]">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-[#17233C]">
                        {vaults.length}
                      </div>
                      <div className="text-xs font-medium text-[#6F7E93]">
                        Total Vaults
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#DFE6F0] bg-white p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#2F80ED]">
                      <Network className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-[#17233C]">
                        {totalMappedAllVaults}
                      </div>
                      <div className="text-xs font-medium text-[#6F7E93]">
                        Concepts Mapped
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#DFE6F0] bg-white p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEF9C3] text-[#CA8A04]">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-[#17233C]">
                        {totalMasteredAllVaults}
                      </div>
                      <div className="text-xs font-medium text-[#6F7E93]">
                        Mastered Notes
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#DFE6F0] bg-white p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#0D9468]">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-[#17233C]">
                        {globalRegionsExplored.length} / 6
                      </div>
                      <div className="text-xs font-medium text-[#6F7E93]">
                        Regions Explored
                      </div>
                    </div>
                  </div>
                </section>

                {/* Continue Exploring Vaults (NO progress bars or %!) */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-[#17233C]">
                      Continue Exploring
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("vaults")}
                      className="text-xs font-bold text-[#2F80ED] hover:underline"
                    >
                      View all →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vaults.slice(0, 2).map((v) => {
                      const reg =
                        KNOWLEDGE_REGIONS[v.overview.startingRegion] ||
                        KNOWLEDGE_REGIONS["REG-01"];
                      const vRegions = Array.from(
                        new Set(v.nodes.map((n) => n.region))
                      ).length;
                      const vMastered = v.nodes.filter((n) => n.mastered).length;
                      return (
                        <div
                          key={v.id}
                          className="rounded-2xl border border-[#DFE6F0] bg-white p-5 flex items-center justify-between gap-4 shadow-sm hover:border-[#2F80ED]/60 transition-all"
                        >
                          <div className="min-w-0 space-y-2">
                            <div>
                              <h3 className="text-base font-extrabold text-[#17233C] truncate">
                                {v.name}
                              </h3>
                              <p className="text-xs text-[#6F7E93] truncate">
                                {reg.name} · {v.nodes.length} mapped ·{" "}
                                {vRegions} regions
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${reg.badgeClass}`}
                              >
                                {reg.code} · {reg.shortName}
                              </span>
                              <span className="rounded-full bg-[#EAF2FF] px-2.5 py-0.5 text-[11px] font-bold text-[#2F80ED]">
                                {v.inputContext.mode === "mode_a"
                                  ? "Mode A · Material"
                                  : "Mode B · Interest"}
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-[#6F7E93]">
                              {vMastered} mastered · Open unbounded workspace
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openVaultInTree(v.id)}
                            className="shrink-0 rounded-xl bg-[#EAF2FF] hover:bg-[#2F80ED] text-[#2F80ED] hover:text-white px-4 py-2.5 text-xs font-bold transition-all"
                          >
                            Continue →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Quick Start Presets Strip */}
                <section className="space-y-3 pb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-[#17233C]">
                      Quick Start Presets
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("presets")}
                      className="text-xs font-bold text-[#2F80ED] hover:underline"
                    >
                      Explore Presets →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PRESET_VAULTS.map((pv) => {
                      const reg = KNOWLEDGE_REGIONS[pv.overview.startingRegion];
                      return (
                        <button
                          type="button"
                          key={pv.id}
                          onClick={() => openVaultInTree(pv.id)}
                          className="rounded-2xl border border-[#DFE6F0] bg-white hover:border-[#2F80ED] p-4 text-left flex items-center justify-between gap-3 shadow-sm transition-all"
                        >
                          <div className="min-w-0">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${reg.badgeClass}`}
                            >
                              {reg.code} · {reg.shortName}
                            </span>
                            <div className="mt-2 text-sm font-extrabold text-[#17233C] truncate">
                              {pv.name}
                            </div>
                            <div className="text-xs text-[#6F7E93] truncate mt-0.5">
                              {pv.overview.coreFormulaOrPrinciple}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-[#2F80ED] shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {/* TAB 2: MY VAULTS LIBRARY (Figma Screen 05) */}
        {activeTab === "vaults" && (
          <div className="mx-auto max-w-[1260px] px-4 sm:px-8 py-4 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold text-[#17233C]">
                  My Knowledge Vaults
                </h1>
                <p className="text-xs text-[#6F7E93]">
                  Keep every study map organized in its own workspace — explore
                  and branch out freely with zero limits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-4 py-2.5 text-xs font-bold text-white shadow-sm"
              >
                <FolderPlus className="h-4 w-4" />
                + Create New Vault
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVaults.map((v) => {
                const reg =
                  KNOWLEDGE_REGIONS[v.overview.startingRegion] ||
                  KNOWLEDGE_REGIONS["REG-01"];
                const vOpened = v.nodes.filter((n) => n.explored).length;
                const vMastered = v.nodes.filter((n) => n.mastered).length;
                const vRegs = Array.from(
                  new Set(v.nodes.map((n) => n.region))
                ).length;

                return (
                  <div
                    key={v.id}
                    className="rounded-2xl border border-[#DFE6F0] bg-white p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-[#2F80ED]/60 transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${reg.badgeClass}`}
                        >
                          {reg.code} · {reg.shortName}
                        </span>
                        <span className="rounded-full bg-[#F3F6FC] px-2.5 py-0.5 text-[11px] font-bold text-[#6F7E93]">
                          {v.inputContext.mode === "mode_a"
                            ? "Mode A"
                            : "Mode B"}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-[#17233C]">
                        {v.name}
                      </h3>
                      <p className="text-xs text-[#6F7E93] line-clamp-2">
                        {v.overview.summary}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-[#DFE6F0]">
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#6F7E93]">
                        <span>{v.nodes.length} mapped</span>
                        <span>{vOpened} opened</span>
                        <span className="text-[#0D9468]">
                          {vMastered} mastered
                        </span>
                        <span>{vRegs}/6 regions</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openVaultInTree(v.id)}
                          className="flex-1 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] py-2 px-3 text-xs font-bold text-white transition-all"
                        >
                          Open Skill Tree →
                        </button>
                        {!v.isPreset && (
                          <button
                            type="button"
                            onClick={() => handleDeleteVault(v.id)}
                            title="Delete custom Vault"
                            className="rounded-xl border border-[#DFE6F0] p-2 text-[#6F7E93] hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: EXPLORE PRESETS (Figma Screen 06) */}
        {activeTab === "presets" && (
          <div className="mx-auto max-w-[1260px] px-4 sm:px-8 py-4 space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold text-[#17233C]">
                Explore Preset Vaults
              </h1>
              <p className="text-xs text-[#6F7E93]">
                Try curated science knowledge trees ready to open, read, and
                expand freely from study chapters or personal questions.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {PRESET_VAULTS.map((pv) => {
                const reg = KNOWLEDGE_REGIONS[pv.overview.startingRegion];
                return (
                  <div
                    key={pv.id}
                    className="rounded-3xl border border-[#DFE6F0] bg-white p-6 flex flex-col justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${reg.badgeClass}`}
                        >
                          {reg.code} · {reg.shortName}
                        </span>
                        <span className="rounded-full bg-[#EAF2FF] px-2.5 py-0.5 text-[11px] font-bold text-[#2F80ED]">
                          {pv.inputContext.mode === "mode_a"
                            ? "Mode A · Material"
                            : "Mode B · Goal"}
                        </span>
                      </div>

                      <h2 className="text-lg font-extrabold text-[#17233C]">
                        {pv.name}
                      </h2>
                      <p className="text-xs leading-relaxed text-[#6F7E93]">
                        {pv.overview.summary}
                      </p>

                      <div className="rounded-xl border border-[#DFE6F0] bg-[#F8FAFC] p-3">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6F7E93]">
                          Key Path
                        </div>
                        <div className="mt-1 font-mono text-[11px] font-semibold text-[#17233C]">
                          {pv.overview.coreFormulaOrPrinciple}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#DFE6F0]">
                      <button
                        type="button"
                        onClick={() => openVaultInTree(pv.id)}
                        className="flex-1 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] py-2.5 px-4 text-xs font-bold text-white"
                      >
                        Open Skill Tree →
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveVaultId(pv.id);
                          setIsOverviewOpen(true);
                        }}
                        className="rounded-xl border border-[#DFE6F0] bg-white hover:bg-[#F3F6FC] py-2.5 px-3 text-xs font-bold text-[#17233C]"
                      >
                        Foundation
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: KNOWLEDGE TREE WORKSPACE (Full-Screen Clean Canvas + Node Study Modal) */}
        {activeTab === "tree" && (
          <div className="relative w-full h-[calc(100vh-56px)] lg:h-screen">
            <SkillTreeCanvas
              vault={activeVault}
              vaults={vaults}
              onSwitchVault={openVaultInTree}
              onOpenOverview={() => setIsOverviewOpen(true)}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              onUnlockAllFog={handleUnlockAllFog}
              newlyAddedIds={newlyAddedIds}
              expandedRegions={expandedRegions}
            />

            {/* Floating Expansion Toast (does not consume permanent canvas space) */}
            {expandToast && (
              <div className="pointer-events-none fixed bottom-5 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-lg flex justify-center">
                <div className="pointer-events-auto rounded-2xl border border-[#2F80ED] bg-white/95 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF3E0] text-[#FFA33A]">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[#17233C]">
                        {expandToast}
                      </div>
                      <div className="text-[11px] text-[#6F7E93]">
                        New concepts organized smoothly inside their Region.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandToast(null)}
                    className="text-xs font-bold text-[#2F80ED] hover:underline shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Node Material Modal (Appears only when a node is selected; Close unselects node) */}
            <NodeInspector
              vault={activeVault}
              node={selectedNode}
              onSelectNode={handleSelectNode}
              onClose={() => setSelectedNodeId(null)}
              onMarkMastered={handleMarkMastered}
              onExpandNode={handleExpandNode}
              isExpanding={isExpanding}
            />
          </div>
        )}

        {/* TAB 5: GETTING STARTED APP TUTORIAL & REFERENCE GUIDE */}
        {activeTab === "guide" && (
          <div className="mx-auto max-w-[1160px] px-4 sm:px-8 py-6 space-y-6">
            {/* Hero Intro */}
            <div className="rounded-3xl border border-[#DFE6F0] bg-white p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1.5 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2FF] px-3 py-0.5 text-[11px] font-bold text-[#2F80ED]">
                  <HelpCircle className="h-3.5 w-3.5" />
                  Trellis User Guide
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17233C]">
                  Getting Started with Trellis
                </h1>
                <p className="text-sm text-[#6F7E93]">
                  Everything you need to know to map study topics, uncover hidden
                  connections, and grow your personal Knowledge Cosmos step by
                  step.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-4 py-2.5 text-xs font-bold text-white shadow-sm"
                >
                  <FolderPlus className="h-4 w-4" />
                  + Create New Vault
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("tree")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFE6F0] bg-[#F8FAFC] hover:border-[#2F80ED] px-4 py-2.5 text-xs font-bold text-[#17233C]"
                >
                  <Network className="h-4 w-4 text-[#2F80ED]" />
                  Open Tree Canvas
                </button>
              </div>
            </div>

            {/* 4-Step Practical Tutorial */}
            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-[#17233C]">
                How to Explore in 4 Simple Steps
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    step: "Step 1",
                    title: "Create or Open a Vault",
                    desc: "Click + Create New Vault and pick From Material (when studying a textbook or chapter) or From Interest (when following a curiosity question). Not sure yet? Open a ready-made Preset first.",
                    tip: "Action: + Create New Vault",
                    icon: <FolderPlus className="h-5 w-5 text-[#2F80ED]" />,
                    bg: "bg-[#EAF2FF]",
                  },
                  {
                    step: "Step 2",
                    title: "Navigate & Lift the Fog",
                    desc: "Drag the canvas to pan, use scroll or +/- to zoom, and click any hazy node labeled FOG to unlock it. Switch between Aura: Soft, Aura: Pure, Borders: Solid, or Outline list anytime.",
                    tip: "Action: Click FOG node · Aura toggle",
                    icon: <CloudFog className="h-5 w-5 text-[#0D9468]" />,
                    bg: "bg-[#ECFDF5]",
                  },
                  {
                    step: "Step 3",
                    title: "Read & Test in the Modal",
                    desc: "Click any node to open its Concept Reader modal. Enlarge it for focused reading, switch between Easy Analogy, Standard, and Advanced depth, then test yourself with Quick Check.",
                    tip: "Action: Click Enlarge (⤢) or × / Canvas to close",
                    icon: <Maximize2 className="h-5 w-5 text-[#7C3AED]" />,
                    bg: "bg-[#F5F3FF]",
                  },
                  {
                    step: "Step 4",
                    title: "Expand Without Limits",
                    desc: "Want to dive deeper from any concept? Click Expand This Node inside its study modal to generate new branches and cross-disciplinary bridges automatically.",
                    tip: "Action: Expand This Node",
                    icon: <Sparkles className="h-5 w-5 text-[#FFA33A]" />,
                    bg: "bg-[#FFF4E5]",
                  },
                ].map((card) => (
                  <div
                    key={card.step}
                    className="rounded-2xl border border-[#DFE6F0] bg-white p-5 flex flex-col justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}
                        >
                          {card.icon}
                        </div>
                        <span className="rounded-full bg-[#F3F6FC] px-2.5 py-0.5 text-[10.5px] font-bold text-[#6F7E93]">
                          {card.step}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-[#17233C]">
                        {card.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-[#6F7E93]">
                        {card.desc}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#F8FAFC] border border-[#DFE6F0] px-3 py-1.5 text-[11px] font-semibold text-[#17233C]">
                      {card.tip}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Understanding Connection Lines & Regions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* 6 Knowledge Regions Guide (moved cleanly out of Tree canvas!) */}
              <section className="lg:col-span-7 rounded-2xl border border-[#DFE6F0] bg-white p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-extrabold text-[#17233C] flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#2F80ED]" />
                      Understanding the 6 Knowledge Regions
                    </h2>
                    <p className="text-xs text-[#6F7E93] mt-0.5">
                      Every concept belongs to a domain region on the map so you
                      can see how topics cross between different fields.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(KNOWLEDGE_REGIONS).map((reg) => (
                    <div
                      key={reg.code}
                      className="rounded-xl border border-[#DFE6F0] bg-[#F8FAFC] p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${reg.badgeClass}`}
                        >
                          {reg.code}
                        </span>
                        <span className="font-bold text-[#17233C] truncate">
                          {reg.shortName}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#6F7E93]">
                        {reg.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 5 Connection Styles + Tips */}
              <section className="lg:col-span-5 space-y-4">
                <div className="rounded-2xl border border-[#DFE6F0] bg-white p-5 space-y-3 shadow-sm">
                  <h2 className="text-sm font-extrabold text-[#17233C] flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-[#4F46E5]" />
                    Reading Connection Lines
                  </h2>
                  <div className="space-y-2.5">
                    {(Object.keys(EDGE_RELATIONS) as EdgeRelationType[]).map(
                      (rt) => {
                        const rel = EDGE_RELATIONS[rt];
                        return (
                          <div
                            key={rt}
                            className="rounded-xl border border-[#DFE6F0] bg-[#F8FAFC] p-2.5 flex items-start gap-3"
                          >
                            <span
                              style={{
                                borderColor: rel.strokeColor,
                                borderStyle: rel.dashArray ? "dashed" : "solid",
                              }}
                              className="mt-2 inline-block w-7 shrink-0 border-t-2"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-[#17233C]">
                                {rel.shortLabel}
                              </div>
                              <p className="text-[11px] leading-snug text-[#6F7E93]">
                                {rel.description}
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#DFE6F0] bg-white p-5 space-y-2.5 shadow-sm">
                  <h2 className="text-sm font-extrabold text-[#17233C] flex items-center gap-2">
                    <Keyboard className="h-4 w-4 text-[#FFA33A]" />
                    Quick Controls &amp; Shortcuts
                  </h2>
                  <ul className="space-y-1.5 text-xs text-[#6F7E93]">
                    <li className="flex items-center gap-2">
                      <MousePointerClick className="h-3.5 w-3.5 text-[#2F80ED] shrink-0" />
                      <span>
                        Click an empty canvas area or press{" "}
                        <strong className="text-[#17233C]">Esc</strong> to close
                        and unselect the active node modal.
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Search className="h-3.5 w-3.5 text-[#2F80ED] shrink-0" />
                      <span>
                        Press{" "}
                        <strong className="text-[#17233C]">Ctrl + K</strong> on
                        the dashboard to jump straight to searching your Vaults.
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5 text-[#2F80ED] shrink-0" />
                      <span>
                        Toggle <strong className="text-[#17233C]">Aura</strong>{" "}
                        in the tree topbar to switch between soft glows and
                        crisp territory borders.
                      </span>
                    </li>
                  </ul>
                </div>
              </section>
            </div>
          </div>
        )}
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
    </div>
  );
}
