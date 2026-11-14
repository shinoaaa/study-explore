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
  ExplanationDepth,
  KnowledgeEdge,
  KnowledgeNode,
  KnowledgeVault,
  NodeOpenInputMode,
  OrchestratorCrossLink,
  OrchestratorInputEnvelope,
  OrchestratorIntent,
  OrchestratorNodePayload,
  OrchestratorOutputEnvelope,
  RegionCode,
} from "@/types/knowledge";

const ADJACENT_REGION: Record<RegionCode, RegionCode> = {
  "REG-01": "REG-02",
  "REG-02": "REG-03",
  "REG-03": "REG-05",
  "REG-04": "REG-01",
  "REG-05": "REG-03",
  "REG-06": "REG-02",
};

const CROSS_REGION: Record<RegionCode, RegionCode> = {
  "REG-01": "REG-04",
  "REG-02": "REG-06",
  "REG-03": "REG-01",
  "REG-04": "REG-03",
  "REG-05": "REG-04",
  "REG-06": "REG-03",
};

function regionNameForLang(code: RegionCode, lang: "en" | "id"): string {
  return regionShortName(code, lang);
}

/**
 * STAGE 1: Assemble Input Context Envelope
 * Builds a structured, token-efficient snapshot of the active Vault and all existing nodes/edges
 * so the AI Orchestrator can synthesize node material and analyze cross-node relationships.
 */
