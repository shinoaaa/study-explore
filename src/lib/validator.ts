import { KNOWLEDGE_REGIONS } from "@/lib/regions";
import {
  DifficultyLevel,
  EdgeRelationType,
  KnowledgeEdge,
  KnowledgeNode,
  RegionCode,
  ValidationReport,
} from "@/types/knowledge";

const VALID_REGIONS: RegionCode[] = [
  "REG-01",
  "REG-02",
  "REG-03",
  "REG-04",
  "REG-05",
  "REG-06",
];

const VALID_RELATIONS: EdgeRelationType[] = [
  "prerequisite",
  "extension",
  "application",
  "related_concept",
  "cross_disciplinary",
];

const VALID_DIFFICULTIES: DifficultyLevel[] = [
  "Foundation",
  "Basic",
  "Intermediate",
  "Advanced",
];

export const NODE_CARD_W = 198;
export const NODE_CARD_H = 74;
export const NODE_CIRCLE_R = 22;
export const NODE_CALLOUT_W = 172;
export const NODE_CALLOUT_H = 38;

function deterministicHash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export interface RegionBounds {
  region: RegionCode;
  x: number;
  y: number;
  width: number;
  height: number;
  nodeCount: number;
}

const REGION_ROWS: RegionCode[][] = [
  ["REG-01", "REG-02", "REG-03"],
  ["REG-04", "REG-05", "REG-06"],
];

/**
 * Menghitung tata letak Region & posisi pusat setiap node (NFR-09):
 * 1) Menjamin 100% node berada secara matematis di dalam batas Region-nya.
 * 2) Menjamin nol tumpukan (zero overlap) antar-node maupun antar-Region meski node bertambah tanpa batas (NFR-11).
 * 3) Region otomatis membesar ke arah luar ketika node bertambah (+ Expand).
 */
export function layoutGraphWithRegionContainment(nodes: KnowledgeNode[]): {
  nodes: KnowledgeNode[];
  regionBounds: RegionBounds[];
  canvasWidth: number;
  canvasHeight: number;
} {
  const byRegion = new Map<RegionCode, KnowledgeNode[]>();
  VALID_REGIONS.forEach((rc) => byRegion.set(rc, []));

  for (const node of nodes) {
    const safeReg = VALID_REGIONS.includes(node.region) ? node.region : "REG-01";
    byRegion.get(safeReg)!.push({ ...node, region: safeReg });
  }

  const cellW = 196;
  const cellH = 104;
  const gapX = 38;
  const gapY = 34;
  const padX = 48;
  const padTop = 88;
  const padBot = 42;
  const sectorChannel = 68;
  const outerMargin = 36;

  // Hitung dimensi intrinsik setiap Region yang berisi minimal 1 node
  const sectorSizes = new Map<
    RegionCode,
    { w: number; h: number; cols: number; list: KnowledgeNode[] }
  >();

  for (const rc of VALID_REGIONS) {
    const rawList = byRegion.get(rc) || [];
    if (rawList.length === 0) continue;

    // Sort root first, then preserve existing spatial stability (y, then x)
    const list = [...rawList].sort((a, b) => {
      const aRoot = a.relationToOrigin === "root" || a.id === "root" ? 0 : 1;
      const bRoot = b.relationToOrigin === "root" || b.id === "root" ? 0 : 1;
      if (aRoot !== bRoot) return aRoot - bRoot;
      if (Math.abs((a.y || 0) - (b.y || 0)) > 24) return (a.y || 0) - (b.y || 0);
      return (a.x || 0) - (b.x || 0);
    });

    const cols = list.length <= 1 ? 1 : list.length <= 4 ? 2 : 3;
    const rows = Math.ceil(list.length / cols);
    const gridW = cols * cellW + (cols - 1) * gapX;
    const gridH = rows * cellH + (rows - 1) * gapY;

    // Lebar minimal cukup untuk pill header Region + node count + callout label
    const minHeaderWidth = 320;
    const w = Math.max(minHeaderWidth, gridW + padX * 2);
    const h = Math.max(210, gridH + padTop + padBot);

    sectorSizes.set(rc, { w, h, cols, list });
  }

  // Susun baris demi baris (Row 1: REG-01..03, Row 2: REG-04..06) agar Region membesar bebas tanpa saling menabrak
  let currentY = outerMargin;
  const placedNodes: KnowledgeNode[] = [];
  const regionBounds: RegionBounds[] = [];
  let maxRight = 840;

  for (const rowRegs of REGION_ROWS) {
    const activeInRow = rowRegs.filter((rc) => sectorSizes.has(rc));
    if (activeInRow.length === 0) continue;

    let currentX = outerMargin;
    let rowMaxH = 0;

    for (const rc of activeInRow) {
      const spec = sectorSizes.get(rc)!;
      const boxX = currentX;
      const boxY = currentY;

      regionBounds.push({
        region: rc,
        x: boxX,
        y: boxY,
        width: spec.w,
        height: spec.h,
        nodeCount: spec.list.length,
      });

      const innerGridW = spec.cols * cellW + (spec.cols - 1) * gapX;
      const startX = boxX + (spec.w - innerGridW) / 2 + cellW / 2;
      const startY = boxY + padTop + cellH / 2;

      const minCx = boxX + Math.max(padX, NODE_CALLOUT_W / 2 + 14);
      const maxCx = boxX + spec.w - Math.max(padX, NODE_CALLOUT_W / 2 + 14);
      const minCy = boxY + padTop + 18;
      const maxCy = boxY + spec.h - padBot;

      spec.list.forEach((node, idx) => {
        const col = idx % spec.cols;
        const row = Math.floor(idx / spec.cols);
        const hVal = deterministicHash(`${node.id}:${node.title}`);
        // Organic dynamic wave offset ("maju mundur dikit") so nodes & callout boxes sit on staggered diagonal bands
        const staggerX =
          (row % 2 === 1 ? 16 : -12) + (((hVal % 5) - 2) * 6);
        const staggerY =
          (col % 2 === 1 ? -18 : 16) + ((((hVal >> 4) % 5) - 2) * 5);

        const rawCx = startX + col * (cellW + gapX) + staggerX;
        const rawCy = startY + row * (cellH + gapY) + staggerY;

        const cx = Math.round(
          Math.max(minCx, Math.min(maxCx, rawCx))
        );
        const cy = Math.round(
          Math.max(minCy, Math.min(maxCy, rawCy))
        );

        placedNodes.push({
          ...node,
          region: rc,
          x: cx,
          y: cy,
        });
      });

      currentX += spec.w + sectorChannel;
      rowMaxH = Math.max(rowMaxH, spec.h);
    }

    maxRight = Math.max(maxRight, currentX - sectorChannel + outerMargin);
    currentY += rowMaxH + sectorChannel;
  }

  // Jaga urutan node sesuai array awal agar seleksi indeks tetap stabil
  const coordMap = new Map(placedNodes.map((n) => [n.id, n]));
  const orderedNodes = nodes.map((n) => coordMap.get(n.id) || n);

  return {
    nodes: orderedNodes,
    regionBounds,
    canvasWidth: Math.max(960, maxRight),
    canvasHeight: Math.max(580, currentY - sectorChannel + outerMargin + 24),
  };
}

