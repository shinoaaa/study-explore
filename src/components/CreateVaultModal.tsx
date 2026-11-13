"use client";

import { BooksStackVector } from "@/components/Illustrations";
import { ExplorationMode, VaultInputContext } from "@/types/knowledge";
import { BookOpen, Compass, Loader2, Sparkles, X } from "lucide-react";
import React, { useState } from "react";

interface CreateVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateVault: (
    vaultName: string,
    inputContext: VaultInputContext
  ) => Promise<void>;
  isLoading: boolean;
}

export default function CreateVaultModal({
  isOpen,
  onClose,
  onCreateVault,
  isLoading,
}: CreateVaultModalProps) {
  const [mode, setMode] = useState<ExplorationMode>("mode_a");
  const [vaultName, setVaultName] = useState("Fotosintesis × Energi Hijau");
  const [subject, setSubject] = useState("Biologi (SMA Kelas XII)");
  const [chapter, setChapter] = useState("Metabolisme & Fotosintesis");
  const [subchapters, setSubchapters] = useState(
    "Kloroplas & Pigmen Cahaya, Reaksi Terang, Siklus Calvin, Faktor Laju"
  );
  const [interestDomain, setInterestDomain] = useState(
    "Rekayasa Energi Terbarukan & Bioteknologi"
  );
  const [targetGoal, setTargetGoal] = useState(
    "Memahami bagaimana penangkapan foton cahaya di daun menginspirasi sel surya buatan"
  );
  const [motivation, setMotivation] = useState(
    "Ingin menghubungkan biologi sel tanaman dengan teknologi energi bersih"
  );

  if (!isOpen) return null;

  const applyQuickTemplate = (tpl: "fotosintesis" | "listrik" | "ai_medis") => {
    if (tpl === "fotosintesis") {
      setMode("mode_a");
      setVaultName("Fotosintesis × Energi Hijau");
      setSubject("Biologi (SMA Kelas XII)");
      setChapter("Metabolisme & Fotosintesis");
      setSubchapters(
        "Kloroplas & Pigmen Cahaya, Reaksi Terang, Siklus Calvin, Faktor Fotosintesis"
      );
      setInterestDomain("Rekayasa Energi Terbarukan & Bioteknologi");
      setTargetGoal("Dari reaksi terang klorofil menuju sel surya bio-inspirasi");
    } else if (tpl === "listrik") {
      setMode("mode_a");
      setVaultName("Elektromagnetisme × Kendaraan Listrik");
      setSubject("Fisika (SMA Kelas XII)");
      setChapter("Medan Magnet & Induksi Elektromagnetik");
      setSubchapters(
        "Fluks Magnetik, Hukum Faraday, Gaya Lorentz, Generator & Motor"
      );
      setInterestDomain("Teknik Otomotif & Kendaraan Listrik (EV)");
      setTargetGoal(
        "Memahami prinsip motor traksi listrik dan regenerative braking"
      );
    } else {
      setMode("mode_b");
      setVaultName("Neuroplastisitas & Neural Networks");
      setInterestDomain("Neurosains, Psikologi Kognitif & AI");
      setTargetGoal(
        "Bagaimana Otak Membentuk Memori & Menginspirasi Neural Network"
      );
      setMotivation(
        "Ingin tahu prasyarat dari sel saraf (neuron) dan sinapsis hingga arsitektur Deep Learning"
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultName.trim()) return;
    await onCreateVault(vaultName.trim(), {
      mode,
      subject: mode === "mode_a" ? subject : undefined,
      chapter: mode === "mode_a" ? chapter : undefined,
      subchapters: mode === "mode_a" ? subchapters : undefined,
      interestDomain,
      targetGoal,
      motivation: mode === "mode_b" ? motivation : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17263C]/45 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl border border-[#DFE6F0] bg-white p-6 shadow-2xl">
        {/* Header with Transparent Vector Books Illustration */}
        <div className="flex items-center justify-between gap-4 border-b border-[#DFE6F0] pb-4">
          <div>
            <span className="inline-flex rounded-full bg-[#EAF2FF] px-3 py-0.5 text-[11px] font-bold text-[#2F80ED]">
              Obsidian-Style Isolated Workspace (BR-01)
            </span>
            <h2 className="mt-1.5 text-2xl font-extrabold text-[#17233C]">
              Create New Vault
            </h2>
            <p className="text-xs text-[#6F7E93]">
              Unified exploration form — start from learning material (Mode A) or personal curiosity (Mode B).
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="hidden sm:block">
              <BooksStackVector className="w-32 h-20" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#DFE6F0] bg-white p-2 text-[#6F7E93] hover:bg-[#F3F6FC] hover:text-[#17233C]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Templates */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#6F7E93]">
            Quick Presets:
          </span>
          <button
            type="button"
            onClick={() => applyQuickTemplate("fotosintesis")}
            className="rounded-full border border-[#DFE6F0] bg-[#F3F6FC] hover:border-[#2F80ED] px-3 py-1 text-xs font-semibold text-[#17233C]"
          >
            Biologi Fotosintesis × Energi
          </button>
          <button
            type="button"
            onClick={() => applyQuickTemplate("listrik")}
            className="rounded-full border border-[#DFE6F0] bg-[#F3F6FC] hover:border-[#2F80ED] px-3 py-1 text-xs font-semibold text-[#17233C]"
          >
            Fisika Induksi × EV
          </button>
          <button
            type="button"
            onClick={() => applyQuickTemplate("ai_medis")}
            className="rounded-full border border-[#DFE6F0] bg-[#F3F6FC] hover:border-[#2F80ED] px-3 py-1 text-xs font-semibold text-[#17233C]"
          >
            Mode B: Neurosains &amp; AI
          </button>
        </div>

        {/* Dual Mode Switcher Cards */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("mode_a")}
            className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
              mode === "mode_a"
                ? "border-[#2F80ED] bg-[#EAF2FF]/60 ring-2 ring-[#2F80ED]/15"
                : "border-[#DFE6F0] bg-white hover:bg-[#F8FAFC]"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                mode === "mode_a"
                  ? "bg-[#2F80ED] text-white"
                  : "bg-[#F3F6FC] text-[#6F7E93]"
              }`}
            >
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-[#17233C]">
                  From Material
                </span>
                <span className="rounded-full bg-[#2F80ED] px-2 py-0.5 text-[10px] font-bold text-white">
                  Mode A
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#6F7E93]">
                Start from textbook subject, chapter &amp; subchapters.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode("mode_b")}
            className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
              mode === "mode_b"
                ? "border-[#2F80ED] bg-[#EAF2FF]/60 ring-2 ring-[#2F80ED]/15"
                : "border-[#DFE6F0] bg-white hover:bg-[#F8FAFC]"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                mode === "mode_b"
                  ? "bg-[#2F80ED] text-white"
                  : "bg-[#F3F6FC] text-[#6F7E93]"
              }`}
            >
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-[#17233C]">
                  From Interest
                </span>
                <span className="rounded-full bg-[#FFA33A] px-2 py-0.5 text-[10px] font-bold text-[#3A2200]">
                  Mode B
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#6F7E93]">
                Start from curiosity, questions, and learning goals.
              </p>
            </div>
          </button>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#17233C] mb-1">
              Vault Name <span className="text-[#D95C5C]">*</span>
            </label>
            <input
              type="text"
              required
              value={vaultName}
              onChange={(e) => setVaultName(e.target.value)}
              className="w-full rounded-xl border border-[#DFE6F0] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#17233C] focus:border-[#2F80ED] focus:bg-white focus:outline-none"
            />
          </div>

          {mode === "mode_a" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17233C] mb-1">
                    Subject / Domain
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl border border-[#DFE6F0] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#17233C] focus:border-[#2F80ED] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17233C] mb-1">
                    Chapter Title
                  </label>
                  <input
                    type="text"
                    required
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    className="w-full rounded-xl border border-[#DFE6F0] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#17233C] focus:border-[#2F80ED] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1">
                  Subchapters (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={subchapters}
                  onChange={(e) => setSubchapters(e.target.value)}
                  className="w-full rounded-xl border border-[#DFE6F0] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#17233C] focus:border-[#2F80ED] focus:bg-white focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#2F80ED] mb-1">
                Personal Interest Domain
              </label>
              <input
                type="text"
                required
                value={interestDomain}
                onChange={(e) => setInterestDomain(e.target.value)}
                className="w-full rounded-xl border border-[#BFDBFE] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#17233C] focus:border-[#2F80ED] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2F80ED] mb-1">
                {mode === "mode_a"
                  ? "Exploration Question / Focus"
                  : "Target Topic to Understand"}
              </label>
              <input
                type="text"
                required
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                className="w-full rounded-xl border border-[#BFDBFE] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#17233C] focus:border-[#2F80ED] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {mode === "mode_b" && (
            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Curiosity / Motivation
              </label>
              <input
                type="text"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                className="w-full rounded-xl border border-[#DFE6F0] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#17233C] focus:border-[#2F80ED] focus:bg-white focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DFE6F0]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#DFE6F0] bg-white px-4 py-2 text-xs font-bold text-[#6F7E93] hover:bg-[#F3F6FC] hover:text-[#17233C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-[#2F80ED] hover:bg-[#236BCB] disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mapping Cross-Region Skill Tree...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Knowledge Vault →
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
