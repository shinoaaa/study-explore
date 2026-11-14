import { EdgeRelationType, RegionCode } from "@/types/knowledge";

export interface RegionDefinition {
  code: RegionCode;
  name: string;
  nameId: string;
  shortName: string;
  shortNameId: string;
  description: string;
  descriptionEn: string;
  badgeClass: string;
  borderClass: string;
  tintBg: string;
  darkTintBg: string;
  glowColor: string;
  accentHex: string;
  darkAccentHex: string;
  darkPillTextHex: string;
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
    nameId: "Ilmu Alam & Hayati",
    shortName: "Life Sciences",
    shortNameId: "Alam & Hayati",
    description:
      "Hukum alam, struktur materi, sistem organ, sel, genetika, dan fenomena fisika-kimia.",
    descriptionEn:
      "Laws of nature, matter, organ systems, cells, genetics, and physical-chemical phenomena.",
    badgeClass:
      "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70",
    borderClass: "border-[#0D9468]/40",
    tintBg: "#ECFDF5",
    darkTintBg: "#064E3B",
    glowColor: "rgba(13, 148, 104, 0.16)",
    accentHex: "#0D9468",
    darkAccentHex: "#065F46",
    darkPillTextHex: "#6EE7B7",
    quadrantBox: { x: 24, y: 24, width: 320, height: 260 },
  },
  "REG-02": {
    code: "REG-02",
    name: "Health, Medicine & Performance",
    nameId: "Kesehatan, Medis & Performa",
    shortName: "Health & Medicine",
    shortNameId: "Kesehatan & Medis",
    description:
      "Patofisiologi penyakit, homeostasis klinis, onkologi, farmakologi, dan performa fisik.",
    descriptionEn:
      "Disease mechanisms, clinical homeostasis, oncology, pharmacology, and physical performance.",
    badgeClass:
      "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3] dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70",
    borderClass: "border-[#E11D48]/40",
    tintBg: "#FFF1F2",
    darkTintBg: "#4C0519",
    glowColor: "rgba(225, 29, 72, 0.14)",
    accentHex: "#E11D48",
    darkAccentHex: "#9F1239",
    darkPillTextHex: "#FDA4AF",
    quadrantBox: { x: 380, y: 24, width: 320, height: 260 },
  },
  "REG-03": {
    code: "REG-03",
    name: "Technology, Computing & AI",
    nameId: "Teknologi, Komputasi & AI",
    shortName: "Tech & AI",
    shortNameId: "Teknologi & AI",
    description:
      "Algoritma, pemodelan data, bioinformatika genomik, sensor pintar, dan kecerdasan buatan.",
    descriptionEn:
      "Algorithms, data modeling, genomic bioinformatics, smart sensors, and artificial intelligence.",
    badgeClass:
      "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE] dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/70",
    borderClass: "border-[#2563EB]/40",
    tintBg: "#EFF6FF",
    darkTintBg: "#172554",
    glowColor: "rgba(37, 99, 235, 0.14)",
    accentHex: "#2563EB",
    darkAccentHex: "#1E40AF",
    darkPillTextHex: "#93C5FD",
    quadrantBox: { x: 736, y: 24, width: 320, height: 260 },
  },
  "REG-04": {
    code: "REG-04",
    name: "Engineering & Applied Systems",
    nameId: "Rekayasa & Sistem Terapan",
    shortName: "Engineering",
    shortNameId: "Rekayasa & Teknik",
    description:
      "Perancangan instrumen medis, optoelektronika, mekanika fluida, dan rekayasa sistem.",
    descriptionEn:
      "Medical instrumentation, optoelectronics, fluid mechanics, and applied systems engineering.",
    badgeClass:
      "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70",
    borderClass: "border-[#D97706]/40",
    tintBg: "#FFFBEB",
    darkTintBg: "#451A03",
    glowColor: "rgba(217, 119, 6, 0.14)",
    accentHex: "#D97706",
    darkAccentHex: "#92400E",
    darkPillTextHex: "#FCD34D",
    quadrantBox: { x: 24, y: 320, width: 320, height: 260 },
  },
  "REG-05": {
    code: "REG-05",
    name: "Formal Logic & Mathematics",
    nameId: "Logika & Matematika",
    shortName: "Math & Logic",
    shortNameId: "Matematika & Logika",
    description:
      "Persamaan diferensial laju reaksi, termodinamika kuantitatif, dan pemodelan statistik.",
    descriptionEn:
      "Differential rate equations, quantitative thermodynamics, and statistical modeling.",
    badgeClass:
      "bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE] dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/70",
    borderClass: "border-[#7C3AED]/40",
    tintBg: "#F5F3FF",
    darkTintBg: "#2E1065",
    glowColor: "rgba(124, 58, 237, 0.14)",
    accentHex: "#7C3AED",
    darkAccentHex: "#5B21B6",
    darkPillTextHex: "#C4B5FD",
    quadrantBox: { x: 380, y: 320, width: 320, height: 260 },
  },
  "REG-06": {
    code: "REG-06",
    name: "Social, Economy & Humanities",
    nameId: "Sosial, Ekonomi & Humaniora",
    shortName: "Social & Humanities",
    shortNameId: "Sosial & Humaniora",
    description:
      "Dampak sosial, kebijakan kesehatan publik, bioetika, psikologi belajar, dan ekonomi.",
    descriptionEn:
      "Social impact, public health policy, bioethics, learning psychology, and economics.",
    badgeClass:
      "bg-[#FEFCE8] text-[#A16207] border-[#FEF08A] dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800/70",
    borderClass: "border-[#B45309]/40",
    tintBg: "#FEFCE8",
    darkTintBg: "#422006",
    glowColor: "rgba(180, 83, 9, 0.13)",
    accentHex: "#B45309",
    darkAccentHex: "#78350F",
    darkPillTextHex: "#FDE047",
    quadrantBox: { x: 736, y: 320, width: 320, height: 260 },
  },
};

