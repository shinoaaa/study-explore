import { validateAndBuildGraph } from "@/lib/validator";
import { normalizeVault } from "@/lib/vault-storage";
import { KnowledgeEdge, KnowledgeNode, KnowledgeVault } from "@/types/knowledge";

function createVerifiedVault(
  rawVault: Omit<KnowledgeVault, "validation">,
  favoriteNodeIds: string[] = []
): KnowledgeVault {
  const favSet = new Set(favoriteNodeIds);
  const { nodes, edges, validation } = validateAndBuildGraph(
    rawVault.nodes.map((n) => ({
      ...n,
      isFavorite: favSet.has(n.id),
      origin: n.origin || "ai_generated",
    })),
    rawVault.edges
  );
  return normalizeVault({
    ...rawVault,
    nodes,
    edges,
    validation,
  });
}

const MEDIS_NODES: KnowledgeNode[] = [
  {
    id: "root",
    title: "Sistem Pernapasan Manusia",
    region: "REG-01",
    relationToOrigin: "root",
    difficulty: "Foundation",
    x: 45,
    y: 65,
    explored: true,
    mastered: true,
    summary:
      "Titik awal materi Biologi Kelas XI: ventilasi paru dan pertukaran gas O2/CO2 di alveolus.",
    levels: {
      simple:
        "Bayangkan paru-paru seperti pelabuhan logistik: udara masuk membawa paket oksigen ke dalam darah, dan membuang limbah karbon dioksida keluar tubuh.",
      standard:
        "Sistem organ yang memfasilitasi ventilasi mekanis (inspirasi-ekspirasi) serta pertukaran gas O2 dan CO2 secara difusi pasif pada membran alveolus-kapiler.",
      deep:
        "Sistem pertukaran gas konvektif-difusif yang diatur oleh kemoreseptor pusat di medula oblongata dan badan karotis untuk menjaga homeostasis pH darah serta PaO2/PaCO2.",
    },
    formula: "ΔP_difusi = P_alveolus(O2: 104 mmHg) - P_kapiler(O2: 40 mmHg)",
    application:
      "Dasar pemeriksaan auskultasi suara napas dan interpretasi awal saturasi oksigen pasien di klinik.",
    reference: "Campbell Biology 12th Ed., Ch. 42; OpenStax Biology 2e Ch. 39",
    quickCheck: {
      question:
        "Mengapa oksigen dapat berpindah dari alveolus ke kapiler darah tanpa memerlukan pompa energi ATP?",
      options: [
        {
          text: "Karena tekanan parsial O2 di alveolus lebih tinggi daripada di kapiler darah (difusi pasif)",
          correct: true,
        },
        {
          text: "Karena dinding alveolus memompa molekul O2 secara aktif",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_hb",
    title: "Hemoglobin & Kurva Disosiasi O2 (Efek Bohr)",
    region: "REG-02",
    relationToOrigin: "extension",
    difficulty: "Intermediate",
    x: 345,
    y: 65,
    explored: true,
    mastered: false,
    summary:
      "Mekanisme biokimia-medis pengangkutan O2 oleh eritrosit dan pelepasan O2 di jaringan aktif.",
    levels: {
      simple:
        "Hemoglobin adalah 'mobil kurir' di sel darah merah yang punya 4 kursi khusus untuk menggendong oksigen dari paru-paru lalu menurunkannya tepat di organ yang sedang sibuk bekerja.",
      standard:
        "Protein tetramerik bergugus heme (Fe2+) pada eritrosit yang mengikat 4 molekul O2 secara reversibel. Di jaringan yang asam (banyak CO2), daya ikatnya turun agar O2 mudah dilepas (Efek Bohr).",
      deep:
        "Kooperativitas alosterik menghasilkan kurva disosiasi oksihemoglobin berbentuk sigmoid (P50 ≈ 27 mmHg). Peningkatan [H+], PaCO2, suhu, dan 2,3-BPG menggeser kurva ke kanan.",
    },
    formula: "Hb + 4 O2 ⇌ Hb(O2)4  (Pergeseran kanan oleh ↑CO2, ↑H+, ↑Suhu)",
    application:
      "Konteks Medis: Keracunan gas CO berbahaya karena afinitas CO terhadap Hemoglobin ~200 kali lebih kuat dibanding O2, mengunci Hb menjadi karboksihemoglobin.",
    reference: "OpenStax Biology 2e, Section 39.4; Guyton Physiology Ch. 41",
    quickCheck: {
      question:
        "Mengapa jaringan otot atau organ yang sedang bekerja aktif (pH lebih asam & suhu naik) justru lebih mudah menerima oksigen dari Hemoglobin?",
      options: [
        {
          text: "Karena Efek Bohr menggeser kurva disosiasi sehingga Hemoglobin lebih mudah melepaskan O2",
          correct: true,
        },
        {
          text: "Karena sel darah merah hancur saat melewati jaringan hangat",
          correct: false,
        },
      ],
    },
  },
  {
    id: "n_hipoksia",
    title: "Patofisiologi Hipoksia & Asidosis Respiratorik",
    region: "REG-02",
    relationToOrigin: "application",
    difficulty: "Advanced",
    x: 475,
    y: 165,
    explored: false,
    mastered: false,
    summary: "",
    levels: {
      simple: "",
      standard: "",
      deep: "",
    },
    formula: "",
    application: "",
    reference: "",
    quickCheck: {
      question: "",
      options: [
        {
          text: "Benar",
          correct: true,
        },
        {
          text: "Salah",
          correct: false,
        },
      ],
    },
  },
];

const MEDIS_EDGES: KnowledgeEdge[] = [
  {
    id: "e-med-3",
    source: "root",
    target: "n_hb",
    relation: "extension",
    reason:
      "Menjembatani organ paru-paru dengan sel tubuh: Oksigen yang menembus alveolus membutuhkan molekul Hemoglobin di dalam sel darah merah agar dapat diangkut secara efisien.",
  },
  {
    id: "e-med-5",
    source: "n_hb",
    target: "n_hipoksia",
    relation: "application",
    reason:
      "Penerapan klinis sesuai minat Medis: Gangguan ventilasi atau pengikatan Hb menyebabkan hipoksia jaringan dan ketidakseimbangan asam-basa darah (asidosis).",
  },
];

export const PRESET_VAULTS: KnowledgeVault[] = [
  createVerifiedVault(
    {
      id: "vault-preset-medis",
      name: "Pernapasan × Medis",
      createdAt: "2026-11-12T08:00:00.000Z",
      updatedAt: "2026-11-12T08:00:00.000Z",
      isPreset: true,
      identity: {
        mainInterest: "Dunia Medis & Fisiologi Sel",
        shortDescription:
          "Menghubungkan sistem pernapasan manusia dengan transpor oksigen seluler dan pembacaan klinis.",
        focusQuestion:
          "Bagaimana oksigen dari paru-paru diangkut darah dan digunakan oleh sel tubuh?",
        learningGoal:
          "Memahami mekanisme difusi gas, oksihemoglobin, hingga patofisiologi hipoksia klinik.",
        relatedInterests: ["Biologi Sel", "Klinis & Diagnostik", "Sensor Biomedis"],
        difficultyComfort: "Intermediate",
      },
      inputContext: {
        mode: "mode_a",
        subject: "Biologi (SMA Kelas XI)",
        chapter: "Sistem Pernapasan Manusia",
        subchapters:
          "Organ pernapasan, Mekanisme pernapasan, Pertukaran gas, Gangguan sistem pernapasan",
        interestDomain: "Dunia Medis & Fisiologi Sel",
        targetGoal:
          "Bagaimana oksigen dari paru-paru diangkut darah dan digunakan oleh sel tubuh serta implikasi klinisnya",
      },
      learningSources: [
        {
          id: "src-medis-campbell",
          title: "Campbell Biology — Bab Pertukaran Gas",
          format: "book_chapter",
          chapterOrSection: "Ch. 42: Gas Exchange & Circulation",
          excerptOrNotes:
            "Ventilasi mekanis, difusi alveolus-kapiler (Hukum Fick), kurva disosiasi hemoglobin-oksigen, dan pengikatan O2 oleh Fe2+ pada gugus heme.",
          focusQuestion:
            "Bagaimana gradien tekanan parsial memicu difusi oksigen ke oksihemoglobin?",
          origin: "user_source",
          isFavorite: true,
          createdAt: "2026-11-12T08:00:00.000Z",
          updatedAt: "2026-11-12T08:00:00.000Z",
          linkedNodeIds: ["root", "n_hb"],
        },
      ],
      overview: {
        title: "Sistem Pernapasan Manusia · Medis & Seluler",
        startingRegion: "REG-01",
        summary:
          "Perjalanan oksigen dari ventilasi paru hingga menembus alveolus, berikatan dengan hemoglobin, sampai analisis klinis hipoksia.",
        keyConcepts: [
          "Ventilasi Mekanis (Inspirasi & Ekspirasi)",
          "Difusi Alveolar-Kapiler (Hukum Fick)",
          "Transpor Oksihemoglobin & Efek Bohr",
        ],
        coreFormulaOrPrinciple:
          "Ventilasi Paru → Difusi Alveolus (ΔP O2) → Transpor Hb(O2)4",
        primaryReference: "Campbell Biology 12th Ed. Ch. 42 & OpenStax Biology 2e Ch. 39",
      },
      nodes: MEDIS_NODES,
      edges: MEDIS_EDGES,
    },
    ["root"]
  ),
];
