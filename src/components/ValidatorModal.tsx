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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-[#0f1624] p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Knowledge Intelligence Layer • Validation Engine (FR-08 &amp; BR-06)
            </span>
            <h2 className="text-lg font-bold text-slate-100">
              Structured JSON Contract &amp; DAG Integrity Report
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Guardrail Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <div className="font-semibold text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              JSON Schema
            </div>
            <div className="mt-1 text-slate-200 font-mono">
              {v.schemaValid ? "VALID (Strict Contract)" : "INVALID"}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <div className="font-semibold text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              DAG Acyclic Check
            </div>
            <div className="mt-1 text-slate-200 font-mono">
              {v.dagAcyclic ? "ACYCLIC (0 Cycles)" : "SANITIZED"}
            </div>
          </div>
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3">
            <div className="font-semibold text-indigo-300">
              Prerequisite Guard (BR-02)
            </div>
            <div className="mt-1 text-slate-200 font-mono">
              {v.prerequisiteSeparated ? "Separated ✓" : "Mixed"}
            </div>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3">
            <div className="font-semibold text-purple-300">
              Regions Covered (BR-04)
            </div>
            <div className="mt-1 text-slate-200 font-mono">
              {v.regionsCovered.join(", ")}
            </div>
          </div>
        </div>

        {/* Raw Structured JSON Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-300">
              <Code2 className="h-4 w-4 text-indigo-400" />
              Structured JSON Payload (Tanpa Free-Text Parsing — NFR-01):
            </span>
            <span className="font-mono">
              Orphan Edges Removed: {v.orphanEdgesRemoved} | Duplicate Nodes Removed:{" "}
              {v.duplicateNodesRemoved}
            </span>
          </div>
          <pre className="max-h-80 overflow-auto rounded-xl border border-slate-800 bg-[#080c14] p-3.5 font-mono text-xs text-slate-200">
            {JSON.stringify(
              {
                vaultId: vault.id,
                vaultName: vault.name,
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

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white"
          >
            Tutup Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
