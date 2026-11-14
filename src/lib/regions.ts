import { EdgeRelationType, RegionCode } from "@/types/knowledge";

export interface RegionDefinition {
  code: RegionCode;
  name: string;
  shortName: string;
  poeArchetype: string;
  description: string;
  badgeClass: string;
  borderClass: string;
  tintBg: string;
  glowColor: string;
  accentHex: string;
  darkAccentHex: string;
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
    shortName: "Life Sciences",
    poeArchetype: "Origin Sector · Biologi, Kimia, Fisika",
    description:
      "Hukum alam, struktur materi, sistem organ, sel, genetika, dan fenomena fisika-kimia.",
    badgeClass: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
    borderClass: "border-[#0D9468]/40",
    tintBg: "#ECFDF5",
    glowColor: "rgba(13, 148, 104, 0.16)",
    accentHex: "#0D9468",
    darkAccentHex: "#065F46",
    quadrantBox: { x: 24, y: 24, width: 320, height: 260 },
  },
  "REG-02": {
    code: "REG-02",
    name: "Health, Medicine & Performance",
    shortName: "Health & Medicine",
    poeArchetype: "Vitality Sector · Kedokteran, Klinis, Olahraga",
    description:
      "Patofisiologi penyakit, homeostatis klinis, onkologi, farmakologi, dan performa fisik atlet.",
    badgeClass: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
    borderClass: "border-[#E11D48]/40",
    tintBg: "#FFF1F2",
    glowColor: "rgba(225, 29, 72, 0.14)",
    accentHex: "#E11D48",
    darkAccentHex: "#9F1239",
    quadrantBox: { x: 380, y: 24, width: 320, height: 260 },
  },
  "REG-03": {
    code: "REG-03",
    name: "Technology, Computing & AI",
    shortName: "Tech & AI",
    poeArchetype: "Arcane Sector · Komputasi, Bioinformatika, AI",
    description:
      "Algoritma, pemodelan data, bioinformatika genomik, sensor pintar, dan kecerdasan buatan.",
    badgeClass: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    borderClass: "border-[#2563EB]/40",
    tintBg: "#EFF6FF",
    glowColor: "rgba(37, 99, 235, 0.14)",
    accentHex: "#2563EB",
    darkAccentHex: "#1E40AF",
    quadrantBox: { x: 736, y: 24, width: 320, height: 260 },
  },
  "REG-04": {
    code: "REG-04",
    name: "Engineering & Applied Systems",
    shortName: "Engineering",
    poeArchetype: "Forge Sector · Biomedis, Elektro, Instrumen",
    description:
      "Perancangan instrumen medis, optoelektronika, mekanika fluida, dan rekayasa sistem.",
    badgeClass: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
    borderClass: "border-[#D97706]/40",
    tintBg: "#FFFBEB",
    glowColor: "rgba(217, 119, 6, 0.14)",
    accentHex: "#D97706",
    darkAccentHex: "#92400E",
    quadrantBox: { x: 24, y: 320, width: 320, height: 260 },
  },
  "REG-05": {
    code: "REG-05",
    name: "Formal Logic & Mathematics",
    shortName: "Math & Logic",
    poeArchetype: "Axiom Sector · Kalkulus, Biostatistika, Logika",
    description:
      "Persamaan diferensial laju reaksi, termodinamika kuantitatif, dan pemodelan statistik.",
    badgeClass: "bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]",
    borderClass: "border-[#7C3AED]/40",
    tintBg: "#F5F3FF",
    glowColor: "rgba(124, 58, 237, 0.14)",
    accentHex: "#7C3AED",
    darkAccentHex: "#5B21B6",
    quadrantBox: { x: 380, y: 320, width: 320, height: 260 },
  },
  "REG-06": {
    code: "REG-06",
    name: "Social, Economy & Humanities",
    shortName: "Social & Humanities",
    poeArchetype: "Nexus Sector · Kesehatan Publik, Etika, Ekonomi",
    description:
      "Dampak sosial, kebijakan kesehatan publik, bioetika, psikologi belajar, dan ekonomi.",
    badgeClass: "bg-[#FEFCE8] text-[#A16207] border-[#FEF08A]",
    borderClass: "border-[#B45309]/40",
    tintBg: "#FEFCE8",
    glowColor: "rgba(180, 83, 9, 0.13)",
    accentHex: "#B45309",
    darkAccentHex: "#78350F",
    quadrantBox: { x: 736, y: 320, width: 320, height: 260 },
  },
};

export interface EdgeRelationDefinition {
  type: EdgeRelationType;
  label: string;
  shortLabel: string;
  strokeColor: string;
  bgHex: string;
  dashArray?: string;
  hasArrow: boolean;
  badgeClass: string;
  description: string;
  visualRule: string;
}

export const EDGE_RELATIONS: Record<EdgeRelationType, EdgeRelationDefinition> = {
  prerequisite: {
    type: "prerequisite",
    label: "Prerequisite (Prasyarat Wajib)",
    shortLabel: "Prerequisite",
    strokeColor: "#D97706",
    bgHex: "#FEF3C7",
    dashArray: "7 5",
    hasArrow: true,
    badgeClass: "bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]",
    description:
      "Konsep fondasi yang perlu dipahami terlebih dahulu sebelum melanjutkan ke konsep target.",
    visualRule: "Dashed Arrow (Amber)",
  },
  extension: {
    type: "extension",
    label: "Extension (Pendalaman Materi)",
    shortLabel: "Extension",
    strokeColor: "#4F46E5",
    bgHex: "#EEF2FF",
    hasArrow: true,
    badgeClass: "bg-[#EEF2FF] text-[#3730A3] border-[#C7D2FE]",
    description:
      "Pendalaman ilmiah langsung dari konsep sebelumnya ke bahasan yang lebih spesifik.",
    visualRule: "Solid Line (Indigo)",
  },
  application: {
    type: "application",
    label: "Application (Penerapan Nyata)",
    shortLabel: "Application",
    strokeColor: "#059669",
    bgHex: "#D1FAE5",
    dashArray: "12 4 2 4",
    hasArrow: true,
    badgeClass: "bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7]",
    description:
      "Penerapan konsep teori dalam kasus klinis, olahraga, industri, atau kehidupan sehari-hari.",
    visualRule: "Dash-Dot Line (Emerald)",
  },
  related_concept: {
    type: "related_concept",
    label: "Related Concept (Konsep Terkait)",
    shortLabel: "Related",
    strokeColor: "#0891B2",
    bgHex: "#CFFAFE",
    dashArray: "2 6",
    hasArrow: false,
    badgeClass: "bg-[#CFFAFE] text-[#155E75] border-[#67E8F9]",
    description:
      "Keterkaitan konseptual sejajar yang saling melengkapi namun dapat dipelajari fleksibel tanpa syarat urutan.",
    visualRule: "Dotted Bidir (Cyan)",
  },
  cross_disciplinary: {
    type: "cross_disciplinary",
    label: "Cross-Disciplinary (Lintas Rumpun Ilmu)",
    shortLabel: "Cross-Region",
    strokeColor: "#C026D3",
    bgHex: "#FAE8FF",
    hasArrow: true,
    badgeClass: "bg-[#FAE8FF] text-[#86198F] border-[#F0ABFC]",
    description:
      "Jembatan eksplorasi menuju rumpun ilmu lain agar pemahaman berkembang lebih luas dan multidisiplin.",
    visualRule: "Curved Portal (Magenta)",
  },
};