/**
 * Menempatkan seluruh node ke dalam batas wilayah Knowledge Region-nya (NFR-09)
 */
export function assignRegionCoordinates(nodes: KnowledgeNode[]): KnowledgeNode[] {
  return layoutGraphWithRegionContainment(nodes).nodes;
}

/**
 * Memeriksa apakah relasi membentuk siklus (Directed Acyclic Graph Guard - BR-06)
 */
function hasCycleInEdges(
  nodeIds: string[],
  edges: KnowledgeEdge[]
): { acyclic: boolean; sanitizedEdges: KnowledgeEdge[] } {
  const adj = new Map<string, string[]>();
  nodeIds.forEach((id) => adj.set(id, []));

  const sanitizedEdges: KnowledgeEdge[] = [];
  let hadCycle = false;

  const canReach = (
    start: string,
    target: string,
    visited = new Set<string>()
  ): boolean => {
    if (start === target) return true;
    visited.add(start);
    const neighbors = adj.get(start) || [];
    for (const nxt of neighbors) {
      if (!visited.has(nxt) && canReach(nxt, target, visited)) {
        return true;
      }
    }
    return false;
  };

  for (const edge of edges) {
    if (edge.source === edge.target) {
      hadCycle = true;
      continue;
    }
    if (canReach(edge.target, edge.source)) {
      hadCycle = true;
      continue;
    }
    adj.get(edge.source)?.push(edge.target);
    sanitizedEdges.push(edge);
  }

  return { acyclic: !hadCycle, sanitizedEdges };
}

/**
 * Graph Builder & Validation Engine (BR-02, BR-03, BR-04, BR-06, NFR-09)
 */
