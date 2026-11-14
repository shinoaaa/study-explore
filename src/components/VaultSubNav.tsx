"use client";

import { Language, UI_COPY } from "@/lib/i18n";
import { countVaultFavorites, countVaultNeedsReview } from "@/lib/vault-storage";
import { KnowledgeVault } from "@/types/knowledge";
import {
  AlertTriangle,
  BookMarked,
  Compass,
  Folder,
  Network,
  Plus,
  Star,
} from "lucide-react";
import React from "react";

export type VaultWorkspaceTab = "overview" | "tree" | "library";

interface VaultSubNavProps {
  vault: KnowledgeVault;
  vaults: KnowledgeVault[];
  activeVaultTab: VaultWorkspaceTab;
  onSelectVaultTab: (tab: VaultWorkspaceTab) => void;
  onSwitchVault: (vaultId: string) => void;
  onOpenAddExploration: () => void;
  onJumpToNeedsReview?: () => void;
  lang: Language;
  compact?: boolean;
}

export default function VaultSubNav({
  vault,
  vaults,
  activeVaultTab,
  onSelectVaultTab,
  onSwitchVault,
  onOpenAddExploration,
  onJumpToNeedsReview,
  lang,
  compact = false,
}: VaultSubNavProps) {
  const t = UI_COPY[lang];
  const favCount = countVaultFavorites(vault);
  const reviewCount = countVaultNeedsReview(vault);

  const tabs: {
    id: VaultWorkspaceTab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "overview",
      label: t.vaultBar.overview,
      icon: <Compass className="h-3.5 w-3.5" />,
    },
    {
      id: "tree",
      label: t.vaultBar.tree,
      icon: <Network className="h-3.5 w-3.5" />,
    },
    {
      id: "library",
      label: t.vaultBar.library,
      icon: <BookMarked className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div
      className={`border-b border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] transition-colors ${
        compact ? "px-3 sm:px-4 py-2" : "px-4 sm:px-8 py-3"
      }`}
    >
      <div className="mx-auto max-w-[1260px] flex flex-wrap items-center justify-between gap-2.5">
        {/* Vault Switcher + Compact Live Counts */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF2FF] dark:bg-blue-950/70 text-[#2F80ED] dark:text-blue-400 shrink-0">
            <Folder className="h-4 w-4" />
          </div>
          <select
            aria-label={t.vaultBar.switchVault}
            value={vault.id}
            onChange={(e) => onSwitchVault(e.target.value)}
            className="max-w-[220px] sm:max-w-[260px] truncate rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/90 px-3 py-1.5 text-xs font-extrabold text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
          >
            {vaults.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold text-[#6F7E93] dark:text-slate-400 pl-1">
            <span className="rounded-lg bg-[#F3F6FC] dark:bg-slate-800 px-2 py-0.5">
              {vault.nodes.length} {t.vaultBar.notes}
            </span>
            {favCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#FFFBEB] dark:bg-amber-950/60 border border-[#FDE68A] dark:border-amber-800 px-2 py-0.5 text-[#B45309] dark:text-amber-300 font-bold">
                <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                {favCount}
              </span>
            )}
            {reviewCount > 0 && (
              <button
                type="button"
                onClick={onJumpToNeedsReview}
                className="inline-flex items-center gap-1 rounded-lg bg-[#FFF7ED] dark:bg-orange-950/70 border border-[#FED7AA] dark:border-orange-800 px-2 py-0.5 text-[#C2410C] dark:text-orange-300 font-bold hover:bg-[#FFEDD5] transition-colors"
              >
                <AlertTriangle className="h-3 w-3" />
                {reviewCount} {t.vaultBar.needsReview}
              </button>
            )}
          </div>
        </div>

        {/* Inside-Vault Navigation Tabs + Add Node Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F3F6FC] dark:bg-slate-800/90 p-1">
            {tabs.map((tab) => {
              const active = activeVaultTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => onSelectVaultTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? "bg-white dark:bg-[#111827] text-[#2F80ED] dark:text-blue-400 shadow-sm"
                      : "text-[#6F7E93] dark:text-slate-300 hover:text-[#17233C] dark:hover:text-white"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenAddExploration}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-3 sm:px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{lang === "en" ? "New Node" : "Node Baru"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
