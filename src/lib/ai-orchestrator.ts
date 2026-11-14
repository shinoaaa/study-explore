import {
  buildBilingualPivotMeta,
  executeGatewayStructuredReasoning,
  localizeOrchestratorOutputEnToId,
  OrchestratorLlmSchema,
  pivotTextIdToEn,
  translateInboundFieldsIdToEn,
} from "@/lib/ai-gateway";
import { regionShortName } from "@/lib/i18n";
import { inferStartingRegion } from "@/lib/regions";
import { validateAndBuildGraph } from "@/lib/validator";
import {
  appendRevisionToNode,
  cleanLegacyText,
  deriveVaultIdentity,
  normalizeNode,
  normalizeVault,
} from "@/lib/vault-storage";
import {
  DifficultyLevel,
  EdgeRelationType,
  KnowledgeEdge,
  KnowledgeNode,
  KnowledgeVault,
  NodeOpenInputMode,
  OrchestratorCrossLink,
  OrchestratorInputEnvelope,
  OrchestratorIntent,
  OrchestratorNodePayload,
  OrchestratorOutputEnvelope,
  OrchestratorSpatialTopologyPlan,
  OrchestratorValidationGate,
  RegionCode,
} from "@/types/knowledge";

const GRID_NEIGHBORS: Record<RegionCode, RegionCode[]> = {
  "REG-01": ["REG-02", "REG-04"],
  "REG-02": ["REG-01", "REG-03", "REG-05"],
  "REG-03": ["REG-02", "REG-06"],
  "REG-04": ["REG-01", "REG-05"],
  "REG-05": ["REG-02", "REG-04", "REG-06"],
  "REG-06": ["REG-03", "REG-05"],
};

const COMMON_TYPO_DICTIONARY: Record<string, string> = {
  respirsi: "Respirasi",
  selulr: "Seluler",
  mitokndria: "Mitokondria",
  bioenergtika: "Bioenergetika",
  fotosintsis: "Fotosintesis",
  magntik: "Magnetik",
  elektromagntik: "Elektromagnetik",
  indksi: "Induksi",
  neouron: "Neuron",
  neuroplastisitas: "Neuroplastisitas",
  sinpsis: "Sinapsis",
  kardiovaskulr: "Kardiovaskular",
  onklogi: "Onkologi",
  algoritm: "Algoritma",
  komputsi: "Komputasi",
  termodinmika: "Termodinamika",
  homeostsis: "Homeostasis",
   metablisme: "Metabolisme",
  metabolismee: "Metabolisme",
  pernapasn: "Pernapasan",
  fluks: "Fluks",
};

function regionNameForLang(code: RegionCode, lang: "en" | "id"): string {
  return regionShortName(code, lang);
}

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "how",
    "what",
    "why",
    "into",
    "dalam",
    "yang",
    "untuk",
    "dari",
    "pada",
    "dengan",
    "atau",
    "dan",
    "bagaimana",
    "konsep",
    "dasar",
    "prinsip",
    "terapan",
    "systems",
    "system",
    "sistem",
    "mechanisms",
    "mekanisme",
    "foundations",
    "fondasi",
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));
}

/**
 * STAGE 2A (Pre-AI Gate): Validate Node Topic Relevance & Auto-Normalize Minor Typos
 * - If the input has a minor typo, silently corrects it and returns status "typo_corrected" (treated identically to "valid" in UI).
 * - If the input is genuinely out-of-scope / too far from the Vault topic & existing nodes, returns status "rejected_too_far" with a clear danger message.
 */
export function validateNodeInputRelevance(params: {
  rawTitle: string;
  inputContent?: string;
  vault: KnowledgeVault;
  intent: OrchestratorIntent;
  lang: "en" | "id";
}): OrchestratorValidationGate {
  const { rawTitle, inputContent, vault, intent, lang } = params;
  const trimmed = (rawTitle || "").trim();

  // Existing nodes being opened or expanded without new unrelated titles are always valid
  if (intent === "EXPAND_FOG_BRANCHES" || intent === "ANALYZE_RELATIONS") {
    return {
      status: "valid",
      originalTitle: trimmed,
      normalizedTitle: trimmed,
    };
  }

  const identity = deriveVaultIdentity(vault);
  const vaultVocabularyRaw = [
    vault.name,
    identity.mainInterest,
    identity.shortDescription,
    identity.focusQuestion,
    identity.learningGoal,
    ...identity.relatedInterests,
    ...vault.nodes.map((n) => `${n.title} ${n.summary || ""}`),
  ].join(" ");

  const vaultWords = Array.from(
    new Set(
      vaultVocabularyRaw
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 5)
    )
  );

  // Step 1: Check for gibberish / random keysmash
  const alphaOnly = trimmed.replace(/[^a-zA-Z]/g, "");
  const vowelCount = (alphaOnly.match(/[aiueoAIUEO]/g) || []).length;
  if (
    trimmed.length < 2 ||
    (alphaOnly.length >= 6 && vowelCount === 0) ||
    /^(asdf|qwer|zxcv|test123|12345)/i.test(trimmed)
  ) {
    return {
      status: "rejected_too_far",
      originalTitle: trimmed,
      normalizedTitle: trimmed,
      dangerMessage:
        lang === "en"
          ? `Topic "${trimmed}" is not a valid concept related to "${vault.name}". Please enter a meaningful topic connected to ${identity.mainInterest}.`
          : `Topik "${trimmed}" tidak dikenali sebagai konsep yang berkaitan dengan Vault "${vault.name}". Silakan masukkan topik yang relevan dengan ${identity.mainInterest}.`,
    };
  }

  // Step 2: Silent Typo Normalization (dictionary + fuzzy match against Vault vocabulary)
  let wasTypoCorrected = false;
  const normalizedTokens = trimmed.split(/\s+/).map((token) => {
    const cleanLower = token.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (COMMON_TYPO_DICTIONARY[cleanLower]) {
      wasTypoCorrected = true;
      return COMMON_TYPO_DICTIONARY[cleanLower];
    }
    if (cleanLower.length >= 5) {
      for (const vw of vaultWords) {
        const vwLower = vw.toLowerCase();
        if (vwLower !== cleanLower && Math.abs(vwLower.length - cleanLower.length) <= 2) {
          const dist = editDistance(cleanLower, vwLower);
          if (dist === 1 || (cleanLower.length >= 8 && dist <= 2)) {
            wasTypoCorrected = true;
            return vw.charAt(0).toUpperCase() + vw.slice(1);
          }
        }
      }
    }
    return token;
  });

  const normalizedTitle = normalizedTokens.join(" ");

  // Step 3: Check for clearly unrelated / out-of-scope everyday topics (culinary, gaming, shopping, gossip, etc.)
  const combinedInputLower = `${normalizedTitle} ${inputContent || ""}`.toLowerCase();
  const vaultDomainLower = vaultVocabularyRaw.toLowerCase();

  const unrelatedPatterns = [
    /\b(nasi goreng|ayam bakar|resep masakan|seblak|mie instan|bakso|rendang|martabak|bumbu dapur|gorengan)\b/i,
    /\b(mobile legends|free fire|valorant|genshin impact|push rank|top up diamond|gacha|slot gacor)\b/i,
    /\b(gosip artis|selebgram|diskon shopee|keranjang kuning|tiket konser|zodiak hari ini)\b/i,
    /\b(cara cepat kaya|pinjol|judol|taruhan bola)\b/i,
  ];

  for (const pat of unrelatedPatterns) {
    if (pat.test(combinedInputLower) && !pat.test(vaultDomainLower)) {
      return {
        status: "rejected_too_far",
        originalTitle: trimmed,
        normalizedTitle,
        dangerMessage:
          lang === "en"
            ? `Topic "${trimmed}" is too far from this Vault's domain (${vault.name} · ${identity.mainInterest}) and cannot be connected to existing nodes.`
            : `Topik "${trimmed}" terlalu jauh dari fokus Vault ini (${vault.name} · ${identity.mainInterest}) dan tidak memiliki keterhubungan ilmiah dengan node yang ada.`,
      };
    }
  }

  // Step 4: Check cross-domain distance when Vault already has nodes
  if (intent === "BRANCH_NEW_NODE" && vault.nodes.length > 0) {
    const inputRegion = inferStartingRegion(
      `${normalizedTitle} ${inputContent || ""}`
    );
    const vaultPrimaryRegion =
      vault.overview?.startingRegion ||
      inferStartingRegion(`${vault.name} ${identity.mainInterest}`);
    const activeRegions = new Set<RegionCode>([
      vaultPrimaryRegion,
      ...vault.nodes.map((n) => n.region),
    ]);

    const inputKeywords = extractKeywords(
      `${normalizedTitle} ${inputContent || ""}`
    );
    const vaultKeywordSet = new Set(extractKeywords(vaultVocabularyRaw));

    let keywordOverlap = 0;
    for (const kw of inputKeywords) {
      if (vaultKeywordSet.has(kw)) {
        keywordOverlap++;
      } else {
        for (const vkw of Array.from(vaultKeywordSet)) {
          if (
            (kw.length >= 5 && vkw.includes(kw)) ||
            (vkw.length >= 5 && kw.includes(vkw))
          ) {
            keywordOverlap++;
            break;
          }
        }
      }
    }

    // Check if the topic has any academic/conceptual indicator or shares a neighboring region
    const isNeighboringRegion =
      activeRegions.has(inputRegion) ||
      Array.from(activeRegions).some((r) =>
        GRID_NEIGHBORS[r]?.includes(inputRegion)
      );

    // Detect completely disconnected non-academic topics (e.g., sports tournament scores, fashion, tourism) in a specialized science/tech vault
    const distantNonBridgePattern =
      /\b(wisata pantai|hotel murah|jadwal bioskop|skor pertandingan|liga inggris|transfer pemain|rekomendasi outfit|skincare rutin|kpop idol)\b/i;

    if (
      distantNonBridgePattern.test(combinedInputLower) ||
      (!isNeighboringRegion && keywordOverlap === 0 && inputKeywords.length <= 2)
    ) {
      // Allow if it shares at least a conceptual bridge word, otherwise reject if it's a distant non-bridge topic
      if (distantNonBridgePattern.test(combinedInputLower)) {
        return {
          status: "rejected_too_far",
          originalTitle: trimmed,
          normalizedTitle,
          dangerMessage:
            lang === "en"
              ? `Topic "${trimmed}" is too far from "${vault.name}" (${identity.mainInterest}) and has no conceptual link with existing nodes.`
              : `Topik "${trimmed}" terlalu jauh dari topik Vault "${vault.name}" (${identity.mainInterest}) serta tidak memiliki kaitan dengan node lain di dalam Vault.`,
        };
      }
    }
  }

  return {
    status: wasTypoCorrected ? "typo_corrected" : "valid",
    originalTitle: trimmed,
    normalizedTitle,
  };
}

