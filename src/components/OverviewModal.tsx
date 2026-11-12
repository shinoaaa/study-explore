"use client";

import { KNOWLEDGE_REGIONS } from "@/lib/regions";
import { KnowledgeVault } from "@/types/knowledge";
import { BookOpenCheck, CheckCircle2, Compass, Layers, X } from "lucide-react";
import React from "react";

interface OverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault: KnowledgeVault;
}

export default function OverviewModal({
  isOpen,
  onClose,
  vault,
}: OverviewModalProps) {
  if (!isOpen) return null;

  const regInfo =
    KNOWLEDGE_REGIONS[vault.overview.startingRegion] ||
    KNOWLEDGE_REGIONS["REG-01"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0f1624] p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                <BookOpenCheck className="h-3.5 w-3.5" />
                Modul Fondasi Vault (FR-04)
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${regInfo.badgeClass}`}
              >
                Starting Region: {regInfo.code} ({regInfo.shortName})
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              {vault.overview.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Sintesis Pengantar &amp; Konteks Pemetaan (Bukan Salinan Buku Cetak — BR-08)
          </div>
          <p className="text-sm leading-relaxed text-slate-200">
            {vault.overview.summary}
          </p>
        </div>

        {/* Key Concepts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
            <Layers className="h-4 w-4" />
            Konsep Kunci yang Diekstrak ke Dalam Vault:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {vault.overview.keyConcepts.map((kc, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0b101b] px-3 py-2 text-xs text-slate-200"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{kc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Core Principle & Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
            <div className="text-xs font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5" />
              Alur Prinsip Utama:
            </div>
            <div className="font-mono text-xs text-slate-200">
              {vault.overview.coreFormulaOrPrinciple}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
            <div className="text-xs font-semibold text-emerald-300 mb-1">
              📚 Rujukan Literatur Utama:
            </div>
            <div className="text-xs text-slate-200">
              {vault.overview.primaryReference}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white"
          >
            Kembali ke Peta Skill Tree
          </button>
        </div>
      </div>
    </div>
  );
}
