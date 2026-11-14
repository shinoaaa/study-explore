"use client";

import { Language, regionShortName, UI_COPY } from "@/lib/i18n";
import { KNOWLEDGE_REGIONS } from "@/lib/regions";
import { KnowledgeVault } from "@/types/knowledge";
import { CheckCircle2, Compass, Layers, X } from "lucide-react";
import React from "react";

interface OverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault: KnowledgeVault;
  lang: Language;
}

export default function OverviewModal({
  isOpen,
  onClose,
  vault,
  lang,
}: OverviewModalProps) {
  if (!isOpen) return null;

  const t = UI_COPY[lang];
  const regInfo =
    KNOWLEDGE_REGIONS[vault.overview.startingRegion] ||
    KNOWLEDGE_REGIONS["REG-01"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#17263C]/45 dark:bg-black/65 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl space-y-4 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#DFE6F0] dark:border-slate-800 pb-4">
          <div className="space-y-1.5">
            <span
              className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${regInfo.badgeClass}`}
            >
              {regionShortName(regInfo.code, lang)}
            </span>
            <h2 className="text-xl font-extrabold text-[#17233C] dark:text-slate-100">
              {vault.overview.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-[#6F7E93] dark:text-slate-400 hover:bg-[#F3F6FC] dark:hover:bg-slate-700 hover:text-[#17233C] dark:hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/50 p-4">
          <p className="text-sm leading-relaxed text-[#334155] dark:text-slate-300">
            {vault.overview.summary}
          </p>
        </div>

        <div className="rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#2F80ED] dark:text-blue-400">
            <Layers className="h-4 w-4" />
            {t.overview.keyConcepts}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {vault.overview.keyConcepts.map((kc, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/70 px-3 py-2 text-xs font-semibold text-[#17233C] dark:text-slate-200"
              >
                <CheckCircle2 className="h-4 w-4 text-[#0D9468] dark:text-emerald-400 shrink-0" />
                <span>{kc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#FDE68A] dark:border-amber-800/60 bg-[#FFFBEB] dark:bg-amber-950/35 p-3.5">
            <div className="text-xs font-extrabold text-[#B45309] dark:text-amber-300 mb-1 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5" />
              {t.overview.principle}
            </div>
            <div className="font-mono text-xs font-semibold text-[#78350F] dark:text-amber-100">
              {vault.overview.coreFormulaOrPrinciple}
            </div>
          </div>
          <div className="rounded-2xl border border-[#A7F3D0] dark:border-emerald-800/60 bg-[#ECFDF5] dark:bg-emerald-950/35 p-3.5">
            <div className="text-xs font-extrabold text-[#047857] dark:text-emerald-300 mb-1">
              {t.overview.reference}
            </div>
            <div className="text-xs font-medium text-[#065F46] dark:text-emerald-100">
              {vault.overview.primaryReference}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[#DFE6F0] dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-5 py-2 text-xs font-bold text-white"
          >
            {t.overview.continueBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