/**
 * STAGE 2B (Pre-AI Backend Spatial & Cross-Region Topology Planner):
 * Computes the 2D Region Grid Adjacency & Boundary Node Map BEFORE calling the AI API
 * so the AI selects regions and relations that form a clean, non-tangled cross-region layout.
 */
export function buildSpatialTopologyPlan(params: {
  vault: KnowledgeVault;
  focusRegion: RegionCode;
}): OrchestratorSpatialTopologyPlan {
  const { vault, focusRegion } = params;
  const regionNodeCounts: Record<RegionCode, number> = {
    "REG-01": 0,
    "REG-02": 0,
    "REG-03": 0,
    "REG-04": 0,
    "REG-05": 0,
    "REG-06": 0,
  };

  const boundaryNodeIdsByRegion: Partial<Record<RegionCode, string[]>> = {};

  for (const node of vault.nodes) {
    regionNodeCounts[node.region] = (regionNodeCounts[node.region] || 0) + 1;
    if (node.explored) {
      if (!boundaryNodeIdsByRegion[node.region]) {
        boundaryNodeIdsByRegion[node.region] = [];
      }
      boundaryNodeIdsByRegion[node.region]!.push(node.id);
    }
  }

  const activeRegions = (Object.keys(regionNodeCounts) as RegionCode[]).filter(
    (rc) => regionNodeCounts[rc] > 0
  );

  const adjacentRegionCandidates = GRID_NEIGHBORS[focusRegion] || ["REG-02"];

  return {
    primaryRegion: focusRegion,
    adjacentRegionCandidates,
    activeRegions,
    regionNodeCounts,
    maxCrossRegionLinksPerNode: 1,
    boundaryNodeIdsByRegion,
    layoutDirective: `Prioritize same-region (${focusRegion}) or orthogonally adjacent regions (${adjacentRegionCandidates.join(", ")}) on the 2x3 grid to prevent diagonal edge crossings. Connect cross-region links only to explored boundary nodes (max 1 cross-region link).`,
  };
}

/**
 * STAGE 1: Assemble Input Context Envelope
 * Builds a structured, token-efficient snapshot of the active Vault, Pre-AI Validation Gate,
 * and Spatial Topology Plan before calling the AI model.
 */
