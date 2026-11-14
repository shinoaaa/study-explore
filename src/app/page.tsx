"use client";

import AddExplorationModal, {
  AddExplorationSubmitData,
} from "@/components/AddExplorationModal";
import CreateVaultModal from "@/components/CreateVaultModal";
import {
  CurioraLogo,
  EmptyExplorerVector,
  HeroLearnerVector,
} from "@/components/Illustrations";
import KnowledgeLibraryView, {
  LibraryFilterTab,
  LibrarySelection,
  LibraryStatusFilter,
} from "@/components/KnowledgeLibraryView";
import NodeInspector from "@/components/NodeInspector";
import OverviewModal from "@/components/OverviewModal";
import SkillTreeCanvas from "@/components/SkillTreeCanvas";
import VaultOverviewView from "@/components/VaultOverviewView";
import VaultSubNav, { VaultWorkspaceTab } from "@/components/VaultSubNav";
import {
  edgeDescription,
  edgeShortLabel,
  Language,
  regionDescription,
  regionName,
  regionShortName,
  ThemeMode,
  UI_COPY,
} from "@/lib/i18n";
import { PRESET_VAULTS } from "@/lib/presets";
import { EDGE_RELATIONS, KNOWLEDGE_REGIONS } from "@/lib/regions";
import {
  appendRevisionToNode,
  countVaultFavorites,
  countVaultNeedsReview,
  createEmptyVault,
  deriveVaultIdentity,
  normalizeVault,
} from "@/lib/vault-storage";
import {
  EdgeRelationType,
  ExplanationLevels,
  KnowledgeNode,
  KnowledgeVault,
  LearningSource,
  NodeRevision,
  RegionCode,
  SourceFormat,
  VaultIdentity,
} from "@/types/knowledge";
import {
  ArrowRight,
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
  Moon,
  MousePointerClick,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "curiora_clean_single_vault_v1";
const LEGACY_VAULT_KEYS = [
  "curiora_vaults_v1",
  "trellis_vaults_v1",
  "nexusvault_ai_vaults_v1",
];
const DEFAULT_USER_VAULTS: KnowledgeVault[] = [PRESET_VAULTS[0]];
const THEME_KEY = "curiora_theme_v1";
const LEGACY_THEME_KEY = "trellis_theme_v1";
const LANG_KEY = "curiora_lang_v1";
const LEGACY_LANG_KEY = "trellis_lang_v1";

type AppTab =
  | "home"
  | "vaults"
  | "presets"
  | "overview"
  | "tree"
  | "library"
  | "guide";

function mergePresetUpdates(cached: KnowledgeVault[]): KnowledgeVault[] {
  const presetMap = new Map(PRESET_VAULTS.map((p) => [p.id, p]));
  return cached.map((v) => {
    const fresh = presetMap.get(v.id);
    if (!fresh) {
      return normalizeVault(v);
    }
    const oldNodeMap = new Map((v.nodes || []).map((n) => [n.id, n]));
    const freshNodeIds = new Set(fresh.nodes.map((n) => n.id));
    const mergedNodes = fresh.nodes.map((fn) => {
      const old = oldNodeMap.get(fn.id);
      if (!old) return fn;
      return {
        ...fn,
        explored: old.explored,
        mastered: old.mastered,
        isFavorite:
          old.isFavorite !== undefined ? old.isFavorite : fn.isFavorite,
        origin: old.origin || fn.origin,
        userAnnotation: old.userAnnotation,
        reviewStatus: old.reviewStatus,
        reviewReason: old.reviewReason,
        summary: old.origin === "user_edited" ? old.summary : fn.summary,
        levels: old.origin === "user_edited" ? old.levels : fn.levels,
        formula: old.origin === "user_edited" ? old.formula : fn.formula,
        application:
          old.origin === "user_edited" ? old.application : fn.application,
        revisions:
          Array.isArray(old.revisions) && old.revisions.length > 0
            ? old.revisions
            : fn.revisions,
        sourceIds:
          Array.isArray(old.sourceIds) && old.sourceIds.length > 0
            ? old.sourceIds
            : fn.sourceIds,
      };
    });
    const extraNodes = (v.nodes || []).filter((n) => !freshNodeIds.has(n.id));
    const freshEdgeIds = new Set(fresh.edges.map((e) => e.id));
    const extraEdges = (v.edges || []).filter((e) => !freshEdgeIds.has(e.id));

    return normalizeVault({
      ...v,
      name: v.identity ? v.name : fresh.name,
      identity: v.identity || fresh.identity,
      learningSources:
        Array.isArray(v.learningSources) && v.learningSources.length > 0
          ? v.learningSources
          : fresh.learningSources,
      explorations:
        Array.isArray(v.explorations) && v.explorations.length > 0
          ? v.explorations
          : fresh.explorations,
      overview: fresh.overview,
      nodes: [...mergedNodes, ...extraNodes],
      edges: [...fresh.edges, ...extraEdges],
    });
  });
}

export default function HomePage() {
  const [vaults, setVaults] = useState<KnowledgeVault[]>(DEFAULT_USER_VAULTS);
  const [activeVaultId, setActiveVaultId] = useState<string>(
    DEFAULT_USER_VAULTS[0].id
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Appearance & language preferences
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [lang, setLang] = useState<Language>("id");

  // Filters & search
  const [vaultSearch, setVaultSearch] = useState("");
  const [vaultsFavoritesOnly, setVaultsFavoritesOnly] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Knowledge Library navigation state
  const [librarySelection, setLibrarySelection] =
    useState<LibrarySelection | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilterTab>("all");
  const [libraryStatusFilter, setLibraryStatusFilter] =
    useState<LibraryStatusFilter>("all");
  const [addSourceTrigger, setAddSourceTrigger] = useState(0);

  // Modals & loading states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddExplorationOpen, setIsAddExplorationOpen] = useState(false);
  const [targetNodeToOpen, setTargetNodeToOpen] =
    useState<KnowledgeNode | null>(null);
  const [defaultParentNodeId, setDefaultParentNodeId] = useState<
    string | undefined
  >(undefined);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isAddingExploration, setIsAddingExploration] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [showEmptyDemo, setShowEmptyDemo] = useState(false);

  // Feedback state
  const [newlyAddedIds, setNewlyAddedIds] = useState<string[]>([]);
  const [expandedRegions, setExpandedRegions] = useState<RegionCode[]>([]);
  const [expandToast, setExpandToast] = useState<string | null>(null);

  const t = UI_COPY[lang];
  const isDark = theme === "dark";

  // Hydrate persisted Vaults, Theme, Language
  useEffect(() => {
    try {
      const savedTheme =
        localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY);
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
        document.documentElement.classList.toggle("dark", savedTheme === "dark");
      }
      const savedLang =
        localStorage.getItem(LANG_KEY) || localStorage.getItem(LEGACY_LANG_KEY);
      if (savedLang === "en" || savedLang === "id") {
        setLang(savedLang);
        document.documentElement.lang = savedLang;
      }
      // Automatically purge old cluttered vault keys so testing starts clean
      for (const oldKey of LEGACY_VAULT_KEYS) {
        localStorage.removeItem(oldKey);
      }

      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = mergePresetUpdates(parsed);
          setVaults(merged);
          setActiveVaultId(merged[0].id);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleTheme = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // ignore
    }
  };

  const toggleLang = () => {
    const next: Language = lang === "en" ? "id" : "en";
    setLang(next);
    document.documentElement.lang = next;
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // ignore
    }
  };

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

  const openVaultOverview = (vaultId: string) => {
    setActiveVaultId(vaultId);
    setSelectedNodeId(null);
    setNewlyAddedIds([]);
    setExpandedRegions([]);
    setActiveTab("overview");
    setMobileMenuOpen(false);
  };

  const openVaultInTree = (vaultId: string, focusNodeId?: string) => {
    setActiveVaultId(vaultId);
    setSelectedNodeId(focusNodeId || null);
    setNewlyAddedIds([]);
    setExpandedRegions([]);
    setActiveTab("tree");
    setMobileMenuOpen(false);
  };

  const openVaultInLibrary = (
    vaultId: string,
    options?: {
      itemType?: "node" | "source";
      itemId?: string;
      startInEditMode?: boolean;
      filter?: LibraryFilterTab;
      statusFilter?: LibraryStatusFilter;
      openAddSource?: boolean;
    }
  ) => {
    setActiveVaultId(vaultId);
    setLibraryFilter(options?.filter || "all");
    setLibraryStatusFilter(options?.statusFilter || "all");
    if (!options?.openAddSource) {
      setAddSourceTrigger(0);
    }
    if (options?.itemType && options.itemId) {
      setLibrarySelection({
        itemType: options.itemType,
        itemId: options.itemId,
        startInEditMode: options.startInEditMode,
      });
    } else {
      setLibrarySelection(null);
    }
    setActiveTab("library");
    setMobileMenuOpen(false);
  };

  const handleSelectVaultTab = (tab: VaultWorkspaceTab) => {
    setAddSourceTrigger(0);
    if (tab === "overview") setActiveTab("overview");
    else if (tab === "tree") setActiveTab("tree");
    else setActiveTab("library");
  };

  const handleOpenAddExploration = (
    targetNode?: KnowledgeNode,
    parentNodeId?: string
  ) => {
    setTargetNodeToOpen(targetNode || null);
    setDefaultParentNodeId(parentNodeId);
    setIsAddExplorationOpen(true);
  };

  const updateActiveVault = (
    updater: (vault: KnowledgeVault) => KnowledgeVault
  ) => {
    const nextVaults = vaults.map((v) =>
      v.id === activeVault.id ? updater(v) : v
    );
    persistVaults(nextVaults);
  };

  const handleSelectNode = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  };

  const handleUnlockAllFog = () => {
    updateActiveVault((v) => ({
      ...v,
      updatedAt: new Date().toISOString(),
      nodes: v.nodes.map((n) => ({ ...n, explored: true })),
    }));
  };

  const handleMarkMastered = (nodeId: string) => {
    updateActiveVault((v) => ({
      ...v,
      updatedAt: new Date().toISOString(),
      nodes: v.nodes.map((n) =>
        n.id === nodeId ? { ...n, explored: true, mastered: true } : n
      ),
    }));
  };

  const handleToggleFavoriteNode = (nodeId: string) => {
    updateActiveVault((v) => ({
      ...v,
      updatedAt: new Date().toISOString(),
      nodes: v.nodes.map((n) =>
        n.id === nodeId ? { ...n, isFavorite: !n.isFavorite } : n
      ),
    }));
  };

  const handleToggleFavoriteSource = (sourceId: string) => {
    updateActiveVault((v) => ({
      ...v,
      updatedAt: new Date().toISOString(),
      learningSources: (v.learningSources || []).map((s) =>
        s.id === sourceId ? { ...s, isFavorite: !s.isFavorite } : s
      ),
    }));
  };

  const handleUpdateVaultIdentity = (
    vaultName: string,
    identity: VaultIdentity
  ) => {
    updateActiveVault((v) => ({
      ...v,
      name: vaultName,
      updatedAt: new Date().toISOString(),
      identity,
      overview: {
        ...v.overview,
        title: v.nodes.length === 0 ? vaultName : v.overview.title,
        summary:
          v.nodes.length === 0 && identity.shortDescription
            ? identity.shortDescription
            : v.overview.summary,
      },
      inputContext: {
        ...v.inputContext,
        interestDomain: identity.mainInterest,
        targetGoal: identity.focusQuestion || identity.learningGoal || vaultName,
        motivation: identity.learningGoal,
      },
    }));
  };

  const handleSaveNodeEdit = (
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
  ) => {
    updateActiveVault((v) => ({
      ...v,
      updatedAt: new Date().toISOString(),
      nodes: v.nodes.map((n) =>
        n.id === nodeId
          ? appendRevisionToNode(n, {
              ...payload,
              origin: "user_edited",
              reviewStatus: "reviewed",
              reviewReason: undefined,
            })
          : n
      ),
    }));
  };

  const handleMarkNodeReviewed = (nodeId: string) => {
    updateActiveVault((v) => ({
      ...v,
      updatedAt: new Date().toISOString(),
      nodes: v.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, reviewStatus: "reviewed", reviewReason: undefined }
          : n
      ),
    }));
  };

  const handleRestoreRevision = (nodeId: string, revision: NodeRevision) => {
    updateActiveVault((v) => ({
      ...v,
      updatedAt: new Date().toISOString(),
      nodes: v.nodes.map((n) =>
        n.id === nodeId
          ? appendRevisionToNode(n, {
              kind: "restored",
              label:
                lang === "en"
                  ? `Restored v${revision.version}`
                  : `Pulihkan v${revision.version}`,
              summary: revision.summary,
              levels: revision.levels,
              formula: revision.formula,
              application: revision.application,
              userAnnotation: revision.userAnnotation,
              origin: "user_edited",
              reviewStatus: "reviewed",
            })
          : n
      ),
    }));
  };

  const handleSaveSource = (srcInput: {
    id?: string;
    title: string;
    format: SourceFormat;
    chapterOrSection: string;
    excerptOrNotes: string;
    focusQuestion: string;
  }): LearningSource => {
    const now = new Date().toISOString();
    const existing = srcInput.id
      ? (activeVault.learningSources || []).find((s) => s.id === srcInput.id)
      : undefined;

    const saved: LearningSource = existing
      ? {
          ...existing,
          title: srcInput.title,
          format: srcInput.format,
          chapterOrSection: srcInput.chapterOrSection || undefined,
          excerptOrNotes: srcInput.excerptOrNotes,
          focusQuestion: srcInput.focusQuestion,
          updatedAt: now,
        }
      : {
          id: `src-${Date.now()}`,
          title: srcInput.title,
          format: srcInput.format,
          chapterOrSection: srcInput.chapterOrSection || undefined,
          excerptOrNotes: srcInput.excerptOrNotes,
          focusQuestion: srcInput.focusQuestion,
          origin: "user_source",
          isFavorite: false,
          createdAt: now,
          updatedAt: now,
          linkedNodeIds: [],
        };

    updateActiveVault((v) => {
      const current = v.learningSources || [];
      const nextSources = existing
        ? current.map((s) => (s.id === saved.id ? saved : s))
        : [saved, ...current];
      return {
        ...v,
        updatedAt: now,
        learningSources: nextSources,
      };
    });

    return saved;
  };

  // Step 1 of Vault lifecycle: create Vault with identity only -> open inside Vault Overview
  const handleCreateVault = (vaultName: string, identity: VaultIdentity) => {
    const createdVault = createEmptyVault({ vaultName, identity, lang });
    const nextVaults = [createdVault, ...vaults];
    persistVaults(nextVaults);
    setActiveVaultId(createdVault.id);
    setSelectedNodeId(null);
    setIsCreateOpen(false);
    setShowEmptyDemo(false);
    setActiveTab("overview");
  };

  // Step 2: Open / Add Node via Curiora 5-Stage AI Knowledge Orchestrator
  const handleSubmitExploration = async (
    data: AddExplorationSubmitData
  ): Promise<{ ok: boolean; dangerMessage?: string } | void> => {
    setIsAddingExploration(true);
    try {
      const intent = data.targetNodeId
        ? "OPEN_NODE"
        : activeVault.nodes.length === 0
          ? "SEED_FIRST_NODE"
          : "BRANCH_NEW_NODE";

      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          vault: activeVault,
          nodeAction: {
            targetNodeId: data.targetNodeId,
            parentNodeId: data.parentNodeId,
            nodeTitle: data.nodeTitle,
            openMode: data.openMode,
            inputTitle: data.inputTitle,
            inputContent: data.inputContent,
            preferredDepth: data.depth,
          },
          lang,
        }),
      });
      const json = await res.json();

      if (json?.ok === false && json.validationGate?.dangerMessage) {
        return {
          ok: false,
          dangerMessage: json.validationGate.dangerMessage,
        };
      }

      if (json?.ok && json.vault) {
        const updatedVault = normalizeVault(json.vault);
        const nextVaults = vaults.map((v) =>
          v.id === activeVault.id ? updatedVault : v
        );
        persistVaults(nextVaults);

        const openedId: string =
          json.trace?.openedNodeId ||
          data.targetNodeId ||
          updatedVault.nodes[0]?.id ||
          "";
        const frontierIds: string[] = Array.isArray(
          json.trace?.spawnedFrontierNodeIds
        )
          ? json.trace.spawnedFrontierNodeIds
          : [];
        const crossLinksCount = Array.isArray(json.trace?.crossLinksDiscovered)
          ? json.trace.crossLinksDiscovered.length
          : 0;

        const highlightIds = [openedId, ...frontierIds].filter(Boolean);
        const touchedNodes = updatedVault.nodes.filter((n) =>
          highlightIds.includes(n.id)
        );
        const touchedRegs = Array.from(
          new Set(touchedNodes.map((n) => n.region))
        );

        setNewlyAddedIds(highlightIds);
        setExpandedRegions(touchedRegs);
        setIsAddExplorationOpen(false);
        setTargetNodeToOpen(null);
        setActiveTab("tree");
        if (openedId) {
          setSelectedNodeId(openedId);
        }

        const msgParts = [
          lang === "en" ? "Node opened" : "Node dibuka",
          frontierIds.length > 0
            ? lang === "en"
              ? `${frontierIds.length} new fog branches`
              : `${frontierIds.length} cabang fog baru`
            : "",
          crossLinksCount > 0
            ? lang === "en"
              ? `${crossLinksCount} cross-node link discovered`
              : `${crossLinksCount} hubungan lintas-node ditemukan`
            : "",
        ].filter(Boolean);

        setExpandToast(msgParts.join(" · "));
        setTimeout(() => setExpandToast(null), 5000);
        return { ok: true };
      }
    } finally {
      setIsAddingExploration(false);
    }
  };

  // Expand Node from inside an already-opened node -> Spawns lightweight Fog stub nodes (`explored: false`, title only)
  const handleExpandNode = async (nodeId: string) => {
    setIsExpanding(true);
    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "EXPAND_FOG_BRANCHES",
          vault: activeVault,
          nodeAction: {
            targetNodeId: nodeId,
            openMode: "instant_ai",
          },
          lang,
        }),
      });
      const json = await res.json();
      if (json?.ok && json.vault) {
        const updatedVault = normalizeVault(json.vault);
        const nextVaults = vaults.map((v) =>
          v.id === activeVault.id ? updatedVault : v
        );
        persistVaults(nextVaults);

        const frontierIds: string[] = Array.isArray(
          json.trace?.spawnedFrontierNodeIds
        )
          ? json.trace.spawnedFrontierNodeIds
          : [];
        const touchedNodes = updatedVault.nodes.filter((n) =>
          frontierIds.includes(n.id)
        );
        const touchedRegs = Array.from(
          new Set(touchedNodes.map((n) => n.region))
        );

        setNewlyAddedIds(frontierIds);
        setExpandedRegions(touchedRegs);
        setExpandToast(
          lang === "en"
            ? `Expanded ${frontierIds.length} new Fog of War nodes (click any gray node to open)`
            : `${frontierIds.length} node cabang baru (Fog) ditambahkan — klik node abu-abu untuk membuka`
        );
        setTimeout(() => setExpandToast(null), 5000);
      }
    } finally {
      setIsExpanding(false);
    }
  };

  const handleDeleteVault = (vaultId: string) => {
    const remaining = vaults.filter((v) => v.id !== vaultId);
    const safeList = remaining.length > 0 ? remaining : DEFAULT_USER_VAULTS;
    persistVaults(safeList);
    if (activeVaultId === vaultId) {
      setActiveVaultId(safeList[0].id);
      setSelectedNodeId(null);
    }
  };

  const handleResetPresets = () => {
    persistVaults(DEFAULT_USER_VAULTS);
    setActiveVaultId(DEFAULT_USER_VAULTS[0].id);
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
    if (vaultsFavoritesOnly && countVaultFavorites(v) === 0) {
      return false;
    }
    const q = vaultSearch.trim().toLowerCase();
    if (!q) return true;
    const identity = deriveVaultIdentity(v);
    return (
      v.name.toLowerCase().includes(q) ||
      identity.mainInterest.toLowerCase().includes(q) ||
      identity.focusQuestion.toLowerCase().includes(q) ||
      identity.relatedInterests.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  const navItems: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: t.nav.home, icon: <Home className="h-4 w-4" /> },
    {
      id: "vaults",
      label: t.nav.vaults,
      icon: <Folder className="h-4 w-4" />,
    },
    {
      id: "presets",
      label: t.nav.presets,
      icon: <Compass className="h-4 w-4" />,
    },
    {
      id: "tree",
      label: t.nav.tree,
      icon: <Network className="h-4 w-4" />,
    },
    {
      id: "guide",
      label: t.nav.guide,
      icon: <HelpCircle className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F3F6FC] dark:bg-[#0B1120] text-[#17233C] dark:text-[#F1F5F9] transition-colors">
      {/* Mobile Header */}
      <header className="flex lg:hidden items-center justify-between bg-[#17263C] dark:bg-[#0B1120] dark:border-b dark:border-slate-800 px-4 py-3 text-white sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <CurioraLogo size={32} />
          <span className="text-lg font-extrabold tracking-tight">Curiora</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? t.nav.light : t.nav.dark}
            className="rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 p-1.5 text-white"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={toggleLang}
            aria-label="Switch language"
            className="rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 px-2 py-1 text-[11px] font-extrabold text-white"
          >
            {lang === "en" ? "EN" : "ID"}
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg bg-[#2F80ED] px-2.5 py-1.5 text-xs font-bold text-white"
          >
            {t.nav.newVaultShort}
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

      {/* Desktop Reopen Sidebar Button when Sidebar is Collapsed */}
      {sidebarCollapsed && (
        <button
          type="button"
          onClick={() => setSidebarCollapsed(false)}
          aria-label="Open sidebar"
          className="hidden lg:inline-flex fixed left-3 top-3 z-40 h-9 w-9 items-center justify-center rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#17263C] text-white shadow-md hover:bg-[#2F80ED] transition-all"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {/* Left Navy Navigation Sidebar (Collapsible on Desktop) */}
      <aside
        className={`${
          mobileMenuOpen ? "flex" : "hidden"
        } ${
          sidebarCollapsed ? "lg:hidden" : "lg:flex lg:w-64 lg:shrink-0"
        } flex-col justify-between bg-[#17263C] dark:bg-[#0F172A] dark:border-r dark:border-slate-800 text-white p-4 lg:sticky lg:top-0 lg:h-screen z-30 transition-all`}
      >
        <div className="space-y-6">
          {/* Brand Logo + Collapse Sidebar Button */}
          <div className="hidden lg:flex items-center justify-between gap-2 px-2 pt-1">
            <div className="flex items-center gap-3 min-w-0">
              <CurioraLogo size={36} />
              <div className="min-w-0">
                <div className="text-xl font-extrabold tracking-tight text-white leading-tight">
                  Curiora
                </div>
                <div className="text-[10.5px] font-medium text-[#8FA2BD] truncate">
                  {t.nav.cosmosTag}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSidebarCollapsed(true)}
              aria-label="Close sidebar"
              className="rounded-lg p-1.5 text-[#8FA2BD] hover:bg-white/10 hover:text-white transition-colors shrink-0"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
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

          {/* Recent Vaults Switcher (Clean, Zero Star Clutter) */}
          <div>
            <div className="px-2 mb-2 text-[10.5px] font-bold uppercase tracking-wider text-[#647B99]">
              {t.nav.recentVaults}
            </div>
            <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
              {vaults.slice(0, 6).map((v) => {
                const isCur =
                  v.id === activeVault.id &&
                  (activeTab === "overview" ||
                    activeTab === "tree" ||
                    activeTab === "library");
                return (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => openVaultOverview(v.id)}
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

        {/* Bottom Appearance/Language Switch + Storage Pill + Primary CTA */}
        <div className="space-y-2.5 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2 text-xs font-bold text-[#DCE6F5] transition-colors"
            >
              {isDark ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-300" />
                  <span>{t.nav.light}</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-blue-300" />
                  <span>{t.nav.dark}</span>
                </>
              )}
            </button>
            <div className="flex rounded-xl bg-white/10 p-0.5 text-[11px] font-extrabold">
              <button
                type="button"
                onClick={() => lang !== "en" && toggleLang()}
                className={`flex-1 rounded-lg py-1.5 transition-colors ${
                  lang === "en"
                    ? "bg-[#2F80ED] text-white"
                    : "text-[#B4C2D6] hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => lang !== "id" && toggleLang()}
                className={`flex-1 rounded-lg py-1.5 transition-colors ${
                  lang === "id"
                    ? "bg-[#2F80ED] text-white"
                    : "text-[#B4C2D6] hover:text-white"
                }`}
              >
                ID
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-[#1E314D] dark:bg-slate-800/80 px-3 py-2.5 text-xs flex items-center gap-2 font-semibold text-[#DCE6F5]">
            <Database className="h-4 w-4 text-[#60A5FA] shrink-0" />
            <span>{t.nav.localDevice}</span>
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
            {t.nav.createNewVault}
          </button>
        </div>
      </aside>

      {/* Main Content Stage */}
      <main className="flex-1 min-w-0">
        {/* Top Utility Search & Actions Strip */}
        {!["overview", "tree", "library"].includes(activeTab) && (
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
                placeholder={t.topbar.searchPlaceholder}
                className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-[#111827] pl-10 pr-14 py-2.5 text-sm text-[#17233C] dark:text-slate-100 placeholder:text-[#94A3B8] shadow-sm focus:border-[#2F80ED] focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-[#DFE6F0] dark:border-slate-700 bg-[#F3F6FC] dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-[#6F7E93] dark:text-slate-300">
                Ctrl K
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === "home" && (
                <button
                  type="button"
                  onClick={() => setShowEmptyDemo((d) => !d)}
                  className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-[#111827] hover:border-[#2F80ED] px-3 py-2 text-xs font-semibold text-[#6F7E93] dark:text-slate-300 hover:text-[#17233C] dark:hover:text-white transition-colors"
                >
                  {showEmptyDemo
                    ? t.topbar.showPopulated
                    : t.topbar.previewEmpty}
                </button>
              )}
              <button
                type="button"
                onClick={handleResetPresets}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-[#111827] hover:bg-[#F8FAFC] dark:hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#6F7E93] dark:text-slate-300 hover:text-[#17233C] dark:hover:text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t.topbar.resetPresets}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tree")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#EAF2FF] dark:bg-blue-950/60 hover:bg-[#DCEAFE] dark:hover:bg-blue-900/60 px-3.5 py-2 text-xs font-bold text-[#2F80ED] dark:text-blue-300 transition-colors"
              >
                <Network className="h-3.5 w-3.5" />
                {t.topbar.openTree}
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: HOME DASHBOARD */}
        {activeTab === "home" && (
          <div className="mx-auto max-w-[1260px] px-4 sm:px-8 py-4 space-y-6">
            {/* Hero Welcome & Transparent Pure-SVG Illustration */}
            <section className="relative pt-2">
              <div className="mb-4 max-w-xl md:max-w-[calc(100%-365px)] lg:max-w-[calc(100%-410px)] xl:max-w-xl relative z-10">
                <h1 className="text-[26px] sm:text-4xl font-extrabold tracking-tight text-[#17233C] dark:text-slate-100">
                  {t.home.heroLine1}{" "}
                  <span className="whitespace-nowrap">
                    {t.home.heroAccent}
                    <span className="inline-block ml-1.5 h-2.5 w-2.5 rounded-full bg-[#FFA33A] align-baseline" />
                  </span>
                </h1>
                <p className="mt-1.5 text-base text-[#6F7E93] dark:text-slate-400">
                  {t.home.heroSubtitle}
                </p>
              </div>

              <div className="relative overflow-visible">
                <div className="rounded-3xl bg-gradient-to-r from-[#2F80ED] via-[#3F8EFC] to-[#CFE2FF] dark:from-[#1D4ED8] dark:via-[#2563EB] dark:to-[#1E3A8A] p-6 sm:p-8 text-white shadow-lg shadow-[#2F80ED]/20 dark:shadow-blue-950/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="max-w-lg z-10">
                    <h2 className="text-xl sm:text-2xl font-extrabold">
                      {t.home.bannerTitle}
                    </h2>
                    <p className="mt-1.5 text-sm text-[#E3EEFF]">
                      {t.home.bannerSubtitle}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="rounded-xl bg-white hover:bg-[#F8FAFC] px-5 py-2.5 text-sm font-bold text-[#2F80ED] shadow-sm transition-all"
                      >
                        {t.nav.createNewVault}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("tree")}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
                        aria-label={t.topbar.openTree}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="hidden md:block w-[360px] h-[120px] shrink-0" />
                </div>

                {/* Overlapping transparent vector on desktop */}
                <div className="hidden md:block pointer-events-none absolute -top-20 lg:-top-24 right-0 lg:right-4 w-[350px] lg:w-[400px] h-[236px] lg:h-[270px]">
                  <HeroLearnerVector className="w-full h-full drop-shadow-sm" />
                </div>
              </div>
            </section>

            {showEmptyDemo ? (
              /* Empty State Layout */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-7 rounded-3xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                  <div className="w-56 h-48 shrink-0">
                    <EmptyExplorerVector />
                  </div>
                  <div className="space-y-3 text-center sm:text-left">
                    <h3 className="text-xl font-extrabold text-[#17233C] dark:text-slate-100">
                      {t.home.emptyTitle}
                    </h3>
                    <p className="text-xs leading-relaxed text-[#6F7E93] dark:text-slate-400">
                      {t.home.emptySubtitle}
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-4 py-2.5 text-xs font-bold text-white"
                      >
                        <FolderPlus className="h-4 w-4" />
                        {t.home.createFirst}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("presets")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#EAF2FF] dark:bg-blue-950/60 hover:bg-[#DCEAFE] dark:hover:bg-blue-900/60 px-4 py-2.5 text-xs font-bold text-[#2F80ED] dark:text-blue-300"
                      >
                        <Compass className="h-4 w-4" />
                        {t.home.browsePresets}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-[#17233C] dark:text-slate-100">
                      {t.home.explorePresets}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("presets")}
                      className="text-xs font-bold text-[#2F80ED] dark:text-blue-400 hover:underline"
                    >
                      {t.home.viewAll} →
                    </button>
                  </div>
                  {PRESET_VAULTS.map((pv) => {
                    const reg = KNOWLEDGE_REGIONS[pv.overview.startingRegion];
                    return (
                      <div
                        key={pv.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-3.5 shadow-sm"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-[#17233C] dark:text-slate-100 truncate">
                            {pv.name}
                          </div>
                          <div className="text-xs text-[#6F7E93] dark:text-slate-400 mt-0.5">
                            {pv.nodes.length} {t.home.mapped}
                          </div>
                          <span
                            className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${reg.badgeClass}`}
                          >
                            {regionShortName(pv.overview.startingRegion, lang)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openVaultInTree(pv.id)}
                          className="shrink-0 rounded-xl bg-[#EAF2FF] dark:bg-blue-950/60 hover:bg-[#DCEAFE] dark:hover:bg-blue-900/60 px-3 py-2 text-xs font-bold text-[#2F80ED] dark:text-blue-300"
                        >
                          {t.home.openBtn} →
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
                  <div className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF4E5] dark:bg-amber-950/60 text-[#FFA33A]">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-[#17233C] dark:text-slate-100">
                        {vaults.length}
                      </div>
                      <div className="text-xs font-medium text-[#6F7E93] dark:text-slate-400">
                        {t.home.statVaults}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2FF] dark:bg-blue-950/60 text-[#2F80ED] dark:text-blue-400">
                      <Network className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-[#17233C] dark:text-slate-100">
                        {totalMappedAllVaults}
                      </div>
                      <div className="text-xs font-medium text-[#6F7E93] dark:text-slate-400">
                        {t.home.statMapped}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEF9C3] dark:bg-yellow-950/60 text-[#CA8A04] dark:text-yellow-400">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-[#17233C] dark:text-slate-100">
                        {totalMasteredAllVaults}
                      </div>
                      <div className="text-xs font-medium text-[#6F7E93] dark:text-slate-400">
                        {t.home.statMastered}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#0D9468] dark:text-emerald-400">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-[#17233C] dark:text-slate-100">
                        {globalRegionsExplored.length}
                      </div>
                      <div className="text-xs font-medium text-[#6F7E93] dark:text-slate-400">
                        {t.home.statRegions}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Continue Exploring Vaults */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-[#17233C] dark:text-slate-100">
                      {t.home.continueExploring}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("vaults")}
                      className="text-xs font-bold text-[#2F80ED] dark:text-blue-400 hover:underline"
                    >
                      {t.home.viewAll} →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vaults.slice(0, 2).map((v) => {
                      const identity = deriveVaultIdentity(v);
                      const reg =
                        KNOWLEDGE_REGIONS[v.overview.startingRegion] ||
                        KNOWLEDGE_REGIONS["REG-01"];
                      const vSources = (v.learningSources || []).length;
                      const vFavs = countVaultFavorites(v);
                      const vMastered = v.nodes.filter((n) => n.mastered).length;
                      return (
                        <div
                          key={v.id}
                          className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 flex items-center justify-between gap-4 shadow-sm hover:border-[#2F80ED]/60 transition-all"
                        >
                          <div className="min-w-0 space-y-2">
                            <div>
                              <h3 className="text-base font-extrabold text-[#17233C] dark:text-slate-100 truncate">
                                {v.name}
                              </h3>
                              <p className="text-xs text-[#6F7E93] dark:text-slate-400 truncate">
                                {identity.mainInterest} · {vSources}{" "}
                                {t.home.sources} · {v.nodes.length}{" "}
                                {t.home.mapped}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${reg.badgeClass}`}
                              >
                                {regionShortName(reg.code, lang)}
                              </span>
                              {vFavs > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFBEB] dark:bg-amber-950/60 border border-[#FDE68A] dark:border-amber-800 px-2.5 py-0.5 text-[11px] font-bold text-[#B45309] dark:text-amber-300">
                                  <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                                  {vFavs}
                                </span>
                              )}
                              <span className="text-[11px] font-semibold text-[#0D9468] dark:text-emerald-400">
                                · {vMastered} {t.home.mastered}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openVaultOverview(v.id)}
                            className="shrink-0 rounded-xl bg-[#EAF2FF] dark:bg-blue-950/60 hover:bg-[#2F80ED] text-[#2F80ED] dark:text-blue-300 hover:text-white px-4 py-2.5 text-xs font-bold transition-all"
                          >
                            {t.home.continueBtn} →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Quick Start Presets Strip */}
                <section className="space-y-3 pb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-[#17233C] dark:text-slate-100">
                      {t.home.quickStart}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("presets")}
                      className="text-xs font-bold text-[#2F80ED] dark:text-blue-400 hover:underline"
                    >
                      {t.home.explorePresets} →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PRESET_VAULTS.map((pv) => {
                      const reg = KNOWLEDGE_REGIONS[pv.overview.startingRegion];
                      return (
                        <button
                          type="button"
                          key={pv.id}
                          onClick={() => openVaultOverview(pv.id)}
                          className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-[#2F80ED] p-4 text-left flex items-center justify-between gap-3 shadow-sm transition-all"
                        >
                          <div className="min-w-0">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${reg.badgeClass}`}
                            >
                              {regionShortName(reg.code, lang)}
                            </span>
                            <div className="mt-2 text-sm font-extrabold text-[#17233C] dark:text-slate-100 truncate">
                              {pv.name}
                            </div>
                            <div className="text-xs text-[#6F7E93] dark:text-slate-400 truncate mt-0.5">
                              {pv.overview.coreFormulaOrPrinciple}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-[#2F80ED] dark:text-blue-400 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {/* TAB 2: MY VAULTS LIBRARY */}
        {activeTab === "vaults" && (
          <div className="mx-auto max-w-[1260px] px-4 sm:px-8 py-4 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-extrabold text-[#17233C] dark:text-slate-100">
                  {t.vaults.title}
                </h1>
                <div className="inline-flex rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-[#111827] p-1">
                  <button
                    type="button"
                    onClick={() => setVaultsFavoritesOnly(false)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                      !vaultsFavoritesOnly
                        ? "bg-[#2F80ED] text-white"
                        : "text-[#6F7E93] dark:text-slate-300 hover:text-[#17233C] dark:hover:text-white"
                    }`}
                  >
                    {t.vaults.allFilter}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVaultsFavoritesOnly(true)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                      vaultsFavoritesOnly
                        ? "bg-[#FFFBEB] dark:bg-amber-950/70 text-[#B45309] dark:text-amber-300"
                        : "text-[#6F7E93] dark:text-slate-300 hover:text-[#17233C] dark:hover:text-white"
                    }`}
                  >
                    {t.vaults.favoritesFilter}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-4 py-2.5 text-xs font-bold text-white shadow-sm"
              >
                <FolderPlus className="h-4 w-4" />
                {t.nav.createNewVault}
              </button>
            </div>

            {filteredVaults.length === 0 ? (
              <div className="rounded-3xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-10 text-center space-y-3">
                <Star className="h-7 w-7 mx-auto text-[#F59E0B]" />
                <p className="text-sm font-bold text-[#17233C] dark:text-slate-100">
                  {t.vaults.emptyFavorites}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVaults.map((v) => {
                  const identity = deriveVaultIdentity(v);
                  const reg =
                    KNOWLEDGE_REGIONS[v.overview.startingRegion] ||
                    KNOWLEDGE_REGIONS["REG-01"];
                  const vSources = (v.learningSources || []).length;
                  const vFavs = countVaultFavorites(v);
                  const vReview = countVaultNeedsReview(v);
                  const vMastered = v.nodes.filter((n) => n.mastered).length;

                  return (
                    <div
                      key={v.id}
                      className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-[#2F80ED]/60 transition-all"
                    >
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${reg.badgeClass}`}
                          >
                            {regionShortName(reg.code, lang)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {vFavs > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFBEB] dark:bg-amber-950/60 border border-[#FDE68A] dark:border-amber-800 px-2 py-0.5 text-[11px] font-bold text-[#B45309] dark:text-amber-300">
                                <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                                {vFavs}
                              </span>
                            )}
                            {vReview > 0 && (
                              <span className="rounded-full bg-[#FFF7ED] dark:bg-orange-950/60 border border-[#FED7AA] dark:border-orange-800 px-2 py-0.5 text-[10.5px] font-bold text-[#C2410C] dark:text-orange-300">
                                {vReview} {t.vaults.needsReviewCount}
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="text-base font-extrabold text-[#17233C] dark:text-slate-100">
                          {v.name}
                        </h3>
                        <p className="text-xs font-semibold text-[#2F80ED] dark:text-blue-400 truncate">
                          {identity.mainInterest}
                        </p>
                        <p className="text-xs text-[#6F7E93] dark:text-slate-400 line-clamp-2">
                          {identity.shortDescription || v.overview.summary}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-[#DFE6F0] dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#6F7E93] dark:text-slate-400">
                          <span>
                            {vSources} {t.home.sources}
                          </span>
                          <span>
                            {v.nodes.length} {t.home.mapped}
                          </span>
                          <span className="text-[#0D9468] dark:text-emerald-400">
                            {vMastered} {t.home.mastered}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openVaultOverview(v.id)}
                            className="flex-1 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] py-2 px-3 text-xs font-bold text-white transition-all"
                          >
                            {t.vaults.openVault} →
                          </button>
                          <button
                            type="button"
                            onClick={() => openVaultInTree(v.id)}
                            className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 hover:border-[#2F80ED] py-2 px-3 text-xs font-bold text-[#17233C] dark:text-slate-100 transition-colors"
                          >
                            {t.vaults.openTree}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVault(v.id)}
                            title={t.vaults.deleteTitle}
                            className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 p-2 text-[#6F7E93] dark:text-slate-400 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXPLORE PRESETS */}
        {activeTab === "presets" && (
          <div className="mx-auto max-w-[1260px] px-4 sm:px-8 py-4 space-y-5">
            <h1 className="text-2xl font-extrabold text-[#17233C] dark:text-slate-100">
              {t.presets.title}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {PRESET_VAULTS.map((pv) => {
                const reg = KNOWLEDGE_REGIONS[pv.overview.startingRegion];
                return (
                  <div
                    key={pv.id}
                    className="rounded-3xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex flex-col justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${reg.badgeClass}`}
                        >
                          {regionShortName(reg.code, lang)}
                        </span>
                        <span className="rounded-full bg-[#EAF2FF] dark:bg-blue-950/60 px-2.5 py-0.5 text-[11px] font-bold text-[#2F80ED] dark:text-blue-300">
                          {pv.nodes.length} {t.home.concepts}
                        </span>
                      </div>

                      <h2 className="text-lg font-extrabold text-[#17233C] dark:text-slate-100">
                        {pv.name}
                      </h2>
                      <p className="text-xs leading-relaxed text-[#6F7E93] dark:text-slate-400">
                        {pv.overview.summary}
                      </p>

                      <div className="rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/60 p-3">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6F7E93] dark:text-slate-400">
                          {t.presets.keyPath}
                        </div>
                        <div className="mt-1 font-mono text-[11px] font-semibold text-[#17233C] dark:text-slate-200">
                          {pv.overview.coreFormulaOrPrinciple}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#DFE6F0] dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => openVaultOverview(pv.id)}
                        className="flex-1 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] py-2.5 px-4 text-xs font-bold text-white"
                      >
                        {t.presets.openVault} →
                      </button>
                      <button
                        type="button"
                        onClick={() => openVaultInTree(pv.id)}
                        className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F3F6FC] dark:hover:bg-slate-700 py-2.5 px-3 text-xs font-bold text-[#17233C] dark:text-slate-100"
                      >
                        {t.presets.openTree}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveVaultId(pv.id);
                          setIsOverviewOpen(true);
                        }}
                        className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F3F6FC] dark:hover:bg-slate-700 py-2.5 px-3 text-xs font-bold text-[#17233C] dark:text-slate-100"
                      >
                        {t.presets.overview}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4A: VAULT OVERVIEW WORKSPACE */}
        {activeTab === "overview" && (
          <div className="min-h-screen flex flex-col">
            <VaultSubNav
              vault={activeVault}
              vaults={vaults}
              activeVaultTab="overview"
              onSelectVaultTab={handleSelectVaultTab}
              onSwitchVault={(vid) => openVaultOverview(vid)}
              onOpenAddExploration={() => handleOpenAddExploration()}
              onJumpToNeedsReview={() =>
                openVaultInLibrary(activeVault.id, {
                  filter: "notes",
                  statusFilter: "needs_review",
                })
              }
              lang={lang}
            />
            <VaultOverviewView
              vault={activeVault}
              onUpdateIdentity={handleUpdateVaultIdentity}
              onOpenAddExploration={(targetNode) =>
                handleOpenAddExploration(targetNode)
              }
              onOpenTree={(nid) => openVaultInTree(activeVault.id, nid)}
              onOpenLibrary={(opts) =>
                openVaultInLibrary(activeVault.id, opts)
              }
              onToggleFavoriteNode={handleToggleFavoriteNode}
              lang={lang}
            />
          </div>
        )}

        {/* TAB 4B: VAULT KNOWLEDGE LIBRARY */}
        {activeTab === "library" && (
          <div className="min-h-screen flex flex-col">
            <VaultSubNav
              vault={activeVault}
              vaults={vaults}
              activeVaultTab="library"
              onSelectVaultTab={handleSelectVaultTab}
              onSwitchVault={(vid) => openVaultInLibrary(vid)}
              onOpenAddExploration={() => handleOpenAddExploration()}
              onJumpToNeedsReview={() =>
                openVaultInLibrary(activeVault.id, {
                  filter: "notes",
                  statusFilter: "needs_review",
                })
              }
              lang={lang}
            />
            <KnowledgeLibraryView
              vault={activeVault}
              initialSelection={librarySelection}
              initialFilter={libraryFilter}
              initialStatusFilter={libraryStatusFilter}
              onToggleFavoriteNode={handleToggleFavoriteNode}
              onToggleFavoriteSource={handleToggleFavoriteSource}
              onSaveNodeEdit={handleSaveNodeEdit}
              onMarkNodeReviewed={handleMarkNodeReviewed}
              onRestoreRevision={handleRestoreRevision}
              onSaveSource={handleSaveSource}
              onViewInTree={(nid) => openVaultInTree(activeVault.id, nid)}
              onOpenAddExploration={(targetNode) =>
                handleOpenAddExploration(targetNode)
              }
              onExpandNode={handleExpandNode}
              isExpandingNode={isExpanding}
              openAddSourceTrigger={addSourceTrigger}
              lang={lang}
            />
          </div>
        )}

        {/* TAB 4C: KNOWLEDGE TREE WORKSPACE */}
        {activeTab === "tree" && (
          <div className="relative flex flex-col w-full h-[calc(100vh-56px)] lg:h-screen">
            <VaultSubNav
              vault={activeVault}
              vaults={vaults}
              activeVaultTab="tree"
              onSelectVaultTab={handleSelectVaultTab}
              onSwitchVault={(vid) => openVaultInTree(vid)}
              onOpenAddExploration={() => handleOpenAddExploration()}
              onJumpToNeedsReview={() =>
                openVaultInLibrary(activeVault.id, {
                  filter: "notes",
                  statusFilter: "needs_review",
                })
              }
              lang={lang}
              compact
            />
            <div className="relative flex-1 min-h-0">
              <SkillTreeCanvas
                vault={activeVault}
                vaults={vaults}
                onSwitchVault={(vid) => openVaultInTree(vid)}
                onOpenOverview={() => setIsOverviewOpen(true)}
                selectedNodeId={selectedNodeId}
                onSelectNode={handleSelectNode}
                onUnlockAllFog={handleUnlockAllFog}
                onToggleFavoriteNode={handleToggleFavoriteNode}
                onOpenInLibrary={(nid) =>
                  openVaultInLibrary(activeVault.id, {
                    itemType: "node",
                    itemId: nid,
                    filter: "all",
                  })
                }
                onOpenAddExploration={(targetNode) =>
                  handleOpenAddExploration(targetNode)
                }
                hideVaultSwitcher
                newlyAddedIds={newlyAddedIds}
                expandedRegions={expandedRegions}
                lang={lang}
                theme={theme}
                onToggleTheme={toggleTheme}
                onToggleLang={toggleLang}
              >
                {/* Floating Node Study Modal (Only shown when selected node is already opened) */}
                <NodeInspector
                  vault={activeVault}
                  node={selectedNode?.explored ? selectedNode : null}
                  onSelectNode={handleSelectNode}
                  onClose={() => setSelectedNodeId(null)}
                  onMarkMastered={handleMarkMastered}
                  onToggleFavorite={handleToggleFavoriteNode}
                  onOpenInLibrary={(nid, editMode) =>
                    openVaultInLibrary(activeVault.id, {
                      itemType: "node",
                      itemId: nid,
                      startInEditMode: editMode,
                      filter: "all",
                    })
                  }
                  onExpandNode={handleExpandNode}
                  isExpanding={isExpanding}
                  lang={lang}
                  theme={theme}
                />
              </SkillTreeCanvas>
            </div>

            {/* Floating Expansion Toast */}
            {expandToast && (
              <div className="pointer-events-none fixed bottom-5 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-lg flex justify-center">
                <div className="pointer-events-auto rounded-2xl border border-[#2F80ED] bg-white/95 dark:bg-[#111827]/95 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF3E0] dark:bg-amber-950/70 text-[#FFA33A]">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-xs font-extrabold text-[#17233C] dark:text-slate-100">
                      {expandToast}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandToast(null)}
                    className="text-xs font-bold text-[#2F80ED] dark:text-blue-400 hover:underline shrink-0"
                  >
                    {t.tree.dismiss}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: GETTING STARTED APP GUIDE */}
        {activeTab === "guide" && (
          <div className="mx-auto max-w-[1160px] px-4 sm:px-8 py-6 space-y-6">
            {/* Hero Intro */}
            <div className="rounded-3xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1.5 max-w-2xl">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17233C] dark:text-slate-100">
                  {t.guide.title}
                </h1>
                <p className="text-sm text-[#6F7E93] dark:text-slate-400">
                  {t.guide.subtitle}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-4 py-2.5 text-xs font-bold text-white shadow-sm"
                >
                  <FolderPlus className="h-4 w-4" />
                  {t.nav.createNewVault}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("tree")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 hover:border-[#2F80ED] px-4 py-2.5 text-xs font-bold text-[#17233C] dark:text-slate-100"
                >
                  <Network className="h-4 w-4 text-[#2F80ED] dark:text-blue-400" />
                  {t.guide.openTree}
                </button>
              </div>
            </div>

            {/* 4-Step Practical Tutorial */}
            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-[#17233C] dark:text-slate-100">
                {t.guide.stepsTitle}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {t.guide.steps.map((card, i) => {
                  const icons = [
                    {
                      icon: <FolderPlus className="h-5 w-5 text-[#2F80ED] dark:text-blue-400" />,
                      bg: "bg-[#EAF2FF] dark:bg-blue-950/60",
                    },
                    {
                      icon: <CloudFog className="h-5 w-5 text-[#0D9468] dark:text-emerald-400" />,
                      bg: "bg-[#ECFDF5] dark:bg-emerald-950/60",
                    },
                    {
                      icon: <Maximize2 className="h-5 w-5 text-[#7C3AED] dark:text-violet-400" />,
                      bg: "bg-[#F5F3FF] dark:bg-violet-950/60",
                    },
                    {
                      icon: <Sparkles className="h-5 w-5 text-[#FFA33A]" />,
                      bg: "bg-[#FFF4E5] dark:bg-amber-950/60",
                    },
                  ][i];
                  return (
                    <div
                      key={card.step}
                      className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${icons.bg}`}
                        >
                          {icons.icon}
                        </div>
                        <span className="rounded-full bg-[#F3F6FC] dark:bg-slate-800 px-2.5 py-0.5 text-[10.5px] font-bold text-[#6F7E93] dark:text-slate-300">
                          {card.step}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-[#17233C] dark:text-slate-100">
                        {card.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-[#6F7E93] dark:text-slate-400">
                        {card.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Knowledge Regions & Connection Lines */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* 6 Knowledge Regions (Zero REG-0x codes!) */}
              <section className="lg:col-span-7 rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3 shadow-sm">
                <h2 className="text-sm font-extrabold text-[#17233C] dark:text-slate-100 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#2F80ED] dark:text-blue-400" />
                  {t.guide.regionsTitle}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(KNOWLEDGE_REGIONS).map((reg) => (
                    <div
                      key={reg.code}
                      className="rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/60 p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            backgroundColor: isDark
                              ? reg.darkPillTextHex
                              : reg.accentHex,
                          }}
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                        />
                        <span className="font-bold text-[#17233C] dark:text-slate-100 truncate">
                          {regionName(reg.code, lang)}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#6F7E93] dark:text-slate-400">
                        {regionDescription(reg.code, lang)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Connection Lines + Shortcuts */}
              <section className="lg:col-span-5 space-y-4">
                <div className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3 shadow-sm">
                  <h2 className="text-sm font-extrabold text-[#17233C] dark:text-slate-100 flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-[#4F46E5] dark:text-indigo-400" />
                    {t.guide.relationsTitle}
                  </h2>
                  <div className="space-y-2.5">
                    {(Object.keys(EDGE_RELATIONS) as EdgeRelationType[]).map(
                      (rt) => {
                        const rel = EDGE_RELATIONS[rt];
                        return (
                          <div
                            key={rt}
                            className="rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/60 p-2.5 flex items-start gap-3"
                          >
                            <span
                              style={{
                                borderColor: isDark
                                  ? rel.darkStrokeColor
                                  : rel.strokeColor,
                                borderStyle: rel.dashArray ? "dashed" : "solid",
                              }}
                              className="mt-2 inline-block w-7 shrink-0 border-t-2"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-[#17233C] dark:text-slate-100">
                                {edgeShortLabel(rt, lang)}
                              </div>
                              <p className="text-[11px] leading-snug text-[#6F7E93] dark:text-slate-400">
                                {edgeDescription(rt, lang)}
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-2.5 shadow-sm">
                  <h2 className="text-sm font-extrabold text-[#17233C] dark:text-slate-100 flex items-center gap-2">
                    <Keyboard className="h-4 w-4 text-[#FFA33A]" />
                    {t.guide.shortcutsTitle}
                  </h2>
                  <ul className="space-y-2 text-xs text-[#6F7E93] dark:text-slate-400">
                    {t.guide.shortcuts.map((sc, idx) => {
                      const scIcon =
                        idx === 0 ? (
                          <MousePointerClick className="h-3.5 w-3.5 text-[#2F80ED] dark:text-blue-400 shrink-0" />
                        ) : idx === 1 ? (
                          <Search className="h-3.5 w-3.5 text-[#2F80ED] dark:text-blue-400 shrink-0" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-[#2F80ED] dark:text-blue-400 shrink-0" />
                        );
                      return (
                        <li key={sc.keyLabel} className="flex items-start gap-2">
                          <span className="mt-0.5">{scIcon}</span>
                          <span>
                            <strong className="text-[#17233C] dark:text-slate-100">
                              {sc.keyLabel}
                            </strong>{" "}
                            — {sc.text}
                          </span>
                        </li>
                      );
                    })}
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
        isLoading={false}
        lang={lang}
      />
      <AddExplorationModal
        isOpen={isAddExplorationOpen}
        onClose={() => {
          setIsAddExplorationOpen(false);
          setTargetNodeToOpen(null);
        }}
        vault={activeVault}
        targetNode={targetNodeToOpen}
        defaultParentNodeId={defaultParentNodeId}
        onSubmitExploration={handleSubmitExploration}
        isLoading={isAddingExploration}
        lang={lang}
      />
      <OverviewModal
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        vault={activeVault}
        lang={lang}
      />
    </div>
  );
}
