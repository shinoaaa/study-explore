"use client";

import { EDGE_RELATIONS, KNOWLEDGE_REGIONS } from "@/lib/regions";
import {
  ExplanationDepth,
  KnowledgeNode,
  KnowledgeVault,
} from "@/types/knowledge";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Eye,
  FlaskConical,
  Link2,
  Loader2,
  Sparkles,
  Zap,
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
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    setQuizFeedback(null);
    setShowQuiz(false);
  }, [node.id]);

  const regDef = KNOWLEDGE_REGIONS[node.region] || KNOWLEDGE_REGIONS["REG-01"];
  const incomingEdges = vault.edges.filter((e) => e.target === node.id);
  const outgoingEdges = vault.edges.filter((e) => e.source === node.id);

  const primaryEdge = incomingEdges[0] || outgoingEdges[0];
  const primaryRelDef = primaryEdge
    ? EDGE_RELATIONS[primaryEdge.relation]
    : null;
  const connectedFromNode = primaryEdge
    ? vault.nodes.find(
        (n) =>
          n.id ===
          (primaryEdge.target === node.id
            ? primaryEdge.source
            : primaryEdge.target)
      )
    : null;

  return (
    <aside className="flex flex-col justify-between rounded-2xl border border-[#DFE6F0] bg-white shadow-sm overflow-hidden">
      {/* Header Strip */}
      <div className="flex items-center justify-between border-b border-[#DFE6F0] px-5 py-3.5 bg-white">
        <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#17233C]">
          <BookOpen className="h-4 w-4 text-[#2F80ED]" />
          Node Inspector
        </span>
        <span className="rounded-full bg-[#F3F6FC] border border-[#DFE6F0] px-2.5 py-0.5 text-[11px] font-semibold text-[#6F7E93]">
          {node.difficulty}
        </span>
      </div>

      {/* Scrollable Body */}
      <div className="p-5 space-y-4 max-h-[545px] overflow-y-auto">
        {/* Badges + Title */}
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${regDef.badgeClass}`}
            >
              {regDef.code} · {regDef.shortName}
            </span>
            {node.mastered ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 text-xs font-bold text-[#047857]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mastered
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF2FF] px-2.5 py-0.5 text-xs font-bold text-[#2F80ED]">
                <Eye className="h-3.5 w-3.5" />
                Opened
              </span>
            )}
          </div>

          <h2 className="text-xl font-extrabold leading-snug text-[#17233C]">
            {node.title}
          </h2>

          {connectedFromNode && primaryRelDef && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-[#6F7E93]">
              <span>Connected from</span>
              <button
                type="button"
                onClick={() => onSelectNode(connectedFromNode.id)}
                className="rounded-full border border-[#DFE6F0] bg-[#F3F6FC] hover:border-[#2F80ED] px-2.5 py-0.5 font-semibold text-[#17233C]"
              >
                {connectedFromNode.title}
              </button>
              <span
                style={{ color: primaryRelDef.strokeColor }}
                className="font-bold"
              >
                → {primaryRelDef.shortLabel}
              </span>
            </div>
          )}
        </div>

        {/* Why Is This Connected? (BR-03 Mandatory Edge Reason) */}
        <div className="relative overflow-hidden rounded-xl border border-[#C7D2FE] bg-[#F5F7FF] p-3.5 pl-4">
          <div className="absolute inset-y-0 left-0 w-1 bg-[#4F46E5]" />
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-[#4F46E5]">
              <Link2 className="h-3.5 w-3.5" />
              Why Is This Connected? (BR-03)
            </span>
            {primaryEdge?.isCrossRegion && (
              <span className="rounded-full bg-[#FAE8FF] border border-[#F0ABFC] px-2 py-0.5 text-[10px] font-bold text-[#86198F]">
                Cross-Region
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[#17233C]">
            {primaryEdge
              ? primaryEdge.reason
              : "Origin Node in this Knowledge Vault — the starting anchor where prerequisite roots and exploratory branches unfold."}
          </p>
        </div>

        {/* 3-Level Explanation Switcher (FEAT-07) */}
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-[#DFE6F0] bg-[#F3F6FC] p-1">
          {(
            [
              { key: "simple", label: "Easy Analogy" },
              { key: "standard", label: "Standard SMA" },
              { key: "deep", label: "Advanced" },
            ] as const
          ).map((item) => (
            <button
              type="button"
              key={item.key}
              onClick={() => setDepth(item.key)}
              className={`rounded-lg py-1.5 px-2 text-xs font-bold transition-all ${
                depth === item.key
                  ? "bg-[#2F80ED] text-white shadow-sm"
                  : "text-[#6F7E93] hover:text-[#17233C]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Concept Note Content */}
        <p className="text-sm leading-relaxed text-[#334155]">
          {node.levels[depth]}
        </p>

        {/* Key Equation / Principle */}
        <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-3.5 py-2.5">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#B45309]">
            Key Equation / Principle
          </div>
          <div className="mt-1 font-mono text-xs font-semibold text-[#78350F]">
            {node.formula}
          </div>
        </div>

        {/* Application in User's Interest */}
        <div className="rounded-xl border border-[#DFE6F0] bg-[#F8FAFC] p-3">
          <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-[#0D9468]">
            <FlaskConical className="h-3.5 w-3.5" />
            Application &amp; Personal Context
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#475569]">
            {node.application}
          </p>
        </div>

        {/* Obsidian-style Backlinks */}
        <div>
          <div className="flex items-center justify-between text-[10.5px] font-extrabold uppercase tracking-wider text-[#6F7E93] mb-2">
            <span>Links</span>
            <span>
              {incomingEdges.length} in · {outgoingEdges.length} out
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {incomingEdges.map((edge) => {
              const src = vault.nodes.find((n) => n.id === edge.source);
              if (!src) return null;
              const rel = EDGE_RELATIONS[edge.relation];
              return (
                <button
                  type="button"
                  key={edge.id}
                  onClick={() => onSelectNode(src.id)}
                  style={{
                    backgroundColor: rel.bgHex,
                    borderColor: `${rel.strokeColor}66`,
                  }}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold text-[#17233C] hover:brightness-95"
                >
                  <ArrowLeft
                    className="h-3 w-3 shrink-0"
                    style={{ color: rel.strokeColor }}
                  />
                  <span className="truncate max-w-[140px]">{src.title}</span>
                </button>
              );
            })}
            {outgoingEdges.map((edge) => {
              const tgt = vault.nodes.find((n) => n.id === edge.target);
              if (!tgt) return null;
              const rel = EDGE_RELATIONS[edge.relation];
              return (
                <button
                  type="button"
                  key={edge.id}
                  onClick={() => onSelectNode(tgt.id)}
                  style={{
                    backgroundColor: rel.bgHex,
                    borderColor: `${rel.strokeColor}66`,
                  }}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold text-[#17233C] hover:brightness-95"
                >
                  <ArrowRight
                    className="h-3 w-3 shrink-0"
                    style={{ color: rel.strokeColor }}
                  />
                  <span className="truncate max-w-[140px]">{tgt.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 1-Click Quick Check Card */}
        {showQuiz && (
          <div className="rounded-xl border border-[#BFDBFE] bg-[#F8FAFC] p-3.5 space-y-2">
            <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#2F80ED]">
              1-Click Quick Check
            </div>
            <p className="text-xs font-bold text-[#17233C]">
              {node.quickCheck.question}
            </p>
            <div className="space-y-1.5">
              {node.quickCheck.options.map((opt, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    if (opt.correct) {
                      onMarkMastered(node.id);
                      setQuizFeedback({
                        correct: true,
                        message:
                          "Correct! Concept marked as Mastered in your Vault.",
                      });
                    } else {
                      setQuizFeedback({
                        correct: false,
                        message:
                          "Not quite yet — try switching to Easy Analogy and review the mechanism.",
                      });
                    }
                  }}
                  className="w-full flex items-center justify-between gap-2 rounded-xl border border-[#DFE6F0] bg-white hover:border-[#2F80ED] p-2.5 text-left text-xs text-[#17233C] transition-all"
                >
                  <span>{opt.text}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" />
                </button>
              ))}
            </div>
            {quizFeedback && (
              <div
                className={`rounded-xl border p-2.5 text-xs font-semibold ${
                  quizFeedback.correct
                    ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]"
                    : "border-amber-300 bg-amber-50 text-amber-800"
                }`}
              >
                {quizFeedback.message}
              </div>
            )}
          </div>
        )}

        {/* References */}
        <div>
          <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#6F7E93] mb-1">
            References
          </div>
          <div className="flex items-start gap-2 text-xs font-medium text-[#17233C]">
            <BookOpen className="h-4 w-4 text-[#2F80ED] shrink-0 mt-0.5" />
            <span>{node.reference}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions matching Figma */}
      <div className="border-t border-[#DFE6F0] bg-[#F8FAFC] p-4 space-y-2.5">
        <button
          type="button"
          onClick={() => onExpandNode(node.id)}
          disabled={isExpanding}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] disabled:opacity-50 py-2.5 px-4 text-xs font-bold text-white shadow-sm transition-all"
        >
          {isExpanding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mapping New Branches &amp; Growing Regions...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Expand This Node
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setShowQuiz((q) => !q)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#DFE6F0] bg-white hover:border-[#2F80ED] py-2 px-3 text-xs font-bold text-[#17233C] transition-all"
          >
            <Zap className="h-3.5 w-3.5 text-[#FFA33A]" />
            Quick Check
          </button>
          <button
            type="button"
            onClick={() => onMarkMastered(node.id)}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all ${
              node.mastered
                ? "bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]"
                : "bg-[#EAF2FF] text-[#2F80ED] hover:bg-[#DCEAFE]"
            }`}
          >
            <Check className="h-3.5 w-3.5" />
            {node.mastered ? "Mastered ✓" : "Mark Mastered"}
          </button>
        </div>
      </div>
    </aside>
  );
}
