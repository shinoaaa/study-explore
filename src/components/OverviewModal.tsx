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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17263C]/45 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl border border-[#DFE6F0] bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-4 border-b border-[#DFE6F0] pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2FF] px-3 py-0.5 text-xs font-bold text-[#2F80ED]">
                <BookOpenCheck className="h-3.5 w-3.5" />
                Foundation Overview
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${regInfo.badgeClass}`}
              >
                Starting Region: {regInfo.code} · {regInfo.shortName}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[#17233C]">
              {vault.overview.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#DFE6F0] bg-white p-2 text-[#6F7E93] hover:bg-[#F3F6FC] hover:text-[#17233C]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-[#DFE6F0] bg-[#F8FAFC] p-4 space-y-1.5">
          <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#6F7E93]">
            Concept Synthesis
          </div>
          <p className="text-sm leading-relaxed text-[#334155]">
            {vault.overview.summary}
          </p>
        </div>

        <div className="rounded-2xl border border-[#DFE6F0] bg-white p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#2F80ED]">
            <Layers className="h-4 w-4" />
            Extracted Key Concepts in Vault
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {vault.overview.keyConcepts.map((kc, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl border border-[#DFE6F0] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#17233C]"
              >
                <CheckCircle2 className="h-4 w-4 text-[#0D9468] shrink-0" />
                <span>{kc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-3.5">
            <div className="text-xs font-extrabold text-[#B45309] mb-1 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5" />
              Core Flow / Principle
            </div>
            <div className="font-mono text-xs font-semibold text-[#78350F]">
              {vault.overview.coreFormulaOrPrinciple}
            </div>
          </div>
          <div className="rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] p-3.5">
            <div className="text-xs font-extrabold text-[#047857] mb-1">
              Primary Open Reference
            </div>
            <div className="text-xs font-medium text-[#065F46]">
              {vault.overview.primaryReference}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[#DFE6F0]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-5 py-2 text-xs font-bold text-white"
          >
            Continue Exploring
          </button>
        </div>
      </div>
    </div>
  );
}
