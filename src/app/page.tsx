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
import ValidatorModal from "@/components/ValidatorModal";
import { PRESET_VAULTS } from "@/lib/presets";
import { KNOWLEDGE_REGIONS } from "@/lib/regions";
import {
  KnowledgeVault,
  RegionCode,
  VaultInputContext,
} from "@/types/knowledge";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Compass,
  Database,
  Folder,
  FolderPlus,
  GitBranch,
  HelpCircle,
  Home,
  Layers,
  Menu,
  Network,
  RotateCcw,
  Search,
  ShieldCheck,
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
  const [selectedNodeId, setSelectedNodeId] = useState<string>("n_respsel");
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters & search
  const [vaultSearch, setVaultSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modals & loading states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isValidatorOpen, setIsValidatorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isFullCanvas, setIsFullCanvas] = useState(false);
  const [showEmptyDemo, setShowEmptyDemo] = useState(false);

  // Expansion telemetry feedback
  const [newlyAddedIds, setNewlyAddedIds] = useState<string[]>([]);
  const [expandedRegions, setExpandedRegions] = useState<RegionCode[]>([]);
  const [expandToast, setExpandToast] = useState<string | null>(null);
  const [engineBadge, setEngineBadge] = useState<string>(
    "Curated OpenStax/Campbell Preset · DAG Validator"
  );

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
  const selectedNode =
    activeVault.nodes.find((n) => n.id === selectedNodeId) ||
    activeVault.nodes[0];

  const openVaultInTree = (vaultId: string) => {
    setActiveVaultId(vaultId);
    const target = vaults.find((v) => v.id === vaultId);
    if (target && target.nodes.length > 0) {
      const preferred =
        target.nodes.find((n) => n.id !== "root") || target.nodes[0];
      setSelectedNodeId(preferred.id);
    }
    setNewlyAddedIds([]);
    setExpandedRegions([]);
    setActiveTab("tree");
    setMobileMenuOpen(false);
  };

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    // Open Fog of War immediately when user clicks a shrouded frontier node
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
        setSelectedNodeId(createdVault.nodes[0]?.id || "root");
        setEngineBadge(
          data.engineUsed === "gemini-api"
            ? "Google Gemini 2.5 Flash · DAG Validator"
            : "Smart Deterministic Synthesis · DAG Validator"
        );
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
          } mapped · ${touchedRegs.join(" & ")} auto-expanded (NFR-09)`
        );
        setTimeout(() => setExpandToast(null), 5000);

        if (Array.isArray(data.addedNodeIds) && data.addedNodeIds[0]) {
          setSelectedNodeId(data.addedNodeIds[0]);
        }
        setEngineBadge(
          data.engineUsed === "gemini-api"
            ? "Google Gemini 2.5 Flash · DAG Validator"
            : "Smart Deterministic Synthesis · DAG Validator"
        );
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
    setShowEmptyDemo(false);
  };

  // Global aggregate open metrics (no completion % caps per NFR-11!)
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

  // Active vault metrics
  const activeRegions = Array.from(
    new Set(activeVault.nodes.map((n) => n.region))
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
                LOGICODIX 2026 · EduGraph
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
                  className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
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
              Saved in this browser
            </div>
            <p className="mt-0.5 text-[11px] text-[#8FA2BD]">
              Zero-friction · No sign-in required
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
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#17233C]">
                  Your Knowledge Space
                  <span className="inline-block ml-1.5 h-2.5 w-2.5 rounded-full bg-[#FFA33A] align-baseline" />
                </h1>
                <p className="mt-1.5 text-base text-[#6F7E93]">
                  Where curiosity becomes connected knowledge.
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
                      Start from a learning material (Mode A) or follow your
                      personal curiosity (Mode B) inside an unbounded Regional
                      Skill Tree.
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
                {/* 4 Open Activity Metrics (Zero Progress % Caps per NFR-11!) */}
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
                  Obsidian-style isolated workspaces — unlimited node growth per
                  Vault (BR-01 &amp; NFR-11).
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
                Explore Verified Preset Vaults
              </h1>
              <p className="text-xs text-[#6F7E93]">
                Curated open-reference DAG graphs (OpenStax Biology 2e, Campbell
                12e, Guyton, Weinberg) showcasing identical Mode A inputs with
                personalized branches plus Mode B curiosity paths.
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

        {/* TAB 4: KNOWLEDGE TREE WORKSPACE (Figma Screens 07, 08, 09, 10) */}
        {activeTab === "tree" && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Compact Context Strip above Canvas */}
            <div className="rounded-2xl border border-[#DFE6F0] bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  aria-label="Select Active Vault"
                  value={activeVault.id}
                  onChange={(e) => openVaultInTree(e.target.value)}
                  className="rounded-xl border border-[#DFE6F0] bg-[#F3F6FC] px-3 py-1.5 text-xs font-extrabold text-[#17233C] focus:border-[#2F80ED] focus:outline-none"
                >
                  {vaults.map((v) => (
                    <option key={v.id} value={v.id}>
                      Vault: {v.name}
                    </option>
                  ))}
                </select>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-bold text-[#2F80ED]">
                  {activeVault.inputContext.mode === "mode_a" ? (
                    <>
                      <BookOpen className="h-3.5 w-3.5" />
                      Mode A · {activeVault.inputContext.subject}
                    </>
                  ) : (
                    <>
                      <Compass className="h-3.5 w-3.5" />
                      Mode B · Curiosity Path
                    </>
                  )}
                </span>
                <span className="hidden xl:inline text-xs font-mono text-[#6F7E93]">
                  Engine: {engineBadge}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOverviewOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#EAF2FF] hover:bg-[#DCEAFE] px-3 py-1.5 text-xs font-bold text-[#2F80ED]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Foundation Overview
                </button>
                <button
                  type="button"
                  onClick={() => setIsValidatorOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFE6F0] bg-white hover:border-[#2F80ED] px-3 py-1.5 text-xs font-bold text-[#17233C]"
                >
                  <Code2 className="h-3.5 w-3.5 text-[#0D9468]" />
                  DAG Validator &amp; JSON
                </button>
              </div>
            </div>

            {/* Dynamic Expansion Success Toast (matching Figma Screen 10) */}
            {expandToast && (
              <div className="rounded-2xl border border-[#2F80ED] bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF3E0] text-[#FFA33A]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[#17233C]">
                      {expandToast}
                    </div>
                    <div className="text-[11px] text-[#6F7E93]">
                      Validated acyclic DAG · every node remains strictly
                      contained inside its expanded Region.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandToast(null)}
                  className="text-xs font-bold text-[#2F80ED] hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Main Grid: SkillTreeCanvas + NodeInspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div
                className={isFullCanvas ? "lg:col-span-12" : "lg:col-span-8"}
              >
                <SkillTreeCanvas
                  vault={activeVault}
                  selectedNodeId={selectedNode.id}
                  onSelectNode={handleSelectNode}
                  onUnlockAllFog={handleUnlockAllFog}
                  newlyAddedIds={newlyAddedIds}
                  expandedRegions={expandedRegions}
                  isFullCanvas={isFullCanvas}
                  onToggleFullCanvas={() => setIsFullCanvas((s) => !s)}
                />
              </div>
              <div
                className={isFullCanvas ? "lg:col-span-12" : "lg:col-span-4"}
              >
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

            {/* 6 Knowledge Regions Reference Strip */}
            <section className="rounded-2xl border border-[#DFE6F0] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#6F7E93]">
                  <ShieldCheck className="h-4 w-4 text-[#0D9468]" />
                  6 Knowledge Regions Compass (Path of Exile Quadrants ·{" "}
                  {activeRegions.length}/6 Active)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
                {Object.values(KNOWLEDGE_REGIONS).map((reg) => {
                  const count = activeVault.nodes.filter(
                    (n) => n.region === reg.code
                  ).length;
                  return (
                    <div
                      key={reg.code}
                      className={`rounded-xl border p-3 text-xs transition-all ${
                        count > 0
                          ? "border-[#DFE6F0] bg-[#F8FAFC]"
                          : "border-[#DFE6F0] bg-white opacity-55"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${reg.badgeClass}`}
                        >
                          {reg.code}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-[#6F7E93]">
                          {count} node{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="font-extrabold text-[#17233C]">
                        {reg.shortName}
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#6F7E93] line-clamp-2">
                        {reg.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* TAB 5: GETTING STARTED GUIDE */}
        {activeTab === "guide" && (
          <div className="mx-auto max-w-[1000px] px-4 sm:px-8 py-6 space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold text-[#17233C]">
                Getting Started with Trellis
              </h1>
              <p className="text-sm text-[#6F7E93] mt-1">
                Combining Obsidian-style Knowledge Vaults with a Path of
                Exile–inspired Regional Skill Tree.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  step: "1. Choose Mode A or Mode B",
                  desc: "Start a Vault from your school textbook chapter (Mode A) or jump directly from a curious question or career goal (Mode B).",
                  icon: <BookOpen className="h-5 w-5 text-[#2F80ED]" />,
                },
                {
                  step: "2. Explore Across 6 Regions",
                  desc: "Click any hazy Fog of War node to reveal it. Use the Soft Aura toggle to inspect cross-region bridges without filter bubbles.",
                  icon: <GitBranch className="h-5 w-5 text-[#0D9468]" />,
                },
                {
                  step: "3. Expand Without Limits",
                  desc: "Click Expand This Node anywhere to generate deeper validated branches. Regions grow outward smoothly without completion caps.",
                  icon: <Sparkles className="h-5 w-5 text-[#FFA33A]" />,
                },
              ].map((card) => (
                <div
                  key={card.step}
                  className="rounded-2xl border border-[#DFE6F0] bg-white p-5 space-y-2.5 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F6FC]">
                    {card.icon}
                  </div>
                  <h2 className="text-sm font-extrabold text-[#17233C]">
                    {card.step}
                  </h2>
                  <p className="text-xs leading-relaxed text-[#6F7E93]">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("tree")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-5 py-2.5 text-xs font-bold text-white"
            >
              Jump to Interactive Knowledge Tree →
            </button>
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
      <ValidatorModal
        isOpen={isValidatorOpen}
        onClose={() => setIsValidatorOpen(false)}
        vault={activeVault}
      />
    </div>
  );
}
