"use client";

import { EDGE_RELATIONS, KNOWLEDGE_REGIONS } from "@/lib/regions";
import {
  ExplanationDepth,
  KnowledgeNode,
  KnowledgeVault,
} from "@/types/knowledge";
import {
  ArrowRight,
  BookMarked,
  CheckCircle2,
  FlaskConical,
  GitPullRequest,
  HelpCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface NodeInspectorProps {
  vault: KnowledgeVault;
  node: KnowledgeNode;
  onSelectNode: (nodeId: string) => void;
  onMarkMastered: (nodeId: string) => void;
  onExpandNode: (nodeId: string) => Promise<void>;
  isExpanding: boolean;
}

export default function NodeInspector({
  vault,
  node,
  onSelectNode,
  onMarkMastered,
  onExpandNode,
  isExpanding,
}: NodeInspectorProps) {
  const [depth, setDepth] = useState<ExplanationDepth>("standard");
  const [quizFeedback, setQuizFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    setQuizFeedback(null);
  }, [node.id]);

  const regDef = KNOWLEDGE_REGIONS[node.region] || KNOWLEDGE_REGIONS["REG-01"];
  const incomingEdges = vault.edges.filter((e) => e.target === node.id);
  const outgoingEdges = vault.edges.filter((e) => e.source === node.id);

  // Alasan hubungan utama dari edge yang masuk (atau ke node ini)
  const primaryEdge = incomingEdges[0] || outgoingEdges[0];
  const primaryRelDef = primaryEdge
    ? EDGE_RELATIONS[primaryEdge.relation]
    : null;

  return (
    <aside className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-[#0d1320] p-4 shadow-xl">
      <div className="space-y-3.5">
        {/* Node Header (Obsidian Note Header) */}
        <div className="border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${regDef.badgeClass}`}
            >
              {regDef.code} • {regDef.shortName}
            </span>
            {primaryRelDef && (
              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${primaryRelDef.badgeClass}`}
              >
                {primaryRelDef.shortLabel}
              </span>
            )}
            <span className="rounded-md bg-slate-800/90 px-2 py-0.5 text-xs text-slate-300">
              {node.difficulty}
            </span>
            {node.mastered && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Dipahami
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold leading-snug text-slate-100">
            {node.title}
          </h2>
          <p className="mt-1 text-xs text-slate-400">{node.summary}</p>
        </div>

        {/* Kotak Alasan Hubungan (Mandatory Edge Reason - BR-03 & FR-07) */}
        <div className="rounded-xl border border-indigo-500/35 bg-indigo-500/10 p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-indigo-300">
            <span className="flex items-center gap-1.5">
              <GitPullRequest className="h-3.5 w-3.5" />
              Mengapa Konsep Ini Terhubung? (BR-03)
            </span>
            {primaryEdge?.isCrossRegion && (
              <span className="rounded bg-purple-500/25 border border-purple-400/40 px-1.5 py-0.5 text-[10px] text-purple-200">
                Cross-Region Portal
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed text-slate-100">
            {primaryEdge
              ? primaryEdge.reason
              : "Titik awal (Origin Node) di dalam Knowledge Vault ini yang menjadi pusat pemetaan cabang konsep."}
          </p>
        </div>

        {/* Obsidian Backlinks (Incoming Prerequisites & Outgoing Branches) */}
        <div className="rounded-xl border border-slate-800 bg-[#090d16] p-3 space-y-2">
          <div className="text-xs font-semibold text-slate-300">
            🔗 Tautan Konsep di Dalam Vault (Obsidian Backlinks):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {incomingEdges.map((edge) => {
              const src = vault.nodes.find((n) => n.id === edge.source);
              if (!src) return null;
              return (
                <button
                  key={edge.id}
                  onClick={() => onSelectNode(src.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:border-indigo-500 hover:text-indigo-200"
                >
                  <span className="text-amber-300 font-mono text-[10px]">
                    ← {EDGE_RELATIONS[edge.relation].shortLabel}:
                  </span>
                  <span className="truncate max-w-[155px]">{src.title}</span>
                </button>
              );
            })}
            {outgoingEdges.map((edge) => {
              const tgt = vault.nodes.find((n) => n.id === edge.target);
              if (!tgt) return null;
              return (
                <button
                  key={edge.id}
                  onClick={() => onSelectNode(tgt.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:border-indigo-500 hover:text-indigo-200"
                >
                  <span className="text-indigo-300 font-mono text-[10px]">
                    → {EDGE_RELATIONS[edge.relation].shortLabel}:
                  </span>
                  <span className="truncate max-w-[155px]">{tgt.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Level Explanation Switcher (Aksesibilitas Bahasa - FEAT-07) */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-[#090d16] p-2">
          <span className="text-xs font-medium text-slate-400 pl-1">
            Level Penjelasan:
          </span>
          <div className="flex items-center gap-1">
            {(
              [
                { key: "simple", label: "🌱 Analogi Mudah" },
                { key: "standard", label: "📘 Standar SMA" },
                { key: "deep", label: "🔬 Sains Lanjut" },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                onClick={() => setDepth(item.key)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  depth === item.key
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Isi Modul Catatan Node */}
        <div className="rounded-xl border border-slate-800 bg-[#090d16] p-3.5 space-y-2.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Catatan Konsep ({depth === "simple" ? "Analogi Pemula" : depth === "standard" ? "Tingkat Kurikulum" : "Mekanisme Lanjut"})
          </div>
          <p className="text-sm leading-relaxed text-slate-200">
            {node.levels[depth]}
          </p>
          <div className="rounded-lg border border-slate-800 bg-[#0f1624] p-2.5 font-mono text-xs text-indigo-300">
            {node.formula}
          </div>
        </div>

        {/* Contoh Penerapan Sesuai Minat */}
        <div className="rounded-xl border border-slate-800 bg-[#090d16] p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <FlaskConical className="h-3.5 w-3.5" />
            Penerapan &amp; Konteks Minat Pengguna
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            {node.application}
          </p>
        </div>

        {/* Cek Paham Cepat 1 Pertanyaan (FEAT-08) */}
        <div className="rounded-xl border border-slate-800 bg-[#090d16] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <HelpCircle className="h-3.5 w-3.5" />
              Cek Paham Cepat (1 Pertanyaan)
            </span>
          </div>
          <p className="text-xs font-medium text-slate-200">
            {node.quickCheck.question}
          </p>
          <div className="space-y-1.5">
            {node.quickCheck.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  if (opt.correct) {
                    onMarkMastered(node.id);
                    setQuizFeedback({
                      correct: true,
                      message:
                        "✓ Tepat! Node ini telah ditandai sebagai 'Dipahami' di dalam Vault.",
                    });
                  } else {
                    setQuizFeedback({
                      correct: false,
                      message:
                        "✗ Belum tepat. Coba baca kembali catatan konsep atau aktifkan mode 'Analogi Mudah'.",
                    });
                  }
                }}
                className="w-full rounded-lg border border-slate-800 bg-[#0f1624] hover:border-indigo-500/60 p-2 text-left text-xs text-slate-200 transition-all flex items-center justify-between gap-2"
              >
                <span>{opt.text}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
          {quizFeedback && (
            <div
              className={`rounded-lg p-2 text-xs font-medium ${
                quizFeedback.correct
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
              }`}
            >
              {quizFeedback.message}
            </div>
          )}
        </div>
      </div>

      {/* Footer: Reference & Progressive Expansion Button */}
      <div className="mt-4 pt-3 border-t border-slate-800 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <BookMarked className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">
            <strong className="text-slate-300">Referensi:</strong> {node.reference}
          </span>
        </div>

        <button
          onClick={() => onExpandNode(node.id)}
          disabled={isExpanding}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-2.5 px-4 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all"
        >
          {isExpanding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Memetakan Cabang Baru dari Node Ini...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              + Kembangkan Cabang dari Konsep Ini (Expand Node)
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
