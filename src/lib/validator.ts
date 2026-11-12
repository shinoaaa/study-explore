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

/**
 * Menempatkan node secara rapi di dalam kuadran Knowledge Region-nya (adaptasi Path of Exile)
 * apabila koordinat x/y belum ditentukan atau berada di luar kanvas.
 */
export function assignRegionCoordinates(nodes: KnowledgeNode[]): KnowledgeNode[] {
  const regionCounters: Record<RegionCode, number> = {
    "REG-01": 0,
    "REG-02": 0,
    "REG-03": 0,
    "REG-04": 0,
    "REG-05": 0,
    "REG-06": 0,
  };

  return nodes.map((node) => {
    const reg = VALID_REGIONS.includes(node.region) ? node.region : "REG-01";
    const idx = regionCounters[reg]++;
    const box = KNOWLEDGE_REGIONS[reg].quadrantBox;

    // Jika node sudah memiliki koordinat valid di dalam kanvas 930x536, pertahankan
    if (
      typeof node.x === "number" &&
      typeof node.y === "number" &&
      node.x >= 10 &&
      node.x <= 880 &&
      node.y >= 10 &&
      node.y <= 490
    ) {
      return { ...node, region: reg };
    }

    // Slot grid 2 kolom di dalam kuadran region masing-masing
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = box.x + 18 + col * 138;
    const y = box.y + 44 + (row % 2) * 96;

    return {
      ...node,
      region: reg,
      x: Math.min(x, box.x + box.width - 135),
      y: Math.min(y, box.y + box.height - 68),
    };
  });
}

/**
 * Memeriksa apakah relasi prerequisite membentuk siklus (Directed Acyclic Graph Guard - BR-06)
 */
function hasCycleInEdges(
  nodeIds: string[],
  edges: KnowledgeEdge[]
): { acyclic: boolean; sanitizedEdges: KnowledgeEdge[] } {
  const adj = new Map<string, string[]>();
  nodeIds.forEach((id) => adj.set(id, []));

  const sanitizedEdges: KnowledgeEdge[] = [];
  let hadCycle = false;

  const canReach = (start: string, target: string, visited = new Set<string>()): boolean => {
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
    // Jika penambahan edge ini menyebabkan siklus berarah, ubah atau lewati
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
 * Graph Builder & Validation Engine (Bagian 9.3.B & 9.3.C rencana aplikasi.txt)
 * Memvalidasi node, edge, menghapus duplikat/orphan, memastikan DAG, dan menyusun laporan.
 */
export function validateAndBuildGraph(
  rawNodes: KnowledgeNode[],
  rawEdges: KnowledgeEdge[]
): {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  validation: ValidationReport;
} {
  // 1. Deduplikasi node berdasarkan ID dan normalisasi judul (BR-06)
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

  // 2. Validasi Edge: pastikan source & target valid, alasan wajib ada (BR-03, BR-04, BR-06)
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

    // BR-04: Jika menyeberang ke Region keilmuan berbeda dan bukan prerequisite dasar, tandai lintas-region
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

  // 3. Pemeriksaan DAG Acyclic
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

  // BR-02: Pastikan tidak semua edge dicap prerequisite
  const prereqCount = sanitizedEdges.filter(
    (e) => e.relation === "prerequisite"
  ).length;
  const prerequisiteSeparated =
    sanitizedEdges.length === 0 || prereqCount < sanitizedEdges.length;

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
