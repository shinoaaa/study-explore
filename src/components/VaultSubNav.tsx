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
  const sourceCount = (vault.learningSources || []).length;
  const favCount = countVaultFavorites(vault);
  const reviewCount = countVaultNeedsReview(vault);

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
            className="max-w-[200px] sm:max-w-[260px] truncate rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 px-2.5 py-1.5 text-xs font-extrabold text-[#17233C] dark:text-slate-100 hover:border-[#2F80ED] focus:border-[#2F80ED] focus:outline-none"
          >
            {vaults.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          <div className="hidden md:flex items-center gap-2 text-[11px] font-semibold text-[#6F7E93] dark:text-slate-400">
            <span>
              {sourceCount} {t.vaultBar.sources}
            </span>
            <span>·</span>
            <span>
              {vault.nodes.length} {t.vaultBar.notes}
            </span>
            {favCount > 0 && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-[#B45309] dark:text-amber-300 font-bold">
                  <Star className="h-3 w-3 fill-current" />
                  {favCount}
                </span>
              </>
            )}
          </div>

          {reviewCount > 0 && (
            <button
              type="button"
              onClick={
                onJumpToNeedsReview || (() => onSelectVaultTab("library"))
              }
              className="inline-flex items-center gap-1 rounded-full border border-[#FCD34D] dark:border-amber-700/70 bg-[#FEF3C7] dark:bg-amber-950/60 px-2.5 py-0.5 text-[11px] font-bold text-[#92400E] dark:text-amber-300 hover:brightness-95"
            >
              <AlertTriangle className="h-3 w-3" />
              {reviewCount} {t.vaultBar.needsReview}
            </button>
          )}
        </div>

        {/* Vault Tabs + Primary Add Exploration CTA */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F3F6FC] dark:bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => onSelectVaultTab("overview")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all ${
                activeVaultTab === "overview"
                  ? "bg-[#2F80ED] text-white shadow-sm"
                  : "text-[#6F7E93] dark:text-slate-400 hover:text-[#17233C] dark:hover:text-slate-200"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>{t.vaultBar.overview}</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectVaultTab("tree")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all ${
                activeVaultTab === "tree"
                  ? "bg-[#2F80ED] text-white shadow-sm"
                  : "text-[#6F7E93] dark:text-slate-400 hover:text-[#17233C] dark:hover:text-slate-200"
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              <span>{t.vaultBar.tree}</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectVaultTab("library")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all ${
                activeVaultTab === "library"
                  ? "bg-[#2F80ED] text-white shadow-sm"
                  : "text-[#6F7E93] dark:text-slate-400 hover:text-[#17233C] dark:hover:text-slate-200"
              }`}
            >
              <BookMarked className="h-3.5 w-3.5" />
              <span>{t.vaultBar.library}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenAddExploration}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t.vaultBar.addExploration.replace(/^\+\s*/, "")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