export function assembleOrchestratorEnvelope(params: {
  intent: OrchestratorIntent;
  vault: KnowledgeVault;
  nodeAction: OrchestratorNodePayload;
  lang: "en" | "id";
}): OrchestratorInputEnvelope {
  const { intent, vault, nodeAction, lang } = params;
  const identity = deriveVaultIdentity(vault);

  return {
    requestId: `orch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    intent,
    lang,
    vaultContext: {
      vaultId: vault.id,
      vaultName: vault.name,
      identity,
    },
    nodeAction,
    existingGraphSnapshot: {
      nodes: vault.nodes.map((n) => ({
        id: n.id,
        title: n.title,
        region: n.region,
        summary: n.summary.slice(0, 180),
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
    .filter((w) => w.length >= 4 && !stopWords.has(w));
}

/**
 * STAGE 2B: Deterministic Cross-Node Relationship Analyzer
 * Scans all existing nodes in the Vault whenever a node is opened or created,
 * discovering meaningful semantic connections (same-domain extension/related_concept
 * or cross-region bridge) that do not yet have an edge.
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

  const scoredCandidates: {
    other: KnowledgeNode;
    score: number;
    sharedTerm?: string;
  }[] = [];

  for (const other of existingNodes) {
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

    // Also reward explored nodes or complementary regions so new nodes weave into the graph
    const regionBonus = other.region !== focusNode.region ? 1.5 : 1.0;
    const exploredBonus = other.explored ? 1.2 : 0.5;
    const totalScore = sharedCount * 3 + regionBonus + exploredBonus;

    if (totalScore >= 2.2) {
      scoredCandidates.push({
        other,
        score: totalScore,
        sharedTerm: firstShared,
      });
    }
  }

  scoredCandidates.sort((a, b) => b.score - a.score);

  const discovered: OrchestratorCrossLink[] = [];
  for (const cand of scoredCandidates.slice(0, 2)) {
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
 * STAGE 2A: Compile Prompt & Strict JSON Output Contract for LLM
 */
function buildOrchestratorPrompt(envelope: OrchestratorInputEnvelope): string {
  const { intent, lang, vaultContext, nodeAction, existingGraphSnapshot } =
    envelope;
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

  return `You are the Curiora AI Knowledge Orchestrator.
Your job is to process a structured input envelope from the Curiora web application and return a strictly formatted JSON response envelope.

STRICT RULES:
1. ${langInstruction}
2. NEVER output internal codes like "REG-01", "Mode A", "Mode B", "BR-", or "NFR-" inside user-visible text.
3. Valid region codes for the "region" property ONLY: "REG-01", "REG-02", "REG-03", "REG-04", "REG-05", "REG-06".
4. Valid edge relations ONLY: "prerequisite", "extension", "application", "related_concept", "cross_disciplinary".
5. Every edge MUST include a clear 1-sentence scientific "reason".
6. Check EXISTING NODES in the vault and output 1-2 "crossLinks" if the opened/new node genuinely relates to other existing nodes in the vault!

INPUT ENVELOPE:
- Intent: ${intent}
- Vault Name: ${vaultContext.vaultName}
- Main Interest: ${vaultContext.identity.mainInterest}
- Focus Question: ${vaultContext.identity.focusQuestion}
- Learning Goal: ${vaultContext.identity.learningGoal}
- Target Node ID: ${nodeAction.targetNodeId || "new"}
- Target Node Title: ${nodeAction.nodeTitle || "Auto-derive from context"}
- ${userInputSummary}
- Existing Graph Nodes (${existingGraphSnapshot.nodes.length}):
${JSON.stringify(existingGraphSnapshot.nodes, null, 2)}

RETURN ONLY VALID JSON MATCHING THIS EXACT CONTRACT:
{
  "primaryNode": {
    "title": "Clear 2-5 word concept title",
    "region": "REG-01",
    "difficulty": "Foundation | Basic | Intermediate | Advanced",
    "summary": "2-sentence synthesis integrating the user's prompt/chapter/note and vault context.",
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
      "title": "Next progressive concept 1 (2-5 words)",
      "region": "REG-02",
      "relation": "extension | prerequisite | application | cross_disciplinary",
      "edgeReason": "Why this next node branches from primaryNode",
      "difficulty": "Intermediate",
      "summary": "2-sentence teaser summary for this frontier node."
    }
  ],
  "crossLinks": [
    {
      "existingNodeId": "id-from-existing-graph",
      "relation": "related_concept | cross_disciplinary | extension | application",
      "reason": "Specific reason why primaryNode connects to this existing node in the vault."
    }
  ]
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

  // Extract comma/line-separated subtopics if user pasted a chapter or list
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

  for (const part of rawParts) {
    if (
      !existingTitles.has(part.toLowerCase()) &&
      part.toLowerCase() !== parentNode.title.toLowerCase()
    ) {
      const reg = inferStartingRegion(`${part} ${identity.mainInterest}`);
      const isCross = reg !== parentNode.region;
      candidates.push({
        title: part,
        region: reg,
        relation: isCross ? "cross_disciplinary" : "extension",
        reason:
          lang === "en"
            ? `Derived directly from your material on ${parentNode.title} to deepen ${part}.`
            : `Diturunkan langsung dari materi ${parentNode.title} untuk memperdalam ${part}.`,
        difficulty: "Intermediate",
      });
    }
  }

  const adjReg = ADJACENT_REGION[parentNode.region] || "REG-02";
  const crossReg = CROSS_REGION[parentNode.region] || "REG-03";
  const baseShort = parentNode.title
    .replace(/^(Foundations|Fondasi|Applied|Terapan|Mechanism|Mekanisme):\s*/i, "")
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
            title: `Applied ${baseShort} in ${regionNameForLang(adjReg, "en")}`,
            region: adjReg,
            relation: "application" as EdgeRelationType,
            reason: `Applies ${parentNode.title} into ${regionNameForLang(adjReg, "en")}.`,
            difficulty: "Intermediate" as DifficultyLevel,
          },
          {
            title: `${regionNameForLang(crossReg, "en")} Bridge: ${baseShort}`,
            region: crossReg,
            relation: "cross_disciplinary" as EdgeRelationType,
            reason: `Cross-disciplinary bridge connecting ${parentNode.title} with ${regionNameForLang(crossReg, "en")}.`,
            difficulty: "Advanced" as DifficultyLevel,
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
            title: `Terapan ${baseShort} (${regionNameForLang(adjReg, "id")})`,
            region: adjReg,
            relation: "application" as EdgeRelationType,
            reason: `Menerapkan prinsip ${parentNode.title} ke bidang ${regionNameForLang(adjReg, "id")}.`,
            difficulty: "Intermediate" as DifficultyLevel,
          },
          {
            title: `Jembatan ${regionNameForLang(crossReg, "id")}: ${baseShort}`,
            region: crossReg,
            relation: "cross_disciplinary" as EdgeRelationType,
            reason: `Jembatan lintas-disiplin yang menghubungkan ${parentNode.title} dengan ${regionNameForLang(crossReg, "id")}.`,
            difficulty: "Advanced" as DifficultyLevel,
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
 * STAGE 3–5: Execute Orchestrator Pipeline (LLM + Deterministic Fallback + Cross-Node Analyzer + DAG Guard)
 */
export async function executeOrchestratorPipeline(params: {
  intent: OrchestratorIntent;
  vault: KnowledgeVault;
  nodeAction: OrchestratorNodePayload;
  lang?: "en" | "id";
}): Promise<OrchestratorOutputEnvelope> {
  const lang: "en" | "id" = params.lang === "id" ? "id" : "en";
  const normalizedVault = normalizeVault(params.vault);
  const envelope = assembleOrchestratorEnvelope({
    intent: params.intent,
    vault: normalizedVault,
    nodeAction: params.nodeAction,
    lang,
  });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  let engineUsed = "Curiora Orchestrator (Deterministic Graph & Relation Engine)";

  const identity = deriveVaultIdentity(normalizedVault);
  const startReg = inferStartingRegion(
    `${params.nodeAction.nodeTitle || ""} ${params.nodeAction.inputTitle || ""} ${params.nodeAction.inputContent || ""} ${identity.mainInterest} ${identity.focusQuestion}`
  );

  let workingNodes = [...normalizedVault.nodes];
  let workingEdges = [...normalizedVault.edges];
  let openedNodeId = params.nodeAction.targetNodeId || "";
  const spawnedFrontierNodeIds: string[] = [];
  let crossLinksDiscovered: OrchestratorCrossLink[] = [];
  const flaggedReviewNodeIds: string[] = [];

  // Optional Gemini 2.5 Flash LLM execution with strict JSON contract
  let llmData: {
    primaryNode?: {
      title?: string;
      region?: RegionCode;
      difficulty?: DifficultyLevel;
      summary?: string;
      levels?: { simple?: string; standard?: string; deep?: string };
      formula?: string;
      application?: string;
      reference?: string;
      quickCheck?: {
        question?: string;
        options?: { text: string; correct: boolean }[];
      };
    };
    frontierNodes?: {
      title?: string;
      region?: RegionCode;
      relation?: EdgeRelationType;
      edgeReason?: string;
      difficulty?: DifficultyLevel;
      summary?: string;
    }[];
    crossLinks?: {
      existingNodeId?: string;
      relation?: EdgeRelationType;
      reason?: string;
    }[];
  } | null = null;

  if (apiKey && apiKey.length > 10 && params.intent !== "ANALYZE_RELATIONS") {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: buildOrchestratorPrompt(envelope) }],
              },
            ],
            generationConfig: {
              temperature: 0.35,
              responseMimeType: "application/json",
            },
          }),
        }
      );
      if (response.ok) {
        const json = await response.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (rawText) {
          llmData = JSON.parse(rawText);
          engineUsed = "Curiora Orchestrator (Gemini 2.5 Flash + DAG Guard)";
        }
      }
    } catch {
      // Fallback cleanly to deterministic synthesizer
    }
  }

  const now = new Date().toISOString();

  // CASE A: Unlock / Open an existing Node on the Tree (or enrich it with Note / Prompt / Chapter)
  if (
    params.intent === "OPEN_NODE" &&
    params.nodeAction.targetNodeId &&
    workingNodes.some((n) => n.id === params.nodeAction.targetNodeId)
  ) {
    const existingTarget = workingNodes.find(
      (n) => n.id === params.nodeAction.targetNodeId
    )!;
    openedNodeId = existingTarget.id;

    const synthesized = buildSynthesizedPrimaryNode({
      id: existingTarget.id,
      title: params.nodeAction.nodeTitle || existingTarget.title,
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
        explored: true,
        nodeInputMode: params.nodeAction.openMode,
        nodeSourceTitle:
          params.nodeAction.inputTitle || existingTarget.nodeSourceTitle,
        nodeSourceContent:
          params.nodeAction.inputContent || existingTarget.nodeSourceContent,
      },
      {
        kind: hasUserInput ? "manual_edit" : "initial_ai",
        label:
          lang === "en"
            ? hasUserInput
              ? `Opened with ${params.nodeAction.openMode.replace("_", " ")}`
              : "Opened node material"
            : hasUserInput
              ? "Dibuka dengan materi/catatan"
              : "Membuka materi node",
        summary:
          llmData?.primaryNode?.summary ||
          (hasUserInput ? synthesized.summary : existingTarget.summary),
        levels: {
          simple:
            llmData?.primaryNode?.levels?.simple ||
            (hasUserInput
              ? synthesized.levels.simple
              : existingTarget.levels.simple),
          standard:
            llmData?.primaryNode?.levels?.standard ||
            (hasUserInput
              ? synthesized.levels.standard
              : existingTarget.levels.standard),
          deep:
            llmData?.primaryNode?.levels?.deep ||
            (hasUserInput
              ? synthesized.levels.deep
              : existingTarget.levels.deep),
        },
        formula:
          llmData?.primaryNode?.formula ||
          (hasUserInput ? synthesized.formula : existingTarget.formula),
        application:
          llmData?.primaryNode?.application ||
          (hasUserInput ? synthesized.application : existingTarget.application),
        userAnnotation:
          params.nodeAction.openMode === "user_note" &&
          params.nodeAction.inputContent
            ? params.nodeAction.inputContent
            : existingTarget.userAnnotation,
        origin: hasUserInput ? synthesized.origin : existingTarget.origin,
        reviewStatus: "reviewed",
      }
    );

    workingNodes = workingNodes.map((n) =>
      n.id === existingTarget.id ? updatedNode : n
    );

    // Check if this node already has outgoing frontier children; if 0, spawn 2 progressive frontier nodes in Fog of War!
    const outgoingCount = workingEdges.filter(
      (e) => e.source === existingTarget.id
    ).length;

    if (outgoingCount === 0 || hasUserInput) {
      const frontierSpecs =
        llmData?.frontierNodes && llmData.frontierNodes.length > 0
          ? llmData.frontierNodes.slice(0, 2).map((f) => ({
              title: f.title || "Connected Concept",
              region: (f.region as RegionCode) || ADJACENT_REGION[updatedNode.region],
              relation: (f.relation as EdgeRelationType) || "extension",
              reason:
                f.edgeReason ||
                (lang === "en"
                  ? `Branches progressively from ${updatedNode.title}.`
                  : `Cabang eksplorasi lanjutan dari ${updatedNode.title}.`),
              difficulty: (f.difficulty as DifficultyLevel) || "Intermediate",
            }))
          : deriveFrontierTopics({
              parentNode: updatedNode,
              vault: normalizedVault,
              inputContent: params.nodeAction.inputContent,
              count: 2,
              lang,
            });

      frontierSpecs.forEach((fp, idx) => {
        const fId = `n_front_${Date.now()}_${idx}`;
        const fNode = buildSynthesizedPrimaryNode({
          id: fId,
          title: fp.title,
          region: fp.region,
          difficulty: fp.difficulty,
          relationToOrigin: fp.relation,
          openMode: "instant_ai",
          vault: normalizedVault,
          lang,
        });
        fNode.explored = false; // Spawned in Fog of War until user chooses to open it!
        workingNodes.push(fNode);
        spawnedFrontierNodeIds.push(fId);

        workingEdges.push({
          id: `e_front_${Date.now()}_${idx}`,
          source: updatedNode.id,
          target: fId,
          relation: fp.relation,
          reason: fp.reason,
          isCrossRegion: fp.region !== updatedNode.region,
        });
      });
    }

    // Run Cross-Node Relationship Analyzer against all existing nodes in the Vault
    crossLinksDiscovered = analyzeCrossNodeRelationships({
      focusNode: updatedNode,
      existingNodes: workingNodes.filter(
        (n) => !spawnedFrontierNodeIds.includes(n.id)
      ),
      existingEdges: workingEdges,
      lang,
    });
  } else {
    // CASE B: SEED_FIRST_NODE or BRANCH_NEW_NODE
    const parentNode = params.nodeAction.parentNodeId
      ? workingNodes.find((n) => n.id === params.nodeAction.parentNodeId)
      : workingNodes[0];

    const isFirstNode = workingNodes.length === 0;
    const newId = isFirstNode ? "root" : `n_node_${Date.now()}`;
    openedNodeId = newId;

    const rawTitle =
      llmData?.primaryNode?.title ||
      params.nodeAction.nodeTitle ||
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

    // Spawn 2–3 progressive frontier nodes in Fog of War (`explored: false`)
    const frontierCount = isFirstNode ? 3 : 2;
    const frontierSpecs =
      llmData?.frontierNodes && llmData.frontierNodes.length > 0
        ? llmData.frontierNodes.slice(0, frontierCount).map((f) => ({
            title: f.title || "Next Concept",
            region:
              (f.region as RegionCode) || ADJACENT_REGION[primaryNode.region],
            relation: (f.relation as EdgeRelationType) || "extension",
            reason:
              f.edgeReason ||
              (lang === "en"
                ? `Progressive branch from ${primaryNode.title}.`
                : `Cabang bertahap dari ${primaryNode.title}.`),
            difficulty: (f.difficulty as DifficultyLevel) || "Basic",
          }))
        : deriveFrontierTopics({
            parentNode: primaryNode,
            vault: { ...normalizedVault, nodes: workingNodes },
            inputContent: params.nodeAction.inputContent,
            count: frontierCount,
            lang,
          });

    frontierSpecs.forEach((fp, idx) => {
      const fId = `n_front_${Date.now()}_${idx}`;
      const fNode = buildSynthesizedPrimaryNode({
        id: fId,
        title: fp.title,
        region: fp.region,
        difficulty: fp.difficulty,
        relationToOrigin: fp.relation,
        openMode: "instant_ai",
        vault: normalizedVault,
        lang,
      });
      fNode.explored = false; // Starts in Fog of War so user opens nodes one by one!
      workingNodes.push(fNode);
      spawnedFrontierNodeIds.push(fId);

      workingEdges.push({
        id: `e_front_${Date.now()}_${idx}`,
        source: primaryNode.id,
        target: fId,
        relation: fp.relation,
        reason: fp.reason,
        isCrossRegion: fp.region !== primaryNode.region,
      });
    });

    // Run Cross-Node Relationship Analyzer against all other existing nodes in the Vault
    crossLinksDiscovered = analyzeCrossNodeRelationships({
      focusNode: primaryNode,
      existingNodes: workingNodes.filter(
        (n) => n.id !== primaryNode.id && !spawnedFrontierNodeIds.includes(n.id)
      ),
      existingEdges: workingEdges,
      parentNodeId: parentNode?.id,
      lang,
    });
  }

  // Merge any LLM-suggested crossLinks as well
  if (Array.isArray(llmData?.crossLinks)) {
    for (const cl of llmData.crossLinks) {
      if (!cl.existingNodeId || !cl.reason) continue;
      const exists = workingNodes.find((n) => n.id === cl.existingNodeId);
      if (
        exists &&
        exists.id !== openedNodeId &&
        !crossLinksDiscovered.some((d) => d.sourceId === exists.id)
      ) {
        const focusN = workingNodes.find((n) => n.id === openedNodeId);
        const isCross = Boolean(focusN && focusN.region !== exists.region);
        crossLinksDiscovered.push({
          sourceId: exists.id,
          targetId: openedNodeId,
          relation: cl.relation || (isCross ? "cross_disciplinary" : "related_concept"),
          reason: cleanLegacyText(cl.reason),
          isCrossRegion: isCross,
        });
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

  // STAGE 4: Validate DAG, Anti-Orphan, and compute Organic Staggered Layout
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
      keyConcepts: validated.nodes.slice(0, 6).map((n) => n.title),
    },
    nodes: validated.nodes,
    edges: validated.edges,
    validation: validated.validation,
  });

  return {
    ok: true,
    trace: {
      requestId: envelope.requestId,
      intent: params.intent,
      engineUsed,
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