export function assembleOrchestratorEnvelope(params: {
  intent: OrchestratorIntent;
  vault: KnowledgeVault;
  nodeAction: OrchestratorNodePayload;
  preValidationGate: OrchestratorValidationGate;
  spatialTopologyPlan: OrchestratorSpatialTopologyPlan;
  lang: "en" | "id";
}): OrchestratorInputEnvelope {
  const {
    intent,
    vault,
    nodeAction,
    preValidationGate,
    spatialTopologyPlan,
    lang,
  } = params;
  const identity = deriveVaultIdentity(vault);
  const effectiveNodeTitle =
    preValidationGate.normalizedTitle || nodeAction.nodeTitle || vault.name;
  const bilingualPivot = buildBilingualPivotMeta({
    lang,
    rawTopic: effectiveNodeTitle,
    rawVaultInterest: `${identity.mainInterest} — ${identity.focusQuestion || vault.name}`,
  });

  return {
    requestId: `orch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    intent,
    lang,
    vaultContext: {
      vaultId: vault.id,
      vaultName: vault.name,
      identity,
    },
    nodeAction: {
      ...nodeAction,
      nodeTitle: preValidationGate.normalizedTitle || nodeAction.nodeTitle,
    },
    preValidationGate,
    spatialTopologyPlan,
    bilingualPivot,
    existingGraphSnapshot: {
      nodes: vault.nodes.map((n) => ({
        id: n.id,
        title: n.title,
        region: n.region,
        summary: n.explored ? n.summary.slice(0, 160) : "",
        explored: n.explored,
        mastered: n.mastered,
      })),
      edges: vault.edges.map((e) => ({
        source: e.source,
        target: e.target,
        relation: e.relation,
        reason: e.reason.slice(0, 140),
      })),
    },
  };
}

/**
 * STAGE 2C: Deterministic Cross-Node Relationship Analyzer
 * Scans ONLY already-opened (`explored: true`) nodes in the Vault when a node is opened/created,
 * discovering at most 1 clean, high-confidence semantic connection in the same or orthogonally adjacent Region
 * so cross-region lines never become tangled.
 */
export function analyzeCrossNodeRelationships(params: {
  focusNode: KnowledgeNode;
  existingNodes: KnowledgeNode[];
  existingEdges: KnowledgeEdge[];
  parentNodeId?: string;
  lang: "en" | "id";
}): OrchestratorCrossLink[] {
  const { focusNode, existingNodes, existingEdges, parentNodeId, lang } = params;
  const focusKeywords = new Set(
    extractKeywords(
      `${focusNode.title} ${focusNode.summary} ${focusNode.nodeSourceContent || ""}`
    )
  );

  const connectedPairs = new Set<string>();
  for (const e of existingEdges) {
    connectedPairs.add(`${e.source}->${e.target}`);
    connectedPairs.add(`${e.target}->${e.source}`);
  }
  if (parentNodeId) {
    connectedPairs.add(`${parentNodeId}->${focusNode.id}`);
    connectedPairs.add(`${focusNode.id}->${parentNodeId}`);
  }

  const adjacentRegions = new Set(GRID_NEIGHBORS[focusNode.region] || []);

  const scoredCandidates: {
    other: KnowledgeNode;
    score: number;
    sharedTerm?: string;
  }[] = [];

  for (const other of existingNodes) {
    // CRITICAL RULE: Never wire cross-links to unopened Fog of War nodes!
    if (!other.explored) continue;
    if (other.id === focusNode.id || other.id === parentNodeId) continue;
    if (connectedPairs.has(`${other.id}->${focusNode.id}`)) continue;

    const otherWords = extractKeywords(`${other.title} ${other.summary}`);
    let sharedCount = 0;
    let firstShared: string | undefined;
    for (const w of otherWords) {
      if (focusKeywords.has(w)) {
        sharedCount++;
        if (!firstShared) firstShared = w;
      }
    }

    // Prefer same region or orthogonally adjacent region on the 2x3 grid so edges never criss-cross diagonally
    const isSameRegion = other.region === focusNode.region;
    const isOrthoNeighbor = adjacentRegions.has(other.region);
    if (!isSameRegion && !isOrthoNeighbor && sharedCount === 0) {
      continue;
    }

    const spatialBonus = isSameRegion ? 1.6 : isOrthoNeighbor ? 1.4 : 0.4;
    const totalScore = sharedCount * 3 + spatialBonus;

    if (totalScore >= 2.8) {
      scoredCandidates.push({
        other,
        score: totalScore,
        sharedTerm: firstShared,
      });
    }
  }

  scoredCandidates.sort((a, b) => b.score - a.score);

  const discovered: OrchestratorCrossLink[] = [];
  // Cap at 1 high-confidence cross-link per node open action to keep the tree layout clean
  for (const cand of scoredCandidates.slice(0, 1)) {
    const isCross = cand.other.region !== focusNode.region;
    const relation: EdgeRelationType = isCross
      ? "cross_disciplinary"
      : cand.sharedTerm
        ? "related_concept"
        : "extension";

    const reason =
      lang === "en"
        ? isCross
          ? `Cross-domain synthesis: connects ${cand.other.title} (${regionNameForLang(cand.other.region, "en")}) with ${focusNode.title} (${regionNameForLang(focusNode.region, "en")}).`
          : `Conceptual link: ${cand.other.title} shares underlying mechanisms with ${focusNode.title}.`
        : isCross
          ? `Jembatan lintas-bidang: menghubungkan ${cand.other.title} (${regionNameForLang(cand.other.region, "id")}) dengan ${focusNode.title} (${regionNameForLang(focusNode.region, "id")}).`
          : `Keterkaitan konsep: ${cand.other.title} memiliki keterhubungan mekanisme dengan ${focusNode.title}.`;

    discovered.push({
      sourceId: cand.other.id,
      targetId: focusNode.id,
      relation,
      reason,
      isCrossRegion: isCross,
    });
  }

  return discovered;
}

/**
 * Compile Prompt & Strict JSON Output Contract for Gemini 2.5 Flash
 * Includes Pre-Join Relevance Gate check and Spatial Topology Plan directives.
 */
function buildOrchestratorPrompt(envelope: OrchestratorInputEnvelope): string {
  const {
    intent,
    lang,
    vaultContext,
    nodeAction,
    spatialTopologyPlan,
    existingGraphSnapshot,
  } = envelope;

  const langInstruction =
    lang === "en"
      ? "Write all titles, summaries, explanations, formulas, applications, and edge reasons in clear English."
      : "Tulis seluruh judul, ringkasan, penjelasan, rumus/prinsip, aplikasi, dan alasan hubungan dalam Bahasa Indonesia yang natural dan mudah dipahami.";

  const userInputSummary =
    nodeAction.openMode === "instant_ai"
      ? "Mode: Instant AI Exploration (no manual user note attached; synthesize directly from Vault Identity and graph context)."
      : `Mode: User Material / Note Attached (${nodeAction.openMode})
Input Title: ${nodeAction.inputTitle || nodeAction.nodeTitle || "User Material"}
Input Content / Prompt / Chapter: ${nodeAction.inputContent || "-"}`;

  const exploredExistingNodes = existingGraphSnapshot.nodes.filter(
    (n) => n.explored
  );

  return `You are the Curiora AI Knowledge Orchestrator.
Process this structured input envelope and return a strictly formatted JSON response envelope.

STRICT ARCHITECTURAL RULES:
1. ${langInstruction}
2. NEVER output internal codes like "REG-01", "Mode A", "Mode B", "BR-", or "NFR-" inside user-visible text.
3. TOPIC RELEVANCE & TYPO GATE ("relevanceGate"):
   - Check if Target Node Title ("${nodeAction.nodeTitle || ""}") is relevant to Vault Name ("${vaultContext.vaultName}"), Main Interest ("${vaultContext.identity.mainInterest}"), or existing nodes.
   - If it has a minor spelling typo, set "status": "typo_corrected" and put the corrected spelling in "normalizedTitle" (do NOT warn or scold for typos).
   - ONLY if the topic is completely unrelated / too far from the vault domain (e.g. cooking recipes or video games inside a Physics/Biology vault), set "status": "rejected_too_far" and provide a clear 1-sentence "dangerMessage". Otherwise set "status": "valid".
4. SPATIAL TOPOLOGY & CROSS-REGION LAYOUT DIRECTIVE:
   - ${spatialTopologyPlan.layoutDirective}
   - Primary Region: ${spatialTopologyPlan.primaryRegion}
   - Orthogonally Adjacent Regions: ${spatialTopologyPlan.adjacentRegionCandidates.join(", ")}
5. FOG OF WAR STUB RULE:
   - "frontierNodes" represent unopened Fog of War stubs: they ONLY need "title", "region", "relation", "edgeReason", and "difficulty" (no full material body yet, and no cross-links to other nodes).
   - "crossLinks" may ONLY connect to ALREADY-OPENED existing nodes (explored = true) and at most 1 crossLink.

INPUT ENVELOPE:
- Intent: ${intent}
- Vault Name: ${vaultContext.vaultName}
- Main Interest: ${vaultContext.identity.mainInterest}
- Focus Question: ${vaultContext.identity.focusQuestion}
- Learning Goal: ${vaultContext.identity.learningGoal}
- Target Node ID: ${nodeAction.targetNodeId || "new"}
- Target Node Title: ${nodeAction.nodeTitle || "Auto-derive from context"}
- ${userInputSummary}
- Opened Nodes in Vault (${exploredExistingNodes.length}):
${JSON.stringify(exploredExistingNodes, null, 2)}

RETURN ONLY VALID JSON MATCHING THIS EXACT CONTRACT:
{
  "relevanceGate": {
    "status": "valid | typo_corrected | rejected_too_far",
    "normalizedTitle": "Corrected or validated title",
    "dangerMessage": "Only populated when status is rejected_too_far"
  },
  "primaryNode": {
    "title": "Clear 2-5 word concept title",
    "region": "REG-01",
    "difficulty": "Foundation | Basic | Intermediate | Advanced",
    "summary": "2-sentence synthesis integrating user prompt/chapter/note and vault context.",
    "levels": {
      "simple": "Everyday intuitive analogy (2-3 sentences).",
      "standard": "Structured core mechanism (2-3 sentences).",
      "deep": "Advanced analytical & quantitative insight (2-3 sentences)."
    },
    "formula": "Key governing equation, law, or causal rule",
    "application": "Concrete real-world application",
    "reference": "Open reference attribution (e.g. OpenStax / Campbell / Peer-reviewed)",
    "quickCheck": {
      "question": "1 reflection question?",
      "options": [
        { "text": "Correct answer", "correct": true },
        { "text": "Distractor 1", "correct": false },
        { "text": "Distractor 2", "correct": false }
      ]
    }
  },
  "frontierNodes": [
    {
      "title": "Next progressive concept stub (2-5 words, title only)",
      "region": "REG-02",
      "relation": "extension | prerequisite | application | cross_disciplinary",
      "edgeReason": "Why this fog stub branches from primaryNode",
      "difficulty": "Intermediate"
    }
  ],
  "crossLinks": [
    {
      "existingNodeId": "id-of-explored-node",
      "relation": "related_concept | cross_disciplinary | extension | application",
      "reason": "Specific scientific reason why primaryNode connects to this opened node."
    }
  ]
}`;
}

/**
 * STAGE 2C + 3A: Canonical English Reasoning Prompt for `NVIDIA: Nemotron 3 Ultra (free)`
 * (`nvidia/nemotron-3-ultra-550b-a55b:free` on OpenRouter).
 * Because Nemotron 3 Ultra performs scientific reasoning in English and lacks native Indonesian fluency,
 * the Orchestrator pivots all inbound Indonesian fields to English first, runs Nemotron 3 Ultra in 100% English,
 * and then passes the output through Stage 3B (`localizeOrchestratorOutputEnToId`) to return natural Bahasa Indonesia.
 */
function buildCanonicalEnglishOrchestratorPrompt(
  envelope: OrchestratorInputEnvelope,
  enFields: {
    topicTitleEn: string;
    vaultNameEn: string;
    mainInterestEn: string;
    focusQuestionEn: string;
    learningGoalEn: string;
    inputContentEn?: string;
  }
): string {
  const { intent, nodeAction, spatialTopologyPlan, existingGraphSnapshot } =
    envelope;

  const exploredExistingNodesEn = existingGraphSnapshot.nodes
    .filter((n) => n.explored)
    .map((n) => ({
      id: n.id,
      title: pivotTextIdToEn(n.title),
      region: n.region,
      summary: pivotTextIdToEn(n.summary),
    }));

  const userInputSummaryEn =
    nodeAction.openMode === "instant_ai"
      ? "Mode: Instant AI Exploration (synthesize directly from Vault Identity and graph context)."
      : `Mode: User Material / Note Attached (${nodeAction.openMode})
Input Title (EN): ${enFields.topicTitleEn}
Input Content / Prompt / Chapter (EN): ${enFields.inputContentEn || "-"}`;

  return `Process this Canonical English Orchestrator Input Envelope and return ONLY valid JSON matching the exact response contract.

STRICT ARCHITECTURAL RULES (ENGLISH REASONING MODE FOR NEMOTRON 3 ULTRA):
1. Write ALL JSON string values in clear, rigorous academic English. (An outbound Stage 3B localization adapter will translate English back to the user's UI language after reasoning completes.)
2. NEVER output internal codes like "REG-01", "Mode A", "Mode B", "BR-", or "NFR-" inside user-visible text fields.
3. TOPIC RELEVANCE & TYPO GATE ("relevanceGate"):
   - Check if Target Node Title ("${enFields.topicTitleEn}") is scientifically relevant to Vault Name ("${enFields.vaultNameEn}"), Main Interest ("${enFields.mainInterestEn}"), or existing opened nodes.
   - If it has a minor spelling typo, set "status": "typo_corrected" and put the corrected spelling in "normalizedTitle".
   - ONLY if the topic is completely unrelated to the vault domain (e.g. cooking recipes or video games inside a Science/Biology/Engineering vault), set "status": "rejected_too_far" and provide a clear 1-sentence "dangerMessage". Otherwise set "status": "valid".
4. SPATIAL TOPOLOGY & CROSS-REGION LAYOUT DIRECTIVE:
   - ${spatialTopologyPlan.layoutDirective}
   - Primary Region: ${spatialTopologyPlan.primaryRegion}
   - Orthogonally Adjacent Regions: ${spatialTopologyPlan.adjacentRegionCandidates.join(", ")}
5. FOG OF WAR STUB RULE:
   - "frontierNodes" represent unopened Fog of War stubs: they ONLY need "title", "region", "relation", "edgeReason", and "difficulty".
   - "crossLinks" may ONLY connect to ALREADY-OPENED existing nodes (from the list below) and at most 1 crossLink.

CANONICAL ENGLISH INPUT ENVELOPE:
- Intent: ${intent}
- Vault Name (EN): ${enFields.vaultNameEn}
- Main Interest (EN): ${enFields.mainInterestEn}
- Focus Question (EN): ${enFields.focusQuestionEn}
- Learning Goal (EN): ${enFields.learningGoalEn}
- Target Node ID: ${nodeAction.targetNodeId || "new"}
- Target Node Title (EN): ${enFields.topicTitleEn}
- ${userInputSummaryEn}
- Opened Nodes in Vault (${exploredExistingNodesEn.length}):
${JSON.stringify(exploredExistingNodesEn, null, 2)}

RETURN ONLY RAW JSON (NO MARKDOWN FENCES) MATCHING THIS CONTRACT:
{
  "relevanceGate": {
    "status": "valid",
    "normalizedTitle": "${enFields.topicTitleEn}",
    "dangerMessage": ""
  },
  "primaryNode": {
    "title": "Clear 2-5 word concept title in English",
    "region": "${spatialTopologyPlan.primaryRegion}",
    "difficulty": "Intermediate",
    "summary": "2-sentence synthesis in English.",
    "levels": {
      "simple": "Everyday intuitive analogy in English (2-3 sentences).",
      "standard": "Structured core mechanism in English (2-3 sentences).",
      "deep": "Advanced analytical & quantitative insight in English (2-3 sentences)."
    },
    "formula": "Key governing equation, law, or causal rule in English",
    "application": "Concrete real-world application in English",
    "reference": "OpenStax / Peer-Reviewed Academic Reference",
    "quickCheck": {
      "question": "1 reflection question in English?",
      "options": [
        { "text": "Correct answer", "correct": true },
        { "text": "Distractor 1", "correct": false },
        { "text": "Distractor 2", "correct": false }
      ]
    }
  },
  "frontierNodes": [
    {
      "title": "Next progressive concept stub in English (2-5 words)",
      "region": "${spatialTopologyPlan.adjacentRegionCandidates[0] || spatialTopologyPlan.primaryRegion}",
      "relation": "extension",
      "edgeReason": "Why this fog stub branches from primaryNode",
      "difficulty": "Intermediate"
    }
  ],
  "crossLinks": []
}`;
}

function buildSynthesizedPrimaryNode(params: {
  id: string;
  title: string;
  region: RegionCode;
  difficulty: DifficultyLevel;
  relationToOrigin: EdgeRelationType | "root";
  openMode: NodeOpenInputMode;
  inputTitle?: string;
  inputContent?: string;
  vault: KnowledgeVault;
  lang: "en" | "id";
}): KnowledgeNode {
  const {
    id,
    title,
    region,
    difficulty,
    relationToOrigin,
    openMode,
    inputTitle,
    inputContent,
    vault,
    lang,
  } = params;
  const identity = deriveVaultIdentity(vault);
  const cleanTitle = cleanLegacyText(title);
  const hasUserMaterial =
    openMode !== "instant_ai" && Boolean(inputContent && inputContent.trim());
  const snippet = (inputContent || "").trim().slice(0, 260);

  const summary =
    lang === "en"
      ? hasUserMaterial
        ? `${cleanTitle} synthesizes your ${openMode === "book_chapter" ? "chapter material" : openMode === "custom_prompt" ? "focus prompt" : "personal note"} (${snippet.slice(0, 120)}${snippet.length > 120 ? "..." : ""}) within ${identity.mainInterest}.`
        : `${cleanTitle} anchors a core mechanism within ${identity.mainInterest}, directly addressing "${identity.focusQuestion || vault.name}".`
      : hasUserMaterial
        ? `${cleanTitle} memadukan ${openMode === "book_chapter" ? "materi bab" : openMode === "custom_prompt" ? "pertanyaan fokus" : "catatan"} Anda (${snippet.slice(0, 120)}${snippet.length > 120 ? "..." : ""}) dalam konteks ${identity.mainInterest}.`
        : `${cleanTitle} memetakan mekanisme utama pada ${identity.mainInterest} untuk menjawab "${identity.focusQuestion || vault.name}".`;

  const levels =
    lang === "en"
      ? {
          simple: hasUserMaterial
            ? `In everyday terms, ${cleanTitle} turns the core idea from "${inputTitle || cleanTitle}" into a clear cause-and-effect stepping stone you can trace visually.`
            : `Think of ${cleanTitle} as a foundational stepping stone showing how ${identity.mainInterest} operates in everyday life.`,
          standard: hasUserMaterial
            ? `Building on your input ("${snippet.slice(0, 140)}"), ${cleanTitle} explains how key variables interact and prepare the ground for the next connected nodes.`
            : `${cleanTitle} structures the causal pathway in ${regionNameForLang(region, "en")} and connects directly to ${identity.learningGoal || identity.mainInterest}.`,
          deep: `At an advanced analytical level, ${cleanTitle} couples multi-variable dynamics in ${regionNameForLang(region, "en")} with cross-disciplinary feedback loops across your vault.`,
        }
      : {
          simple: hasUserMaterial
            ? `Secara sederhana, ${cleanTitle} menerjemahkan inti dari "${inputTitle || cleanTitle}" menjadi alur sebab-akibat yang mudah dibayangkan.`
            : `Bayangkan ${cleanTitle} sebagai pijakan awal yang menjelaskan bagaimana ${identity.mainInterest} bekerja dalam kehidupan sehari-hari.`,
          standard: hasUserMaterial
            ? `Berangkat dari materi/catatan Anda ("${snippet.slice(0, 140)}"), ${cleanTitle} menguraikan interaksi mekanisme utama menuju konsep lanjutan di sekitarnya.`
            : `${cleanTitle} menyusun alur mekanisme pada rumpun ${regionNameForLang(region, "id")} serta terhubung langsung dengan ${identity.learningGoal || identity.mainInterest}.`,
          deep: `Pada tingkat analisis lanjut, ${cleanTitle} mengintegrasikan interaksi kuantitatif dan umpan balik lintas-disiplin di dalam peta pengetahuan Anda.`,
        };

  const now = new Date().toISOString();
  const origin =
    openMode === "book_chapter"
      ? "user_source"
      : openMode === "user_note" || openMode === "custom_prompt"
        ? "user_edited"
        : "ai_generated";

  return normalizeNode({
    id,
    title: cleanTitle,
    region,
    relationToOrigin,
    difficulty,
    x: 240,
    y: 180,
    explored: true,
    mastered: false,
    summary,
    levels,
    formula:
      lang === "en"
        ? `${cleanTitle} → Functional State Change (ΔSystem)`
        : `${cleanTitle} → Perubahan Status Fungsional (ΔSistem)`,
    application:
      lang === "en"
        ? `Applied across ${identity.mainInterest} to connect "${cleanTitle}" with real-world problem solving.`
        : `Diterapkan pada ${identity.mainInterest} untuk menghubungkan "${cleanTitle}" dengan pemecahan masalah nyata.`,
    reference:
      inputTitle && openMode === "book_chapter"
        ? `${inputTitle} · Curiora Synthesis`
        : "OpenStax · Curated Conceptual Synthesis",
    quickCheck: {
      question:
        lang === "en"
          ? `What is the primary role of ${cleanTitle} in this knowledge path?`
          : `Apa peran utama ${cleanTitle} pada jalur pengetahuan ini?`,
      options:
        lang === "en"
          ? [
              {
                text: `It bridges foundational mechanisms with ${identity.mainInterest}.`,
                correct: true,
              },
              {
                text: "It isolates the concept from all other regions.",
                correct: false,
              },
              {
                text: "It removes prerequisite relationships.",
                correct: false,
              },
            ]
          : [
              {
                text: `Menjembatani mekanisme dasar menuju ${identity.mainInterest}.`,
                correct: true,
              },
              {
                text: "Memisahkan konsep dari seluruh rumpun ilmu lain.",
                correct: false,
              },
              {
                text: "Menghapus hubungan prasyarat antar-konsep.",
                correct: false,
              },
            ],
    },
    origin,
    nodeInputMode: openMode,
    nodeSourceTitle: inputTitle || undefined,
    nodeSourceContent: inputContent || undefined,
    userAnnotation:
      openMode === "user_note" && inputContent ? inputContent : undefined,
    reviewStatus: "reviewed",
    updatedAt: now,
  });
}

/**
 * Builds a lightweight Fog of War Stub Node (`explored: false`).
 * As required by the UX design: a Fog node ONLY has its topic `title` and `region` —
 * its material body (`summary`, `levels`, `formula`, `application`) is empty until the user opens it!
 */
function buildFogStubNode(params: {
  id: string;
  title: string;
  region: RegionCode;
  difficulty: DifficultyLevel;
  relationToOrigin: EdgeRelationType;
}): KnowledgeNode {
  const now = new Date().toISOString();
  return normalizeNode({
    id: params.id,
    title: cleanLegacyText(params.title),
    region: params.region,
    relationToOrigin: params.relationToOrigin,
    difficulty: params.difficulty,
    x: 240,
    y: 180,
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
        { text: "True", correct: true },
        { text: "False", correct: false },
      ],
    },
    origin: "ai_generated",
    updatedAt: now,
  });
}

function deriveFrontierTopics(params: {
  parentNode: KnowledgeNode;
  vault: KnowledgeVault;
  inputContent?: string;
  count: number;
  lang: "en" | "id";
}): {
  title: string;
  region: RegionCode;
  relation: EdgeRelationType;
  reason: string;
  difficulty: DifficultyLevel;
}[] {
  const { parentNode, vault, inputContent, count, lang } = params;
  const identity = deriveVaultIdentity(vault);
  const existingTitles = new Set(
    vault.nodes.map((n) => n.title.toLowerCase().trim())
  );

  const rawParts = (inputContent || "")
    .split(/[,;\n•]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4 && s.length <= 48);

  const candidates: {
    title: string;
    region: RegionCode;
    relation: EdgeRelationType;
    reason: string;
    difficulty: DifficultyLevel;
  }[] = [];

  const orthoNeighbors = GRID_NEIGHBORS[parentNode.region] || ["REG-02"];
  const adjReg = orthoNeighbors[0] || "REG-02";

  for (const part of rawParts) {
    if (
      !existingTitles.has(part.toLowerCase()) &&
      part.toLowerCase() !== parentNode.title.toLowerCase()
    ) {
      const inferred = inferStartingRegion(`${part} ${identity.mainInterest}`);
      // Keep frontier in same region or orthogonally adjacent region so layout stays tidy
      const safeReg =
        inferred === parentNode.region || orthoNeighbors.includes(inferred)
          ? inferred
          : adjReg;
      const isCross = safeReg !== parentNode.region;
      candidates.push({
        title: part,
        region: safeReg,
        relation: isCross ? "cross_disciplinary" : "extension",
        reason:
          lang === "en"
            ? `Branches progressively from ${parentNode.title} to explore ${part}.`
            : `Cabang lanjutan dari ${parentNode.title} untuk mengeksplorasi ${part}.`,
        difficulty: "Intermediate",
      });
    }
  }

  const baseShort = parentNode.title
    .replace(
      /^(Foundations|Fondasi|Applied|Terapan|Mechanism|Mekanisme|Pendalaman|Jembatan):\s*/i,
      ""
    )
    .slice(0, 28);

  const defaults =
    lang === "en"
      ? [
          {
            title: `Mechanism: ${baseShort}`,
            region: parentNode.region,
            relation: "extension" as EdgeRelationType,
            reason: `Unpacks the core causal mechanism behind ${parentNode.title}.`,
            difficulty: "Intermediate" as DifficultyLevel,
          },
          {
            title: `Applied: ${baseShort}`,
            region: adjReg,
            relation: (adjReg !== parentNode.region
              ? "cross_disciplinary"
              : "application") as EdgeRelationType,
            reason: `Applies ${parentNode.title} into ${regionNameForLang(adjReg, "en")}.`,
            difficulty: "Intermediate" as DifficultyLevel,
          },
        ]
      : [
          {
            title: `Mekanisme: ${baseShort}`,
            region: parentNode.region,
            relation: "extension" as EdgeRelationType,
            reason: `Menguraikan mekanisme sebab-akibat di balik ${parentNode.title}.`,
            difficulty: "Intermediate" as DifficultyLevel,
          },
          {
            title: `Terapan: ${baseShort}`,
            region: adjReg,
            relation: (adjReg !== parentNode.region
              ? "cross_disciplinary"
              : "application") as EdgeRelationType,
            reason: `Menerapkan prinsip ${parentNode.title} ke bidang ${regionNameForLang(adjReg, "id")}.`,
            difficulty: "Intermediate" as DifficultyLevel,
          },
        ];

  for (const d of defaults) {
    if (!existingTitles.has(d.title.toLowerCase())) {
      candidates.push(d);
    }
  }

  return candidates.slice(0, count);
}

/**
 * STAGE 3–5: Execute Orchestrator Pipeline
 * - Stage 1: Input Context Assembler
 * - Stage 2A: Pre-AI Topic Relevance & Typo Gate (rejects `rejected_too_far` before mutating graph; silently normalizes typos)
 * - Stage 2B: Pre-AI Spatial & Cross-Region Topology Planner
 * - Stage 3: Gemini 2.5 Flash / Deterministic Synthesis & Fog-of-War Lifecycle Engine
 * - Stage 4: DAG Validator, Single-Edge Guard & Cross-Region Pull Layout (`validator.ts`)
 * - Stage 5: Non-Destructive State Reconciler & `OrchestratorOutputEnvelope`
 */
export async function executeOrchestratorPipeline(params: {
  intent: OrchestratorIntent;
  vault: KnowledgeVault;
  nodeAction: OrchestratorNodePayload;
  lang?: "en" | "id";
}): Promise<OrchestratorOutputEnvelope> {
  const lang: "en" | "id" = params.lang === "id" ? "id" : "en";
  const normalizedVault = normalizeVault(params.vault);
  const identity = deriveVaultIdentity(normalizedVault);
  const now = new Date().toISOString();

  // STAGE 2A: Pre-AI Relevance & Typo Validation Gate
  const preValidationGate = validateNodeInputRelevance({
    rawTitle:
      params.nodeAction.nodeTitle ||
      params.nodeAction.inputTitle ||
      identity.focusQuestion ||
      normalizedVault.name,
    inputContent: params.nodeAction.inputContent,
    vault: normalizedVault,
    intent: params.intent,
    lang,
  });

  const startReg = inferStartingRegion(
    `${preValidationGate.normalizedTitle} ${params.nodeAction.inputTitle || ""} ${params.nodeAction.inputContent || ""} ${identity.mainInterest} ${identity.focusQuestion}`
  );

  // STAGE 2B: Pre-AI Spatial & Cross-Region Topology Planner
  const spatialTopologyPlan = buildSpatialTopologyPlan({
    vault: normalizedVault,
    focusRegion: startReg,
  });

  // STAGE 1: Assemble Complete Input Envelope
  const envelope = assembleOrchestratorEnvelope({
    intent: params.intent,
    vault: normalizedVault,
    nodeAction: params.nodeAction,
    preValidationGate,
    spatialTopologyPlan,
    lang,
  });

  // If the Pre-AI Gate already detected a topic that is too far from the Vault, block immediately before joining!
  if (preValidationGate.status === "rejected_too_far") {
    return {
      ok: false,
      validationGate: preValidationGate,
      trace: {
        requestId: envelope.requestId,
        intent: params.intent,
        engineUsed: "Curiora Pre-Join Topic Relevance Gate",
        bilingualPivot: envelope.bilingualPivot,
        validationStatus: "rejected_too_far",
        openedNodeId: "",
        spawnedFrontierNodeIds: [],
        crossLinksDiscovered: [],
        flaggedReviewNodeIds: [],
        dagValid: true,
        processedAt: now,
      },
      vault: normalizedVault,
    };
  }

  let engineUsed =
    "Curiora Orchestrator (Bilingual ID↔EN Pivot + Deterministic Spatial Topology Engine)";

  let workingNodes = [...normalizedVault.nodes];
  let workingEdges = [...normalizedVault.edges];
  let openedNodeId = params.nodeAction.targetNodeId || "";
  const spawnedFrontierNodeIds: string[] = [];
  let crossLinksDiscovered: OrchestratorCrossLink[] = [];
  const flaggedReviewNodeIds: string[] = [];

  // STAGE 2C + 3A + 3B: Multi-Provider LLM Execution (OpenRouter NVIDIA Nemotron 3 Ultra (free) / SumoPod / Gemini)
  // Automatically runs Inbound ID->EN Pivot -> English Reasoning on Nemotron 3 Ultra -> Outbound EN->ID Localization
  let llmData: OrchestratorLlmSchema | null = null;

  if (params.intent !== "ANALYZE_RELATIONS") {
    const enFields = await translateInboundFieldsIdToEn({
      topicTitle:
        preValidationGate.normalizedTitle ||
        params.nodeAction.nodeTitle ||
        params.nodeAction.inputTitle ||
        normalizedVault.name,
      vaultName: normalizedVault.name,
      mainInterest: identity.mainInterest,
      focusQuestion: identity.focusQuestion,
      learningGoal: identity.learningGoal,
      inputContent: params.nodeAction.inputContent,
    });

    const englishUserPrompt = buildCanonicalEnglishOrchestratorPrompt(
      envelope,
      enFields
    );
    const directBilingualPrompt = buildOrchestratorPrompt(envelope);

    const gatewayResult =
      await executeGatewayStructuredReasoning<OrchestratorLlmSchema>({
        englishSystemPrompt:
          "You are the Curiora AI Knowledge Orchestrator running on NVIDIA Nemotron 3 Ultra. Reason in rigorous academic English and output ONLY valid raw JSON matching the exact response schema.",
        englishUserPrompt,
        directBilingualPrompt,
        userLang: lang,
        localizeOutputFn: localizeOrchestratorOutputEnToId,
      });

    llmData = gatewayResult.data;
    engineUsed = gatewayResult.engineUsed;
    envelope.bilingualPivot = {
      ...envelope.bilingualPivot,
      canonicalEnglishTopic: enFields.topicTitleEn,
      canonicalEnglishVaultInterest: enFields.mainInterestEn,
      reasoningProvider: gatewayResult.provider,
      reasoningModel: gatewayResult.modelUsed,
    };
  }

  // Check if the LLM flagged the topic as rejected_too_far
  if (
    llmData?.relevanceGate?.status === "rejected_too_far" &&
    (params.intent === "BRANCH_NEW_NODE" || params.intent === "SEED_FIRST_NODE")
  ) {
    const gate: OrchestratorValidationGate = {
      status: "rejected_too_far",
      originalTitle: preValidationGate.originalTitle,
      normalizedTitle:
        llmData.relevanceGate.normalizedTitle ||
        preValidationGate.normalizedTitle,
      dangerMessage:
        llmData.relevanceGate.dangerMessage ||
        (lang === "en"
          ? `Topic "${preValidationGate.originalTitle}" is too far from this Vault's focus (${normalizedVault.name}).`
          : `Topik "${preValidationGate.originalTitle}" terlalu jauh dari fokus Vault ini (${normalizedVault.name}).`),
    };
    return {
      ok: false,
      validationGate: gate,
      trace: {
        requestId: envelope.requestId,
        intent: params.intent,
        engineUsed,
        bilingualPivot: envelope.bilingualPivot,
        validationStatus: "rejected_too_far",
        openedNodeId: "",
        spawnedFrontierNodeIds: [],
        crossLinksDiscovered: [],
        flaggedReviewNodeIds: [],
        dagValid: true,
        processedAt: now,
      },
      vault: normalizedVault,
    };
  }

  // CASE 1: EXPAND_FOG_BRANCHES — User clicked "Expand Node" inside an already-opened node
  // Spawns 2 lightweight Fog of War stub nodes (`explored: false`, title only, 1 edge from parentNode, no cross-links)
  if (
    params.intent === "EXPAND_FOG_BRANCHES" &&
    params.nodeAction.targetNodeId &&
    workingNodes.some((n) => n.id === params.nodeAction.targetNodeId)
  ) {
    const parentNode = workingNodes.find(
      (n) => n.id === params.nodeAction.targetNodeId
    )!;
    openedNodeId = parentNode.id;

    const orthoNeighbors = GRID_NEIGHBORS[parentNode.region] || ["REG-02"];
    const frontierSpecs =
      llmData?.frontierNodes && llmData.frontierNodes.length > 0
        ? llmData.frontierNodes.slice(0, 2).map((f) => {
            const candidateReg =
              (f.region as RegionCode) || orthoNeighbors[0] || parentNode.region;
            const safeReg =
              candidateReg === parentNode.region ||
              orthoNeighbors.includes(candidateReg)
                ? candidateReg
                : orthoNeighbors[0];
            return {
              title: f.title || "Connected Concept",
              region: safeReg,
              relation: (f.relation as EdgeRelationType) || "extension",
              reason:
                f.edgeReason ||
                (lang === "en"
                  ? `Branches progressively from ${parentNode.title}.`
                  : `Cabang eksplorasi lanjutan dari ${parentNode.title}.`),
              difficulty: (f.difficulty as DifficultyLevel) || "Intermediate",
            };
          })
        : deriveFrontierTopics({
            parentNode,
            vault: { ...normalizedVault, nodes: workingNodes },
            inputContent: parentNode.nodeSourceContent || parentNode.summary,
            count: 2,
            lang,
          });

    frontierSpecs.forEach((fp, idx) => {
      const fId = `n_fog_${Date.now()}_${idx}`;
      const stubNode = buildFogStubNode({
        id: fId,
        title: fp.title,
        region: fp.region,
        difficulty: fp.difficulty,
        relationToOrigin: fp.relation,
      });
      workingNodes.push(stubNode);
      spawnedFrontierNodeIds.push(fId);

      workingEdges.push({
        id: `e_fog_${Date.now()}_${idx}`,
        source: parentNode.id,
        target: fId,
        relation: fp.relation,
        reason: fp.reason,
        isCrossRegion: fp.region !== parentNode.region,
      });
    });
  }
  // CASE 2: OPEN_NODE — Unlock / Open an existing Fog Node on the Tree (or enrich it with Note / Prompt / Chapter)
  // Generates material ONLY for this node and analyzes cross-links with already-opened nodes.
  // Does NOT auto-open or auto-spawn other nodes (user can click Expand inside the opened node when ready).
  else if (
    params.intent === "OPEN_NODE" &&
    params.nodeAction.targetNodeId &&
    workingNodes.some((n) => n.id === params.nodeAction.targetNodeId)
  ) {
    const existingTarget = workingNodes.find(
      (n) => n.id === params.nodeAction.targetNodeId
    )!;
    openedNodeId = existingTarget.id;

    const effectiveTitle =
      llmData?.relevanceGate?.normalizedTitle ||
      preValidationGate.normalizedTitle ||
      existingTarget.title;

    const synthesized = buildSynthesizedPrimaryNode({
      id: existingTarget.id,
      title: effectiveTitle,
      region: llmData?.primaryNode?.region || existingTarget.region,
      difficulty: llmData?.primaryNode?.difficulty || existingTarget.difficulty,
      relationToOrigin: existingTarget.relationToOrigin,
      openMode: params.nodeAction.openMode,
      inputTitle: params.nodeAction.inputTitle,
      inputContent: params.nodeAction.inputContent,
      vault: normalizedVault,
      lang,
    });

    const hasUserInput =
      params.nodeAction.openMode !== "instant_ai" &&
      Boolean(params.nodeAction.inputContent?.trim());

    const updatedNode: KnowledgeNode = appendRevisionToNode(
      {
        ...existingTarget,
        title: effectiveTitle,
        explored: true,
        nodeInputMode: params.nodeAction.openMode,
        nodeSourceTitle:
          params.nodeAction.inputTitle || existingTarget.nodeSourceTitle,
        nodeSourceContent:
          params.nodeAction.inputContent || existingTarget.nodeSourceContent,
        quickCheck: synthesized.quickCheck,
        reference: synthesized.reference,
      },
      {
        kind: hasUserInput ? "manual_edit" : "initial_ai",
        label:
          lang === "en"
            ? hasUserInput
              ? `Opened with ${params.nodeAction.openMode.replace("_", " ")}`
              : "Generated node material"
            : hasUserInput
              ? "Dibuka dengan materi/catatan"
              : "Sintesis materi node",
        summary: llmData?.primaryNode?.summary || synthesized.summary,
        levels: {
          simple:
            llmData?.primaryNode?.levels?.simple || synthesized.levels.simple,
          standard:
            llmData?.primaryNode?.levels?.standard ||
            synthesized.levels.standard,
          deep: llmData?.primaryNode?.levels?.deep || synthesized.levels.deep,
        },
        formula: llmData?.primaryNode?.formula || synthesized.formula,
        application:
          llmData?.primaryNode?.application || synthesized.application,
        userAnnotation:
          params.nodeAction.openMode === "user_note" &&
          params.nodeAction.inputContent
            ? params.nodeAction.inputContent
            : existingTarget.userAnnotation,
        origin: hasUserInput ? synthesized.origin : "ai_generated",
        reviewStatus: "reviewed",
      }
    );

    workingNodes = workingNodes.map((n) =>
      n.id === existingTarget.id ? updatedNode : n
    );

    // Run Cross-Node Relationship Analyzer ONLY against already-opened (`explored: true`) nodes
    crossLinksDiscovered = analyzeCrossNodeRelationships({
      focusNode: updatedNode,
      existingNodes: workingNodes.filter(
        (n) => n.explored && n.id !== updatedNode.id
      ),
      existingEdges: workingEdges,
      lang,
    });
  }
  // CASE 3: SEED_FIRST_NODE or BRANCH_NEW_NODE
  else {
    const exploredNodes = workingNodes.filter((n) => n.explored);
    const parentNode = params.nodeAction.parentNodeId
      ? workingNodes.find((n) => n.id === params.nodeAction.parentNodeId)
      : exploredNodes[0] || workingNodes[0];

    const isFirstNode = workingNodes.length === 0;
    const newId = isFirstNode ? "root" : `n_node_${Date.now()}`;
    openedNodeId = newId;

    const rawTitle =
      llmData?.relevanceGate?.normalizedTitle ||
      llmData?.primaryNode?.title ||
      preValidationGate.normalizedTitle ||
      params.nodeAction.inputTitle ||
      identity.focusQuestion ||
      identity.mainInterest ||
      normalizedVault.name;

    const primaryNode = buildSynthesizedPrimaryNode({
      id: newId,
      title: rawTitle,
      region: llmData?.primaryNode?.region || startReg,
      difficulty:
        llmData?.primaryNode?.difficulty ||
        (isFirstNode ? "Foundation" : "Intermediate"),
      relationToOrigin: isFirstNode ? "root" : "extension",
      openMode: params.nodeAction.openMode,
      inputTitle: params.nodeAction.inputTitle,
      inputContent: params.nodeAction.inputContent,
      vault: normalizedVault,
      lang,
    });

    if (llmData?.primaryNode?.summary) {
      primaryNode.summary = cleanLegacyText(llmData.primaryNode.summary);
    }
    if (llmData?.primaryNode?.levels) {
      primaryNode.levels = {
        simple:
          cleanLegacyText(llmData.primaryNode.levels.simple || "") ||
          primaryNode.levels.simple,
        standard:
          cleanLegacyText(llmData.primaryNode.levels.standard || "") ||
          primaryNode.levels.standard,
        deep:
          cleanLegacyText(llmData.primaryNode.levels.deep || "") ||
          primaryNode.levels.deep,
      };
    }

    workingNodes.push(primaryNode);

    if (!isFirstNode && parentNode) {
      const isCross = parentNode.region !== primaryNode.region;
      workingEdges.push({
        id: `e_branch_${Date.now()}`,
        source: parentNode.id,
        target: primaryNode.id,
        relation: isCross ? "cross_disciplinary" : "extension",
        reason:
          lang === "en"
            ? `Branched from ${parentNode.title} to explore ${primaryNode.title}.`
            : `Dikembangkan dari ${parentNode.title} untuk mengeksplorasi ${primaryNode.title}.`,
        isCrossRegion: isCross,
      });
    }

    // Only spawn initial Fog stub nodes when seeding the very first node of an empty Vault.
    // For subsequent nodes, the user triggers expansion explicitly from inside the opened node!
    if (isFirstNode) {
      const frontierSpecs = deriveFrontierTopics({
        parentNode: primaryNode,
        vault: { ...normalizedVault, nodes: workingNodes },
        inputContent: params.nodeAction.inputContent,
        count: 2,
        lang,
      });

      frontierSpecs.forEach((fp, idx) => {
        const fId = `n_fog_${Date.now()}_${idx}`;
        const stubNode = buildFogStubNode({
          id: fId,
          title: fp.title,
          region: fp.region,
          difficulty: fp.difficulty,
          relationToOrigin: fp.relation,
        });
        workingNodes.push(stubNode);
        spawnedFrontierNodeIds.push(fId);

        workingEdges.push({
          id: `e_fog_${Date.now()}_${idx}`,
          source: primaryNode.id,
          target: fId,
          relation: fp.relation,
          reason: fp.reason,
          isCrossRegion: fp.region !== primaryNode.region,
        });
      });
    }

    // Run Cross-Node Relationship Analyzer against already-opened (`explored: true`) nodes in the Vault
    crossLinksDiscovered = analyzeCrossNodeRelationships({
      focusNode: primaryNode,
      existingNodes: workingNodes.filter(
        (n) => n.explored && n.id !== primaryNode.id
      ),
      existingEdges: workingEdges,
      parentNodeId: parentNode?.id,
      lang,
    });
  }

  // Merge at most 1 LLM-suggested crossLink if it points to an explored node and we don't have one yet
  if (
    crossLinksDiscovered.length === 0 &&
    Array.isArray(llmData?.crossLinks) &&
    params.intent !== "EXPAND_FOG_BRANCHES"
  ) {
    for (const cl of llmData.crossLinks) {
      if (!cl.existingNodeId || !cl.reason) continue;
      const exists = workingNodes.find(
        (n) => n.id === cl.existingNodeId && n.explored
      );
      if (exists && exists.id !== openedNodeId) {
        const focusN = workingNodes.find((n) => n.id === openedNodeId);
        const isCross = Boolean(focusN && focusN.region !== exists.region);
        crossLinksDiscovered.push({
          sourceId: exists.id,
          targetId: openedNodeId,
          relation:
            cl.relation || (isCross ? "cross_disciplinary" : "related_concept"),
          reason: cleanLegacyText(cl.reason),
          isCrossRegion: isCross,
        });
        break;
      }
    }
  }

  // Wire discovered cross-node edges into the graph
  crossLinksDiscovered.forEach((link, idx) => {
    workingEdges.push({
      id: `e_cross_${Date.now()}_${idx}`,
      source: link.sourceId,
      target: link.targetId,
      relation: link.relation,
      reason: link.reason,
      isCrossRegion: link.isCrossRegion,
    });
  });

  // STAGE 4: Validate DAG, Enforce Fog Stub Rules, Deduplicate Parallel Edges & Compute Cross-Region Layout
  const validated = validateAndBuildGraph(workingNodes, workingEdges);

  // STAGE 5: Build Final Normalized Vault & Output Envelope
  const updatedVault: KnowledgeVault = normalizeVault({
    ...normalizedVault,
    updatedAt: now,
    overview: {
      ...normalizedVault.overview,
      startingRegion:
        validated.nodes[0]?.region ||
        normalizedVault.overview.startingRegion ||
        startReg,
      keyConcepts: validated.nodes
        .filter((n) => n.explored)
        .slice(0, 6)
        .map((n) => n.title),
    },
    nodes: validated.nodes,
    edges: validated.edges,
    validation: validated.validation,
  });

  return {
    ok: true,
    validationGate: preValidationGate,
    trace: {
      requestId: envelope.requestId,
      intent: params.intent,
      engineUsed,
      bilingualPivot: envelope.bilingualPivot,
      validationStatus: preValidationGate.status,
      openedNodeId,
      spawnedFrontierNodeIds,
      crossLinksDiscovered,
      flaggedReviewNodeIds,
      dagValid: validated.validation.dagAcyclic,
      processedAt: now,
    },
    vault: updatedVault,
  };
}
