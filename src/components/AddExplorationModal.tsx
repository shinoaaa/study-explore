"use client";

import { deriveVaultIdentity } from "@/lib/vault-storage";
import { Language } from "@/lib/i18n";
import {
  ExplanationDepth,
  KnowledgeNode,
  KnowledgeVault,
  NodeOpenInputMode,
} from "@/types/knowledge";
import {
  BookOpen,
  FileText,
  Loader2,
  MessageSquarePlus,
  Sparkles,
  Zap,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

export interface AddExplorationSubmitData {
  targetNodeId?: string;
  parentNodeId?: string;
  nodeTitle: string;
  openMode: NodeOpenInputMode;
  inputTitle: string;
  inputContent: string;
  depth: ExplanationDepth;
}

interface AddExplorationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault: KnowledgeVault;
  targetNode?: KnowledgeNode | null;
  defaultParentNodeId?: string;
  onSubmitExploration: (data: AddExplorationSubmitData) => Promise<void>;
  isLoading: boolean;
  lang: Language;
}

export default function AddExplorationModal({
  isOpen,
  onClose,
  vault,
  targetNode,
  defaultParentNodeId,
  onSubmitExploration,
  isLoading,
  lang,
}: AddExplorationModalProps) {
  const identity = deriveVaultIdentity(vault);
  const isUnlockingExisting = Boolean(targetNode);
  const isFirstNode = vault.nodes.length === 0 && !targetNode;

  const [choiceMode, setChoiceMode] = useState<"direct" | "with_input">(
    "direct"
  );
  const [inputType, setInputType] = useState<
    "custom_prompt" | "user_note" | "book_chapter"
  >("custom_prompt");

  const [nodeTitle, setNodeTitle] = useState("");
  const [parentNodeId, setParentNodeId] = useState<string>("");
  const [inputTitle, setInputTitle] = useState("");
  const [inputContent, setInputContent] = useState("");
  const [depth, setDepth] = useState<ExplanationDepth>("standard");

  useEffect(() => {
    if (!isOpen) return;
    setChoiceMode("direct");
    setInputType("custom_prompt");
    setInputTitle("");
    setInputContent("");
    setDepth("standard");

    if (targetNode) {
      setNodeTitle(targetNode.title);
      setParentNodeId("");
    } else if (vault.nodes.length === 0) {
      setNodeTitle(
        identity.focusQuestion || identity.mainInterest || vault.name
      );
      setParentNodeId("");
    } else {
      setNodeTitle("");
      setParentNodeId(defaultParentNodeId || vault.nodes[0]?.id || "");
    }
  }, [
    isOpen,
    targetNode,
    defaultParentNodeId,
    vault.id,
    vault.name,
    vault.nodes.length,
    identity.focusQuestion,
    identity.mainInterest,
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle =
      (targetNode ? targetNode.title : nodeTitle.trim()) ||
      inputTitle.trim() ||
      identity.mainInterest ||
      vault.name;

    const effectiveOpenMode: NodeOpenInputMode =
      choiceMode === "direct" ? "instant_ai" : inputType;

    await onSubmitExploration({
      targetNodeId: targetNode?.id,
      parentNodeId: !targetNode && parentNodeId ? parentNodeId : undefined,
      nodeTitle: cleanTitle,
      openMode: effectiveOpenMode,
      inputTitle: inputTitle.trim() || cleanTitle,
      inputContent: choiceMode === "direct" ? "" : inputContent.trim(),
      depth,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-[#DFE6F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-7 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#DFE6F0] dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FF] dark:bg-blue-950/80 text-[#2F80ED] dark:text-blue-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#17233C] dark:text-slate-100 truncate">
              {isUnlockingExisting
                ? lang === "en"
                  ? `Open Node: ${targetNode?.title}`
                  : `Buka Node: ${targetNode?.title}`
                : isFirstNode
                  ? lang === "en"
                    ? "Open First Node"
                    : "Buka Node Pertama"
                  : lang === "en"
                    ? "Open New Node"
                    : "Buka Node Baru"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 p-2 text-[#6F7E93] hover:text-[#17233C] dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Topic Title & Parent Node if creating a new node */}
          {!isUnlockingExisting && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className={vault.nodes.length === 0 ? "sm:col-span-2" : ""}>
                <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1.5">
                  {lang === "en" ? "Node Topic" : "Topik Node"} *
                </label>
                <input
                  type="text"
                  required
                  value={nodeTitle}
                  onChange={(e) => setNodeTitle(e.target.value)}
                  placeholder={
                    lang === "en"
                      ? "e.g. Cellular Respiration & ATP"
                      : "mis. Respirasi Seluler & Sintesis ATP"
                  }
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/90 px-3.5 py-2.5 text-xs text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                />
              </div>

              {vault.nodes.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1.5">
                    {lang === "en" ? "Branch From" : "Cabang Dari Node"}
                  </label>
                  <select
                    value={parentNodeId}
                    onChange={(e) => setParentNodeId(e.target.value)}
                    className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/90 px-3 py-2.5 text-xs font-semibold text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                  >
                    {vault.nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* TWO PRIMARY OPTIONS: 1) Langsung Buka vs 2) Tambah Catatan / Materi Dulu */}
          <div className="grid grid-cols-2 gap-2.5 rounded-2xl bg-[#F3F6FC] dark:bg-slate-800/90 p-1.5">
            <button
              type="button"
              onClick={() => setChoiceMode("direct")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-extrabold transition-all ${
                choiceMode === "direct"
                  ? "bg-white dark:bg-[#111827] text-[#2F80ED] dark:text-blue-400 shadow-sm"
                  : "text-[#6F7E93] dark:text-slate-400 hover:text-[#17233C] dark:hover:text-white"
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>{lang === "en" ? "Open Directly" : "Langsung Buka"}</span>
            </button>

            <button
              type="button"
              onClick={() => setChoiceMode("with_input")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-extrabold transition-all ${
                choiceMode === "with_input"
                  ? "bg-white dark:bg-[#111827] text-[#2F80ED] dark:text-blue-400 shadow-sm"
                  : "text-[#6F7E93] dark:text-slate-400 hover:text-[#17233C] dark:hover:text-white"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>
                {lang === "en"
                  ? "Add Note / Material First"
                  : "Tambah Catatan / Materi Dulu"}
              </span>
            </button>
          </div>

          {/* When user selects "Tambah Catatan / Materi Dulu": 3 clean sub-modes (Prompt, Catatan, 1 Chapter Buku) */}
          {choiceMode === "with_input" && (
            <div className="space-y-3.5 rounded-2xl border border-[#DFE6F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/40 p-4">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    {
                      id: "custom_prompt",
                      label: lang === "en" ? "Prompt" : "Prompt",
                      icon: <MessageSquarePlus className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "user_note",
                      label: lang === "en" ? "Note" : "Catatan",
                      icon: <FileText className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "book_chapter",
                      label: lang === "en" ? "1 Book Chapter" : "1 Chapter Buku",
                      icon: <BookOpen className="h-3.5 w-3.5" />,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setInputType(tab.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      inputType === tab.id
                        ? "bg-[#2F80ED] text-white"
                        : "bg-white dark:bg-slate-800 border border-[#DFE6F0] dark:border-slate-700 text-[#6F7E93] dark:text-slate-300"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {inputType === "book_chapter" && (
                <div>
                  <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                    {lang === "en" ? "Chapter / Book Title" : "Judul Bab / Buku"}
                  </label>
                  <input
                    type="text"
                    value={inputTitle}
                    onChange={(e) => setInputTitle(e.target.value)}
                    placeholder={
                      lang === "en"
                        ? "e.g. Campbell Biology — Ch. 9 Cellular Respiration"
                        : "mis. Biologi Campbell — Bab 9 Respirasi Seluler"
                    }
                    className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-[#111827] px-3.5 py-2 text-xs text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#17233C] dark:text-slate-200 mb-1">
                  {inputType === "custom_prompt"
                    ? lang === "en"
                      ? "Prompt / Question for This Node"
                      : "Prompt / Pertanyaan untuk Node Ini"
                    : inputType === "user_note"
                      ? lang === "en"
                        ? "Your Note for This Node"
                        : "Catatan Anda untuk Node Ini"
                      : lang === "en"
                        ? "Chapter Material / Key Concepts"
                        : "Isi Materi / Konsep Kunci Bab"}
                </label>
                <textarea
                  rows={4}
                  required={choiceMode === "with_input"}
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder={
                    inputType === "custom_prompt"
                      ? lang === "en"
                        ? "What specific question or angle should this node focus on?"
                        : "Apa pertanyaan atau fokus yang ingin dibahas pada node ini?"
                      : inputType === "user_note"
                        ? lang === "en"
                          ? "Write your own note or summary to attach to this node..."
                          : "Tulis catatan atau ringkasan Anda untuk node ini..."
                        : lang === "en"
                          ? "Paste chapter summary, subtopics, or key paragraphs for this node..."
                          : "Tempelkan ringkasan bab, subbab, atau poin materi untuk node ini..."
                  }
                  className="w-full rounded-xl border border-[#DFE6F0] dark:border-slate-700 bg-white dark:bg-[#111827] p-3 text-xs text-[#17233C] dark:text-slate-100 focus:border-[#2F80ED] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DFE6F0] dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border border-[#DFE6F0] dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-[#6F7E93] dark:text-slate-300 hover:text-[#17233C] dark:hover:text-white"
            >
              {lang === "en" ? "Cancel" : "Batal"}
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] disabled:opacity-60 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-[#2F80ED]/25 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {lang === "en"
                      ? "Opening & analyzing links..."
                      : "Membuka & menganalisis hubungan..."}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {choiceMode === "direct"
                      ? lang === "en"
                        ? "Open Node Now"
                        : "Langsung Buka Node"
                      : lang === "en"
                        ? "Save Material & Open Node"
                        : "Simpan Materi & Buka Node"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