export interface EdgeRelationDefinition {
  type: EdgeRelationType;
  label: string;
  shortLabel: string;
  shortLabelId: string;
  strokeColor: string;
  darkStrokeColor: string;
  bgHex: string;
  darkBgHex: string;
  dashArray?: string;
  hasArrow: boolean;
  badgeClass: string;
  description: string;
  descriptionEn: string;
  visualRule: string;
}

export const EDGE_RELATIONS: Record<EdgeRelationType, EdgeRelationDefinition> = {
  prerequisite: {
    type: "prerequisite",
    label: "Prerequisite",
    shortLabel: "Prerequisite",
    shortLabelId: "Prasyarat",
    strokeColor: "#D97706",
    darkStrokeColor: "#FBBF24",
    bgHex: "#FEF3C7",
    darkBgHex: "#451A03",
    dashArray: "7 5",
    hasArrow: true,
    badgeClass:
      "bg-[#FEF3C7] text-[#92400E] border-[#FCD34D] dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    description:
      "Konsep dasar yang perlu dipahami dulu sebelum lanjut ke topik berikutnya.",
    descriptionEn:
      "Foundational idea worth understanding before moving into the next topic.",
    visualRule: "Dashed Arrow (Amber)",
  },
  extension: {
    type: "extension",
    label: "Extension",
    shortLabel: "Extension",
    shortLabelId: "Pendalaman",
    strokeColor: "#4F46E5",
    darkStrokeColor: "#818CF8",
    bgHex: "#EEF2FF",
    darkBgHex: "#1E1B4B",
    hasArrow: true,
    badgeClass:
      "bg-[#EEF2FF] text-[#3730A3] border-[#C7D2FE] dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
    description:
      "Pendalaman langsung dari konsep sebelumnya ke bahasan yang lebih spesifik.",
    descriptionEn:
      "Direct deeper dive into how the previous concept works.",
    visualRule: "Solid Line (Indigo)",
  },
  application: {
    type: "application",
    label: "Application",
    shortLabel: "Application",
    shortLabelId: "Penerapan",
    strokeColor: "#059669",
    darkStrokeColor: "#34D399",
    bgHex: "#D1FAE5",
    darkBgHex: "#064E3B",
    dashArray: "12 4 2 4",
    hasArrow: true,
    badgeClass:
      "bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    description:
      "Penerapan teori di kasus medis, olahraga, industri, atau kehidupan sehari-hari.",
    descriptionEn:
      "How the theory shows up in medicine, sports, industry, or everyday life.",
    visualRule: "Dash-Dot Line (Emerald)",
  },
  related_concept: {
    type: "related_concept",
    label: "Related Concept",
    shortLabel: "Related",
    shortLabelId: "Konsep Terkait",
    strokeColor: "#0891B2",
    darkStrokeColor: "#22D3EE",
    bgHex: "#CFFAFE",
    darkBgHex: "#083344",
    dashArray: "2 6",
    hasArrow: false,
    badgeClass:
      "bg-[#CFFAFE] text-[#155E75] border-[#67E8F9] dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800",
    description:
      "Topik sejajar yang saling melengkapi dan bisa dipelajari tanpa urutan kaku.",
    descriptionEn:
      "Closely related idea that complements this topic without a strict order.",
    visualRule: "Dotted Bidir (Cyan)",
  },
  cross_disciplinary: {
    type: "cross_disciplinary",
    label: "Cross-Disciplinary",
    shortLabel: "Cross-Region",
    shortLabelId: "Lintas Bidang",
    strokeColor: "#C026D3",
    darkStrokeColor: "#E879F9",
    bgHex: "#FAE8FF",
    darkBgHex: "#4A044E",
    hasArrow: true,
    badgeClass:
      "bg-[#FAE8FF] text-[#86198F] border-[#F0ABFC] dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:border-fuchsia-800",
    description:
      "Jembatan ke bidang ilmu lain supaya cara pandangmu makin luas.",
    descriptionEn:
      "Bridge into another field so ideas connect across disciplines.",
    visualRule: "Curved Portal (Magenta)",
  },
};

