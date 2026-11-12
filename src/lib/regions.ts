import { EdgeRelationType, RegionCode } from "@/types/knowledge";

export interface RegionDefinition {
  code: RegionCode;
  name: string;
  shortName: string;
  poeArchetype: string;
  description: string;
  badgeClass: string;
  borderClass: string;
  glowColor: string;
  accentHex: string;
  quadrantBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const KNOWLEDGE_REGIONS: Record<RegionCode, RegionDefinition> = {
  "REG-01": {
    code: "REG-01",
    name: "Natural & Life Sciences",
    shortName: "Sains Alam & Hayati",
    poeArchetype: "Origin Quadrant • Biologi, Kimia, Fisika",
    description:
      "Hukum alam, struktur materi, sistem organ, sel, genetika, dan fenomena fisika-kimia.",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    borderClass: "border-emerald-500/40",
    glowColor: "rgba(16, 185, 129, 0.14)",
    accentHex: "#10b981",
    quadrantBox: { x: 16, y: 16, width: 290, height: 245 },
  },
  "REG-02": {
    code: "REG-02",
    name: "Health, Medicine & Performance",
    shortName: "Medis & Fisiologi",
    poeArchetype: "Vitality Quadrant • Kedokteran, Klinis, Olahraga",
    description:
      "Patofisiologi penyakit, homeostatis klinis, onkologi, farmakologi, dan performa fisik atlet.",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    borderClass: "border-rose-500/40",
    glowColor: "rgba(244, 63, 94, 0.14)",
    accentHex: "#f43f5e",
    quadrantBox: { x: 320, y: 16, width: 290, height: 245 },
  },
  "REG-03": {
    code: "REG-03",
    name: "Technology, Computing & AI",
    shortName: "Komputasi & AI",
    poeArchetype: "Arcane Quadrant • Ilmu Komputer, Bioinformatika, Data",
    description:
      "Algoritma, pemodelan data, bioinformatika genomik, sensor pintar, dan kecerdasan buatan.",
    badgeClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    borderClass: "border-indigo-500/40",
    glowColor: "rgba(99, 102, 241, 0.14)",
    accentHex: "#6366f1",
    quadrantBox: { x: 624, y: 16, width: 290, height: 245 },
  },
  "REG-04": {
    code: "REG-04",
    name: "Engineering & Applied Systems",
    shortName: "Rekayasa & Terapan",
    poeArchetype: "Forge Quadrant • Teknik Biomedis, Elektro, Instrumen",
    description:
      "Perancangan instrumen medis, optoelektronika, mekanika fluida, dan rekayasa sistem.",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    borderClass: "border-amber-500/40",
    glowColor: "rgba(245, 158, 11, 0.14)",
    accentHex: "#f59e0b",
    quadrantBox: { x: 16, y: 275, width: 290, height: 245 },
  },
  "REG-05": {
    code: "REG-05",
    name: "Formal Logic & Mathematics",
    shortName: "Matematika & Logika",
    poeArchetype: "Axiom Quadrant • Kalkulus, Biostatistika, Probabilitas",
    description:
      "Persamaan diferensial laju reaksi, termodinamika kuantitatif, dan pemodelan statistik.",
    badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    borderClass: "border-cyan-500/40",
    glowColor: "rgba(6, 182, 212, 0.14)",
    accentHex: "#06b6d4",
    quadrantBox: { x: 320, y: 275, width: 290, height: 245 },
  },
  "REG-06": {
    code: "REG-06",
    name: "Social, Economy & Humanities",
    shortName: "Sosial & Humaniora",
    poeArchetype: "Nexus Quadrant • Kesehatan Masyarakat, Etika, Kebijakan",
    description:
      "Dampak sosial, kebijakan kesehatan publik, bioetika, psikologi belajar, dan ekonomi.",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    borderClass: "border-purple-500/40",
    glowColor: "rgba(168, 85, 247, 0.14)",
    accentHex: "#a855f7",
    quadrantBox: { x: 624, y: 275, width: 290, height: 245 },
  },
};

export interface EdgeRelationDefinition {
  type: EdgeRelationType;
  label: string;
  shortLabel: string;
  strokeColor: string;
  dashArray?: string;
  badgeClass: string;
  description: string;
  visualRule: string;
}

export const EDGE_RELATIONS: Record<EdgeRelationType, EdgeRelationDefinition> = {
  prerequisite: {
    type: "prerequisite",
    label: "Prerequisite (Prasyarat Wajib)",
    shortLabel: "Prerequisite",
    strokeColor: "#fbbf24", // Amber 400
    dashArray: "7,5",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    description:
      "Konsep fondasi yang mutlak harus dipahami terlebih dahulu sebelum konsep target (BR-02).",
    visualRule: "Garis Putus-Putus Berarah (Amber)",
  },
  extension: {
    type: "extension",
    label: "Extension (Pendalaman Materi)",
    shortLabel: "Extension",
    strokeColor: "#818cf8", // Indigo 400
    badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    description:
      "Pendalaman ilmiah langsung dari konsep sebelumnya ke bahasan yang lebih spesifik.",
    visualRule: "Garis Solid Utama (Indigo)",
  },
  application: {
    type: "application",
    label: "Application (Penerapan Nyata)",
    shortLabel: "Application",
    strokeColor: "#34d399", // Emerald 400
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    description:
      "Penerapan konsep teori dalam kasus klinis, olahraga, industri, atau kehidupan sehari-hari.",
    visualRule: "Garis Cabang Terapan (Emerald)",
  },
  related_concept: {
    type: "related_concept",
    label: "Related Concept (Konsep Terkait)",
    shortLabel: "Related",
    strokeColor: "#38bdf8", // Sky 400
    dashArray: "3,4",
    badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    description:
      "Keterkaitan konseptual sejajar yang saling melengkapi namun bukan syarat mutlak (BR-02).",
    visualRule: "Garis Titik-Titik Halus (Cyan)",
  },
  cross_disciplinary: {
    type: "cross_disciplinary",
    label: "Cross-Disciplinary (Lintas Rumpun Ilmu)",
    shortLabel: "Cross-Region",
    strokeColor: "#c084fc", // Purple 400
    dashArray: "10,4,2,4",
    badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    description:
      "Jembatan yang menyeberangkan eksplorasi ke Knowledge Region lain untuk mencegah Filter Bubble (BR-04 & BR-05).",
    visualRule: "Garis Portal Lintas-Region (Ungu)",
  },
};
