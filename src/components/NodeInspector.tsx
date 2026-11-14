"use client";

import {
  difficultyLabel,
  edgeShortLabel,
  Language,
  regionShortName,
  ThemeMode,
  UI_COPY,
} from "@/lib/i18n";
import { EDGE_RELATIONS, KNOWLEDGE_REGIONS } from "@/lib/regions";
import {
  ExplanationDepth,
  KnowledgeNode,
  KnowledgeVault,
} from "@/types/knowledge";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpen,
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  FlaskConical,
  Link2,
  Loader2,
  Maximize2,
  Minimize2,
  Sparkles,
  Star,
  StickyNote,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface NodeInspectorProps {
  vault: KnowledgeVault;
  node: KnowledgeNode | null;
  onSelectNode: (nodeId: string) => void;
  onClose: () => void;
  onMarkMastered: (nodeId: string) => void;
  onToggleFavorite: (nodeId: string) => void;
  onOpenInLibrary: (nodeId: string, editMode?: boolean) => void;
  onExpandNode: (nodeId: string) => Promise<void>;
  isExpanding: boolean;
  lang: Language;
  theme: ThemeMode;
}

export default function NodeInspector({
  vault,
  node,
  onSelectNode,
  onClose,
  onMarkMastered,
  onToggleFavorite,
  onOpenInLibrary,
  onExpandNode,
  isExpanding,
  lang,
  theme,
}: NodeInspectorProps) {
  const t = UI_COPY[lang];
  const [depth, setDepth] = useState<ExplanationDepth>("standard");
  const [showQuiz, setShowQuiz] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    setQuizFeedback(null);
    setShowQuiz(false);
  }, [node?.id]);

  useEffect(() => {
    if (!node) {
      setIsMaximized(false);
      return;
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isMaximized) {
          setIsMaximized(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [node, isMaximized, onClose]);

  if (!node) return null;

  const isDark = theme === "dark";
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

  const modalCard = (
    <div
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal={isMaximized ? "true" : "false"}
      aria-label={node.title}
      className={`flex flex-col justify-between bg-white dark:bg-[#111827] border border-[#DFE6F0] dark:border-slate-800 overflow-hidden transition-all ${
        isMaximized
          ? "w-full max-w-3xl max-h-[88vh] rounded-3xl shadow-2xl"
          : "h-full w-full rounded-2xl shadow-xl shadow-[#17263C]/12 dark:shadow-black/50"
      }`}
    >
      {/* Clean Header Strip with Size Toggle & Close */}
      <div className="flex items-center justify-between gap-2 border-b border-[#DFE6F0] dark:border-slate-800 px-5 py-3.5 bg-white dark:bg-[#111827] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#17233C] dark:text-slate-100">
            <BookOpen className="h-4 w-4 text-[#2F80ED] dark:text-blue-400 shrink-0" />
            {t.reader.title}
          </span>
          <span className="rounded-full bg-[#F3F6FC] dark:bg-slate-800 border border-[#DFE6F0] dark:border-slate-700 px-2.5 py-0.5 text-[11px] font-semibold text-[#6F7E93] dark:text-slate-300 truncate">
            {difficultyLabel(node.difficulty, lang)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onToggleFavorite(node.id)}
            aria-label={node.isFavorite ? t.reader.unfavorite : t.reader.favorite}
            title={node.isFavorite ? t.reader.unfavorite : t.reader.favorite}
            className={`rounded-xl border p-1.5 transition-colors ${
              node.isFavorite
                ? "border-[#FCD34D] dark:border-amber-700/70 bg-[#FFFBEB] dark:bg-amber-950/60 text-[#F59E0B]"
                : "border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#94A3B8] hover:text-[#F59E0B]"
            }`}
          >
            <Star className={`h-4 w-4 ${node.isFavorite ? "fill-current" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsMaximized((m) => !m)}
            aria-label={isMaximized ? t.reader.compact : t.reader.enlarge}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 hover:border-[#2F80ED] hover:bg-[#EAF2FF] dark:hover:bg-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-[#17233C] dark:text-slate-200 transition-colors"
          >
            {isMaximized ? (
              <>
                <Minimize2 className="h-3.5 w-3.5 text-[#2F80ED] dark:text-blue-400" />
                <span className="hidden sm:inline">{t.reader.compact}</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-[#2F80ED] dark:text-blue-400" />
                <span className="hidden sm:inline">{t.reader.enlarge}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-200 dark:hover:border-rose-800 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 text-[#6F7E93] dark:text-slate-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 p-5 sm:p-6 space-y-4 overflow-y-auto">
        {/* Badges + Title */}
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${regDef.badgeClass}`}
            >
              {regionShortName(node.region, lang)}
            </span>
            {node.origin === "user_edited" ? (
              <span className="rounded-full bg-[#F5F3FF] dark:bg-violet-950/60 border border-[#DDD6FE] dark:border-violet-700/60 px-2.5 py-0.5 text-xs font-bold text-[#6D28D9] dark:text-violet-300">
                {t.library.statusBadges.user_edited}
              </span>
            ) : (
              <span className="rounded-full bg-[#EAF2FF] dark:bg-blue-950/60 border border-[#BFDBFE] dark:border-blue-800 px-2.5 py-0.5 text-xs font-bold text-[#2F80ED] dark:text-blue-300">
                {t.library.statusBadges.ai_generated}
              </span>
            )}
            {node.reviewStatus === "needs_review" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] dark:bg-amber-950/60 border border-[#FCD34D] dark:border-amber-700/60 px-2.5 py-0.5 text-xs font-bold text-[#92400E] dark:text-amber-300">
                <AlertTriangle className="h-3 w-3" />
                {t.library.statusBadges.needs_review}
              </span>
            )}
            {node.mastered ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#A7F3D0] dark:border-emerald-700/60 px-2.5 py-0.5 text-xs font-bold text-[#047857] dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t.reader.mastered}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF2FF] dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-bold text-[#2F80ED] dark:text-blue-300">
                <Eye className="h-3.5 w-3.5" />
                {t.reader.opened}
              </span>
            )}
          </div>

          <h2
            className={`font-extrabold leading-snug text-[#17233C] dark:text-slate-100 ${
              isMaximized ? "text-2xl" : "text-xl"
            }`}
          >
            {node.title}
          </h2>

          {connectedFromNode && primaryRelDef && primaryEdge && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-[#6F7E93] dark:text-slate-400">
              <span>{t.reader.connectedFrom}</span>
              <button
                type="button"
                onClick={() => onSelectNode(connectedFromNode.id)}
                className="rounded-full border border-[#DFE6F0] dark:border-slate-700 bg-[#F3F6FC] dark:bg-slate-800 hover:border-[#2F80ED] px-2.5 py-0.5 font-semibold text-[#17233C] dark:text-slate-200"
              >
                {connectedFromNode.title}
              </button>
              <span
                style={{
                  color: isDark
                    ? primaryRelDef.darkStrokeColor
                    : primaryRelDef.strokeColor,
                }}
                className="font-bold"
              >
                → {edgeShortLabel(primaryEdge.relation, lang)}
              </span>
            </div>
          )}
        </div>

        {/* Clean Connection Reason */}
        <div className="relative overflow-hidden rounded-xl border border-[#C7D2FE] dark:border-indigo-800/60 bg-[#F5F7FF] dark:bg-indigo-950/35 p-3.5 pl-4">
          <div className="absolute inset-y-0 left-0 w-1 bg-[#4F46E5] dark:bg-indigo-400" />
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-300">
              <Link2 className="h-3.5 w-3.5" />
              {t.reader.whyConnects}
            </span>
            {primaryEdge?.isCrossRegion && (
              <span className="rounded-full bg-[#FAE8FF] dark:bg-fuchsia-950/60 border border-[#F0ABFC] dark:border-fuchsia-700/60 px-2 py-0.5 text-[10px] font-bold text-[#86198F] dark:text-fuchsia-300">
                {t.reader.crossRegion}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[#17233C] dark:text-slate-200">
            {primaryEdge ? primaryEdge.reason : t.reader.rootWhy}
          </p>
        </div>

        {/* 3-Level Explanation Switcher */}
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F3F6FC] dark:bg-slate-900 p-1">
          {(
            [
              { key: "simple", label: t.reader.simple },
              { key: "standard", label: t.reader.standard },
              { key: "deep", label: t.reader.deep },
            ] as const
          ).map((item) => (
            <button
              type="button"
              key={item.key}
              onClick={() => setDepth(item.key)}
              className={`rounded-lg py-1.5 px-2 text-xs font-bold transition-colors ${
                depth === item.key
                  ? "bg-[#2F80ED] text-white shadow-sm"
                  : "text-[#6F7E93] dark:text-slate-400 hover:text-[#17233C] dark:hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Concept Note Content */}
        <p
          className={`leading-relaxed text-[#334155] dark:text-slate-300 ${
            isMaximized ? "text-[15px]" : "text-sm"
          }`}
        >
          {node.levels[depth]}
        </p>

        {/* Key Principle & Real Life */}
        <div
          className={`grid gap-3 ${
            isMaximized ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          }`}
        >
          <div className="rounded-xl border border-[#FDE68A] dark:border-amber-800/60 bg-[#FFFBEB] dark:bg-amber-950/35 px-3.5 py-2.5">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#B45309] dark:text-amber-300">
              {t.reader.formula}
            </div>
            <div className="mt-1 font-mono text-xs font-semibold text-[#78350F] dark:text-amber-100">
              {node.formula}
            </div>
          </div>

          <div className="rounded-xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/60 p-3">
            <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-[#0D9468] dark:text-emerald-400">
              <FlaskConical className="h-3.5 w-3.5" />
              {t.reader.realWorld}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#475569] dark:text-slate-300">
              {node.application}
            </p>
          </div>
        </div>

        {/* Connected Concepts */}
        <div>
          <div className="flex items-center justify-between text-[10.5px] font-extrabold uppercase tracking-wider text-[#6F7E93] dark:text-slate-400 mb-2">
            <span>{t.reader.connectedConcepts}</span>
            <span>
              {incomingEdges.length} {t.reader.inWord} · {outgoingEdges.length}{" "}
              {t.reader.outWord}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {incomingEdges.map((edge) => {
              const src = vault.nodes.find((n) => n.id === edge.source);
              if (!src) return null;
              const rel = EDGE_RELATIONS[edge.relation];
              const stroke = isDark ? rel.darkStrokeColor : rel.strokeColor;
              return (
                <button
                  type="button"
                  key={edge.id}
                  onClick={() => onSelectNode(src.id)}
                  style={{
                    backgroundColor: isDark ? rel.darkBgHex : rel.bgHex,
                    borderColor: `${stroke}66`,
                    color: isDark ? "#F1F5F9" : "#17233C",
                  }}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold hover:brightness-95 dark:hover:brightness-110 transition-all"
                >
                  <ArrowLeft
                    className="h-3 w-3 shrink-0"
                    style={{ color: stroke }}
                  />
                  <span className="truncate max-w-[160px]">{src.title}</span>
                </button>
              );
            })}
            {outgoingEdges.map((edge) => {
              const tgt = vault.nodes.find((n) => n.id === edge.target);
              if (!tgt) return null;
              const rel = EDGE_RELATIONS[edge.relation];
              const stroke = isDark ? rel.darkStrokeColor : rel.strokeColor;
              return (
                <button
                  type="button"
                  key={edge.id}
                  onClick={() => onSelectNode(tgt.id)}
                  style={{
                    backgroundColor: isDark ? rel.darkBgHex : rel.bgHex,
                    borderColor: `${stroke}66`,
                    color: isDark ? "#F1F5F9" : "#17233C",
                  }}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold hover:brightness-95 dark:hover:brightness-110 transition-all"
                >
                  <ArrowRight
                    className="h-3 w-3 shrink-0"
                    style={{ color: stroke }}
                  />
                  <span className="truncate max-w-[160px]">{tgt.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 1-Click Quick Check Card */}
        {showQuiz && (
          <div className="rounded-xl border border-[#BFDBFE] dark:border-blue-900/60 bg-[#F8FAFC] dark:bg-slate-900 p-3.5 space-y-2">
            <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#2F80ED] dark:text-blue-400">
              {t.reader.quickCheck}
            </div>
            <p className="text-xs font-bold text-[#17233C] dark:text-slate-100">
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
                        message: t.reader.quizRight,
                      });
                    } else {
                      setQuizFeedback({
                        correct: false,
                        message: t.reader.quizWrong,
                      });
                    }
                  }}
                  className="w-full flex items-center justify-between gap-2 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#2F80ED] p-2.5 text-left text-xs text-[#17233C] dark:text-slate-200 transition-colors"
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
                    ? "border-[#A7F3D0] dark:border-emerald-700/60 bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#047857] dark:text-emerald-300"
                    : "border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200"
                }`}
              >
                {quizFeedback.message}
              </div>
            )}
          </div>
        )}

        {/* Personal User Annotation Preview (if saved in Knowledge Library) */}
        {node.userAnnotation && node.userAnnotation.trim() && (
          <div className="rounded-xl border border-[#DDD6FE] dark:border-violet-800/60 bg-[#FAF5FF] dark:bg-violet-950/25 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-violet-300">
              <StickyNote className="h-3.5 w-3.5" />
              {t.reader.personalNote}
            </div>
            <p className="text-xs leading-relaxed text-[#334155] dark:text-slate-200">
              {node.userAnnotation}
            </p>
          </div>
        )}

        {/* References */}
        <div>
          <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#6F7E93] dark:text-slate-400 mb-1">
            {t.reader.references}
          </div>
          <div className="flex items-start gap-2 text-xs font-medium text-[#17233C] dark:text-slate-300">
            <BookOpen className="h-4 w-4 text-[#2F80ED] dark:text-blue-400 shrink-0 mt-0.5" />
            <span>{node.reference}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0F172A] p-4 space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => onExpandNode(node.id)}
          disabled={isExpanding}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] disabled:opacity-50 py-2.5 px-4 text-xs font-bold text-white shadow-sm transition-colors"
        >
          {isExpanding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.reader.expanding}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {t.reader.expandNode}
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onOpenInLibrary(node.id, true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#DDD6FE] dark:border-violet-800/70 bg-[#FAF5FF] dark:bg-violet-950/40 hover:border-[#6D28D9] py-2 px-3 text-xs font-bold text-[#6D28D9] dark:text-violet-300 transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
            {t.reader.editNote}
          </button>
          <button
            type="button"
            onClick={() => onOpenInLibrary(node.id, false)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#2F80ED] py-2 px-3 text-xs font-bold text-[#17233C] dark:text-slate-200 transition-colors"
          >
            <BookMarked className="h-3.5 w-3.5 text-[#2F80ED] dark:text-blue-400" />
            {t.reader.openInLibrary}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setShowQuiz((q) => !q)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#2F80ED] py-2 px-3 text-xs font-bold text-[#17233C] dark:text-slate-200 transition-colors"
          >
            <Zap className="h-3.5 w-3.5 text-[#FFA33A]" />
            {t.reader.quickCheck}
          </button>
          <button
            type="button"
            onClick={() => onMarkMastered(node.id)}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-colors ${
              node.mastered
                ? "bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#047857] dark:text-emerald-300 border border-[#A7F3D0] dark:border-emerald-700/60"
                : "bg-[#EAF2FF] dark:bg-blue-950/60 text-[#2F80ED] dark:text-blue-300 hover:bg-[#DCEAFE] dark:hover:bg-blue-900/60"
            }`}
          >
            <Check className="h-3.5 w-3.5" />
            {node.mastered ? t.reader.masteredCheck : t.reader.markMastered}
          </button>
        </div>
      </div>
    </div>
  );

  if (isMaximized) {
    return (
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#17263C]/45 dark:bg-black/65 backdrop-blur-sm p-3 sm:p-6"
      >
        {modalCard}
      </div>
    );
  }

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute inset-x-2.5 bottom-2.5 top-auto max-h-[82vh] sm:max-h-none sm:inset-x-auto sm:top-3.5 sm:right-3.5 sm:bottom-3.5 sm:w-[400px] z-30 pointer-events-auto flex flex-col"
    >
      {modalCard}
    </div>
  );
}
