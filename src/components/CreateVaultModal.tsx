"use client";

import { ExplorationMode, VaultInputContext } from "@/types/knowledge";
import { BookOpen, Compass, FolderPlus, Loader2, Sparkles, X } from "lucide-react";
import React, { useState } from "react";

interface CreateVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateVault: (vaultName: string, inputContext: VaultInputContext) => Promise<void>;
  isLoading: boolean;
}

export default function CreateVaultModal({
  isOpen,
  onClose,
  onCreateVault,
  isLoading,
}: CreateVaultModalProps) {
  const [mode, setMode] = useState<ExplorationMode>("mode_a");
  const [vaultName, setVaultName] = useState("Vault Fotosintesis & Energi Hijau");
  const [subject, setSubject] = useState("Biologi (SMA Kelas XII)");
  const [chapter, setChapter] = useState("Metabolisme & Fotosintesis");
  const [subchapters, setSubchapters] = useState(
    "Kloroplas & Pigmen Cahaya, Reaksi Terang, Siklus Calvin, Faktor Laju Fotosintesis"
  );
  const [interestDomain, setInterestDomain] = useState(
    "Rekayasa Energi Terbarukan & Bioteknologi"
  );
  const [targetGoal, setTargetGoal] = useState(
    "Memahami bagaimana penangkapan foton cahaya di daun menginspirasi sel surya buatan (artificial photosynthesis)"
  );
  const [motivation, setMotivation] = useState(
    "Ingin menghubungkan materi biologi sel tanaman dengan teknologi energi bersih"
  );

  if (!isOpen) return null;

  const applyQuickTemplate = (tpl: "fotosintesis" | "listrik" | "ai_medis") => {
    if (tpl === "fotosintesis") {
      setMode("mode_a");
      setVaultName("Vault Fotosintesis × Energi Hijau");
      setSubject("Biologi (SMA Kelas XII)");
      setChapter("Metabolisme & Fotosintesis");
      setSubchapters(
        "Kloroplas & Pigmen Cahaya, Reaksi Terang, Siklus Calvin, Faktor Fotosintesis"
      );
      setInterestDomain("Rekayasa Energi Terbarukan & Bioteknologi");
      setTargetGoal("Dari reaksi terang klorofil menuju sel surya bio-inspirasi");
    } else if (tpl === "listrik") {
      setMode("mode_a");
      setVaultName("Vault Elektromagnetisme × Kendaraan Listrik");
      setSubject("Fisika (SMA Kelas XII)");
      setChapter("Medan Magnet & Induksi Elektromagnetik");
      setSubchapters("Fluks Magnetik, Hukum Faraday, Gaya Lorentz, Generator & Motor");
      setInterestDomain("Teknik Otomotif & Kendaraan Listrik (EV)");
      setTargetGoal("Memahami prinsip motor traksi listrik dan regenerative braking");
    } else {
      setMode("mode_b");
      setVaultName("Vault Cara Kerja Neuroplastisitas Otak");
      setInterestDomain("Neurosains, Psikologi Kognitif & AI");
      setTargetGoal("Bagaimana Otak Membentuk Memori & Menginspirasi Neural Network");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0f1624] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Obsidian-Style Knowledge Isolation (BR-01)
              </span>
              <h2 className="text-lg font-bold text-slate-100">
                Buat Knowledge Vault Eksplorasi Baru
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Template Fillers */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Contoh Input Cepat:</span>
          <button
            type="button"
            onClick={() => applyQuickTemplate("fotosintesis")}
            className="rounded-lg border border-slate-700/80 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-300 hover:border-indigo-500/50"
          >
            🌱 Biologi Fotosintesis × Energi Hijau
          </button>
          <button
            type="button"
            onClick={() => applyQuickTemplate("listrik")}
            className="rounded-lg border border-slate-700/80 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-300 hover:border-indigo-500/50"
          >
            ⚡ Fisika Induksi × Mobil Listrik
          </button>
          <button
            type="button"
            onClick={() => applyQuickTemplate("ai_medis")}
            className="rounded-lg border border-slate-700/80 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-300 hover:border-indigo-500/50"
          >
            🧠 Mode B: Neurosains &amp; Neural Network
          </button>
        </div>

        {/* Mode Switcher (Mode A vs Mode B) */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-900/90 p-1.5 border border-slate-800">
          <button
            type="button"
            onClick={() => setMode("mode_a")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all ${
              mode === "mode_a"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Mode A: Dari Materi Kurikulum
          </button>
          <button
            type="button"
            onClick={() => setMode("mode_b")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all ${
              mode === "mode_b"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="h-4 w-4" />
            Mode B: Dari Minat &amp; Tujuan
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nama Knowledge Vault <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={vaultName}
              onChange={(e) => setVaultName(e.target.value)}
              placeholder="Contoh: Vault Biologi Pernapasan Medis"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {mode === "mode_a" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Contoh: Biologi / Fisika / Kimia"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Judul Bab Buku
                  </label>
                  <input
                    type="text"
                    required
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    placeholder="Contoh: Sistem Pernapasan Manusia"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Subbab yang Dipelajari (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  required
                  value={subchapters}
                  onChange={(e) => setSubchapters(e.target.value)}
                  placeholder="Organ pernapasan, Mekanisme pernapasan, Pertukaran gas..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-indigo-300 mb-1">
                Bidang Minat Personal
              </label>
              <input
                type="text"
                required
                value={interestDomain}
                onChange={(e) => setInterestDomain(e.target.value)}
                placeholder="Contoh: Dunia Medis / Fisiologi Olahraga"
                className="w-full rounded-xl border border-indigo-500/40 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-indigo-300 mb-1">
                {mode === "mode_a"
                  ? "Fokus / Pertanyaan Eksplorasi Lanjutan"
                  : "Topik Tujuan yang Ingin Dipahami"}
              </label>
              <input
                type="text"
                required
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                placeholder="Contoh: Bagaimana sel kanker berkembang"
                className="w-full rounded-xl border border-indigo-500/40 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {mode === "mode_b" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Motivasi / Latar Belakang Rasa Ingin Tahu
              </label>
              <input
                type="text"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Contoh: Ingin tahu konsep dasar yang harus dipelajari dari nol"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memetakan Skill Tree Lintas-Region...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Bangun Vault &amp; Petakan Skill Tree
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