export function validateAndBuildGraph(
  rawNodes: KnowledgeNode[],
  rawEdges: KnowledgeEdge[]
): {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  validation: ValidationReport;
} {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const uniqueNodes: KnowledgeNode[] = [];
  let duplicateNodesRemoved = 0;

  for (const n of rawNodes) {
    const normTitle = (n.title || "").trim().toLowerCase();
    if (!n.id || !normTitle || seenIds.has(n.id) || seenTitles.has(normTitle)) {
      duplicateNodesRemoved++;
      continue;
    }
    seenIds.add(n.id);
    seenTitles.add(normTitle);

    const safeRegion: RegionCode = VALID_REGIONS.includes(n.region)
      ? n.region
      : "REG-01";
    const safeDiff: DifficultyLevel = VALID_DIFFICULTIES.includes(n.difficulty)
      ? n.difficulty
      : "Intermediate";

    uniqueNodes.push({
      ...n,
      region: safeRegion,
      difficulty: safeDiff,
      summary: n.summary || n.levels?.standard || "Konsep eksplorasi terhubung.",
      levels: {
        simple:
          n.levels?.simple ||
          "Penjelasan analogi sederhana untuk memudahkan pemahaman konsep dasar.",
        standard:
          n.levels?.standard ||
          n.summary ||
          "Penjelasan konsep sesuai standar materi pembelajaran.",
        deep:
          n.levels?.deep ||
          "Penjelasan mekanisme ilmiah mendalam beserta keterkaitan sistemik.",
      },
      formula: n.formula || "Prinsip Konseptual Terkait",
      application:
        n.application || "Penerapan konsep pada fenomena nyata dan studi kasus.",
      reference: n.reference || "OpenStax / Literatur Akademik Terverifikasi",
      quickCheck:
        n.quickCheck && n.quickCheck.options?.length >= 2
          ? n.quickCheck
          : {
              question: `Apa inti keterkaitan konsep "${n.title}" dalam peta pengetahuan ini?`,
              options: [
                {
                  text:
                    n.summary ||
                    "Memperluas pemahaman mekanisme dan hubungan antarkonsep secara terstruktur",
                  correct: true,
                },
                {
                  text: "Konsep ini tidak memiliki kaitan ilmiah dengan materi asal",
                  correct: false,
                },
              ],
            },
    });
  }

  const positionedNodes = assignRegionCoordinates(uniqueNodes);
  const nodeMap = new Map<string, KnowledgeNode>(
    positionedNodes.map((n) => [n.id, n])
  );

  let orphanEdgesRemoved = 0;
  const validInitialEdges: KnowledgeEdge[] = [];

  for (let i = 0; i < rawEdges.length; i++) {
    const e = rawEdges[i];
    const sourceNode = nodeMap.get(e.source);
    const targetNode = nodeMap.get(e.target);

    if (!sourceNode || !targetNode) {
      orphanEdgesRemoved++;
      continue;
    }

    let relation: EdgeRelationType = VALID_RELATIONS.includes(e.relation)
      ? e.relation
      : "related_concept";

    const isCrossRegion = sourceNode.region !== targetNode.region;

    if (isCrossRegion && relation === "related_concept") {
      relation = "cross_disciplinary";
    }

    const reason =
      e.reason && e.reason.trim().length > 8
        ? e.reason.trim()
        : `Konsep "${sourceNode.title}" berhubungan secara ${relation} dengan "${targetNode.title}".`;

    validInitialEdges.push({
      id: e.id || `edge-${e.source}-${e.target}-${i}`,
      source: e.source,
      target: e.target,
      relation,
      reason,
      isCrossRegion,
    });
  }

  const { acyclic, sanitizedEdges } = hasCycleInEdges(
    Array.from(nodeMap.keys()),
    validInitialEdges
  );

  const regionsCovered = Array.from(
    new Set(positionedNodes.map((n) => n.region))
  );
  const crossDisciplinaryCount = sanitizedEdges.filter(
    (e) => e.relation === "cross_disciplinary" || e.isCrossRegion
  ).length;

  const prereqCount = sanitizedEdges.filter(
    (e) => e.relation === "prerequisite"
  ).length;
  const prerequisiteSeparated =
    sanitizedEdges.length === 0 || prereqCount < sanitizedEdges.length;

  // Enforce unused variable check
  void KNOWLEDGE_REGIONS;

  return {
    nodes: positionedNodes,
    edges: sanitizedEdges,
    validation: {
      schemaValid: positionedNodes.length > 0,
      dagAcyclic: acyclic,
      orphanEdgesRemoved,
      duplicateNodesRemoved,
      prerequisiteSeparated,
      crossDisciplinaryCount,
      regionsCovered,
      checkedAt: new Date().toISOString(),
    },
  };
}