/**
 * Infer a starting knowledge region from natural-language topic or interest keywords.
 */
export function inferStartingRegion(text: string): RegionCode {
  const lower = text.toLowerCase();
  if (
    /medis|kedokteran|kanker|penyakit|klinis|kesehatan|olahraga|atlet|fisiologi|obat|farmasi|gizi|medicine|clinical|cancer|health|sport|oncology|cardio|neuro/.test(
      lower
    )
  ) {
    return "REG-02";
  }
  if (
    /komputer|informatika|pemrograman|coding|ai|data|algoritma|software|jaringan|siber|web|computer|machine learning|neural|deep learning|programming|algorithm|tech/.test(
      lower
    )
  ) {
    return "REG-03";
  }
  if (
    /teknik|rekayasa|mesin|elektro|robot|industri|sipil|iot|sensor|otomotif|energi terbarukan|engineering|solar|battery|motor|electric|robotics|clean energy|renewable/.test(
      lower
    )
  ) {
    return "REG-04";
  }
  if (
    /matematika|kalkulus|aljabar|statistika|probabilitas|geometri|logika|trigonometri|diskrit|math|calculus|algebra|statistics|probability|logic|geometry/.test(
      lower
    )
  ) {
    return "REG-05";
  }
  if (
    /ekonomi|sosial|sejarah|psikologi|hukum|politik|akuntansi|bisnis|manajemen|geografi|sosiologi|economics|psychology|history|policy|law|sociology|cognitive/.test(
      lower
    )
  ) {
    return "REG-06";
  }
  return "REG-01";
}
