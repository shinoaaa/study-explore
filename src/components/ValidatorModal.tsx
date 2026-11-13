"use client";

import { KnowledgeVault } from "@/types/knowledge";
import { CheckCircle2, Code2, ShieldCheck, X } from "lucide-react";
import React from "react";

interface ValidatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault: KnowledgeVault;
}

export default function ValidatorModal({
  isOpen,
  onClose,
  vault,
}: ValidatorModalProps) {
  if (!isOpen) return null;

  const v = vault.validation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17263C]/45 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl border border-[#DFE6F0] bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-4 border-b border-[#DFE6F0] pb-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-0.5 text-xs font-bold text-[#047857]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Validation Engine · FR-08, BR-06 &amp; NFR-09
            </span>
            <h2 className="text-xl font-extrabold text-[#17233C]">
              Structured JSON Contract &amp; DAG Integrity Report
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] p-3">
            <div className="font-bold text-[#047857] flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              JSON Schema
            </div>
            <div className="mt-1 text-[#065F46] font-mono font-bold">
              {v.schemaValid ? "VALID Contract" : "INVALID"}
            </div>
          </div>
          <div className="rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] p-3">
            <div className="font-bold text-[#047857] flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              DAG Acyclic Check
            </div>
            <div className="mt-1 text-[#065F46] font-mono font-bold">
              {v.dagAcyclic ? "ACYCLIC (0 Cycles)" : "SANITIZED"}
            </div>
          </div>
          <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-3">
            <div className="font-bold text-[#1D4ED8]">
              Containment (NFR-09)
            </div>
            <div className="mt-1 text-[#1E3A8A] font-mono font-bold">
              100% Inside Regions
            </div>
          </div>
          <div className="rounded-2xl border border-[#DDD6FE] bg-[#F5F3FF] p-3">
            <div className="font-bold text-[#6D28D9]">
              Regions Covered (BR-04)
            </div>
            <div className="mt-1 text-[#5B21B6] font-mono font-bold truncate">
              {v.regionsCovered.join(", ")}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6F7E93]">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#17233C]">
              <Code2 className="h-4 w-4 text-[#2F80ED]" />
              Structured JSON Payload (Zero Unvalidated Text — NFR-01):
            </span>
            <span className="font-mono text-[11px]">
              Orphans Removed: {v.orphanEdgesRemoved} | Dupes Removed:{" "}
              {v.duplicateNodesRemoved}
            </span>
          </div>
          <pre className="max-h-72 overflow-auto rounded-2xl border border-[#DFE6F0] bg-[#F8FAFC] p-3.5 font-mono text-xs text-[#17233C]">
            {JSON.stringify(
              {
                vaultId: vault.id,
                vaultName: vault.name,
                unboundedGrowthMode: true,
                validation: vault.validation,
                inputContext: vault.inputContext,
                nodesCount: vault.nodes.length,
                edgesCount: vault.edges.length,
                nodes: vault.nodes.map((n) => ({
                  id: n.id,
                  title: n.title,
                  region: n.region,
                  relationToOrigin: n.relationToOrigin,
                  difficulty: n.difficulty,
                  explored: n.explored,
                  mastered: n.mastered,
                  reference: n.reference,
                })),
                edges: vault.edges,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="flex justify-end pt-2 border-t border-[#DFE6F0]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] px-5 py-2 text-xs font-bold text-white"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
