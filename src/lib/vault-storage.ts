import { inferStartingRegion } from "@/lib/regions";
import { validateAndBuildGraph } from "@/lib/validator";
import {
  ExplorationContext,
  ExplanationLevels,
  KnowledgeEdge,
  KnowledgeNode,
  KnowledgeVault,
  LearningSource,
  NodeOrigin,
  NodeReviewStatus,
  NodeRevision,
  OverviewModule,
  VaultIdentity,
} from "@/types/knowledge";

/**
 * Remove leaked internal or legacy codes from user-facing strings.
 */
export function cleanLegacyText(text?: string): string {
  if (!text) return "";
  return text
    .replace(/\s*\(REG-0[1-6]\)/g, "")
    .replace(/\bREG-0[1-6]\s*[·:\-–]?\s*/g, "")
    .replace(/Lintas-Region/g, "Lintas-Bidang")
    .replace(/\bd\(([^)]*?)\s+[&/+-]+\s*\)\/dt/g, "d($1)/dt")
    .replace(/^(Pendalaman:\s*Dinamika\s*){2,}/i, "Pendalaman: Dinamika ")
    .replace(/^(Deeper Dynamics:\s*){2,}/i, "Deeper Dynamics: ");
}

/**
 * Derive structured VaultIdentity from an existing or legacy vault.
 */
export function deriveVaultIdentity(vault: KnowledgeVault): VaultIdentity {
  if (vault.identity && vault.identity.mainInterest) {
    return {
      mainInterest: cleanLegacyText(vault.identity.mainInterest),
      shortDescription: cleanLegacyText(vault.identity.shortDescription),
      focusQuestion: cleanLegacyText(vault.identity.focusQuestion),
      learningGoal: cleanLegacyText(vault.identity.learningGoal),
      relatedInterests: (vault.identity.relatedInterests || []).map(cleanLegacyText),
      difficultyComfort: vault.identity.difficultyComfort || "Intermediate",
    };
  }

  const ctx = vault.inputContext;
  const related = (ctx.subchapters || "")
    .split(",")
    .map((s) => cleanLegacyText(s.trim()))
    .filter(Boolean)
    .slice(0, 5);

  return {
    mainInterest: cleanLegacyText(
      ctx.interestDomain || ctx.subject || vault.name
    ),
    shortDescription: cleanLegacyText(
      vault.overview?.summary || ctx.motivation || ctx.targetGoal
    ),
    focusQuestion: cleanLegacyText(
      ctx.targetGoal || ctx.chapter || vault.overview?.title || vault.name
    ),
    learningGoal: cleanLegacyText(
      ctx.motivation || ctx.targetGoal || vault.overview?.summary
    ),
    relatedInterests: related,
    difficultyComfort: "Intermediate",
  };
}

/**
 * Normalize a KnowledgeNode so origin, favorite state, revisions, and clean text are always present.
 */
export function normalizeNode(
  node: KnowledgeNode,
  fallbackSourceId?: string,
  fallbackTimestamp?: string
): KnowledgeNode {
  const ts = node.updatedAt || fallbackTimestamp || new Date().toISOString();
  const isExplored = Boolean(node.explored);
  const levels: ExplanationLevels = isExplored
    ? {
        simple: cleanLegacyText(node.levels?.simple),
        standard: cleanLegacyText(node.levels?.standard),
        deep: cleanLegacyText(node.levels?.deep),
      }
    : {
        simple: "",
        standard: "",
        deep: "",
      };
  const summary = isExplored ? cleanLegacyText(node.summary) : "";
  const formula = isExplored ? cleanLegacyText(node.formula) : "";
  const application = isExplored ? cleanLegacyText(node.application) : "";
  const reference = isExplored ? cleanLegacyText(node.reference) : "";

  const revisions: NodeRevision[] =
    Array.isArray(node.revisions) && node.revisions.length > 0
      ? node.revisions
      : isExplored
        ? [
            {
              id: `rev-${node.id}-1`,
              version: 1,
              createdAt: ts,
              kind: "initial_ai",
              label: "Initial AI Draft",
              summary,
              levels,
              formula,
              application,
              userAnnotation: node.userAnnotation,
            },
          ]
        : [];

  const sourceIds =
    Array.isArray(node.sourceIds) && node.sourceIds.length > 0
      ? node.sourceIds
      : fallbackSourceId
        ? [fallbackSourceId]
        : [];

  return {
    ...node,
    title: cleanLegacyText(node.title),
    summary,
    formula,
    application,
    reference,
    levels,
    origin: node.origin || "ai_generated",
    isFavorite: Boolean(node.isFavorite),
    reviewStatus: node.reviewStatus,
    reviewReason: node.reviewReason
      ? cleanLegacyText(node.reviewReason)
      : undefined,
    revisions,
    sourceIds,
    updatedAt: ts,
  };
}

export function sanitizeEdge(edge: KnowledgeEdge): KnowledgeEdge {
  return {
    ...edge,
    reason: cleanLegacyText(edge.reason),
  };
}

/**
 * Normalize any KnowledgeVault (including legacy localStorage objects or presets)
 * into the multi-source, revision-aware Curiora vault model.
 */
export function normalizeVault(vault: KnowledgeVault): KnowledgeVault {
  const identity = deriveVaultIdentity(vault);
  const ts = vault.updatedAt || vault.createdAt || new Date().toISOString();
  const hasNodes = Array.isArray(vault.nodes) && vault.nodes.length > 0;

  let learningSources: LearningSource[] = Array.isArray(vault.learningSources)
    ? vault.learningSources.map((s) => ({
        ...s,
        title: cleanLegacyText(s.title),
        chapterOrSection: s.chapterOrSection
          ? cleanLegacyText(s.chapterOrSection)
          : undefined,
        excerptOrNotes: cleanLegacyText(s.excerptOrNotes),
        focusQuestion: cleanLegacyText(s.focusQuestion),
        origin: "user_source",
        isFavorite: Boolean(s.isFavorite),
        linkedNodeIds: Array.isArray(s.linkedNodeIds) ? s.linkedNodeIds : [],
      }))
    : [];

  let explorations: ExplorationContext[] = Array.isArray(vault.explorations)
    ? vault.explorations
    : [];

  // Derive legacy initial source & exploration only when the vault already has mapped concepts
  const derivedSourceId = `src-init-${vault.id}`;
  if (hasNodes && learningSources.length === 0) {
    const isMaterial =
      vault.inputContext.mode === "mode_a" || Boolean(vault.inputContext.chapter);
    learningSources = [
      {
        id: derivedSourceId,
        title: cleanLegacyText(
          vault.inputContext.chapter ||
            vault.inputContext.subject ||
            identity.focusQuestion ||
            vault.name
        ),
        format: isMaterial ? "book_chapter" : "curiosity",
        chapterOrSection: cleanLegacyText(
          vault.inputContext.subject || vault.inputContext.chapter || ""
        ) || undefined,
        excerptOrNotes: cleanLegacyText(
          vault.inputContext.subchapters ||
            vault.inputContext.motivation ||
            vault.overview?.summary
        ),
        focusQuestion: identity.focusQuestion,
        origin: "user_source",
        isFavorite: false,
        createdAt: vault.createdAt || ts,
        updatedAt: ts,
        linkedNodeIds: vault.nodes.map((n) => n.id),
      },
    ];
  }

  if (hasNodes && explorations.length === 0) {
    const isMaterial =
      vault.inputContext.mode === "mode_a" || Boolean(vault.inputContext.chapter);
    explorations = [
      {
        id: `exp-init-${vault.id}`,
        path: isMaterial ? "material" : "curiosity",
        sourceId: learningSources[0]?.id,
        title: cleanLegacyText(
          vault.inputContext.chapter || identity.focusQuestion || vault.name
        ),
        subjectOrTopic: cleanLegacyText(
          vault.inputContext.subject || identity.mainInterest
        ),
        chapterOrSection: vault.inputContext.chapter
          ? cleanLegacyText(vault.inputContext.chapter)
          : undefined,
        focusQuestion: identity.focusQuestion,
        explorationGoal: identity.learningGoal,
        depth: "standard",
        createdAt: vault.createdAt || ts,
        mappedNodeIds: vault.nodes.map((n) => n.id),
      },
    ];
  }

  const fallbackSourceId = learningSources[0]?.id;
  const rawNodes = (vault.nodes || []).map((n) =>
    normalizeNode(n, fallbackSourceId, ts)
  );
  const rawEdges = (vault.edges || []).map(sanitizeEdge);

  const validated =
    rawNodes.length > 0
      ? validateAndBuildGraph(rawNodes, rawEdges)
      : { nodes: [], edges: [], validation: vault.validation };

  return {
    ...vault,
    name: cleanLegacyText(vault.name),
    identity,
    learningSources,
    explorations,
    overview: {
      ...vault.overview,
      title: cleanLegacyText(vault.overview?.title || vault.name),
      summary: cleanLegacyText(
        vault.overview?.summary || identity.shortDescription
      ),
      coreFormulaOrPrinciple: cleanLegacyText(
        vault.overview?.coreFormulaOrPrinciple || identity.focusQuestion
      ),
      primaryReference: cleanLegacyText(vault.overview?.primaryReference || ""),
    },
    nodes: validated.nodes,
    edges: validated.edges,
    validation: validated.validation || vault.validation,
  };
}

/**
 * Create a clean, empty Vault storing only its identity until the user adds explorations/sources.
 */
export function createEmptyVault(params: {
  vaultName: string;
  identity: VaultIdentity;
  lang: "en" | "id";
}): KnowledgeVault {
  const { vaultName, identity, lang } = params;
  const now = new Date().toISOString();
  const isEn = lang === "en";
  const startingRegion = inferStartingRegion(
    `${vaultName} ${identity.mainInterest} ${identity.focusQuestion} ${identity.relatedInterests.join(" ")}`
  );

  return {
    id: `vault-${Date.now()}`,
    name: vaultName.trim(),
    createdAt: now,
    updatedAt: now,
    isPreset: false,
    identity: {
      ...identity,
      relatedInterests: identity.relatedInterests.filter(Boolean),
    },
    learningSources: [],
    explorations: [],
    inputContext: {
      mode: "mode_b",
      interestDomain: identity.mainInterest,
      targetGoal: identity.focusQuestion || identity.learningGoal || vaultName,
      motivation: identity.shortDescription || identity.learningGoal,
    },
    overview: {
      title: vaultName.trim(),
      startingRegion,
      summary:
        identity.shortDescription.trim() ||
        identity.learningGoal.trim() ||
        (isEn
          ? `Personal knowledge vault focused on ${identity.mainInterest}.`
          : `Vault pengetahuan pribadi untuk mendalami ${identity.mainInterest}.`),
      keyConcepts:
        identity.relatedInterests.length > 0
          ? identity.relatedInterests
          : [identity.mainInterest],
      coreFormulaOrPrinciple:
        identity.focusQuestion.trim() ||
        identity.learningGoal.trim() ||
        identity.mainInterest,
      primaryReference: isEn
        ? "Add your first source material or curiosity question to grow this vault."
        : "Tambahkan materi bacaan atau pertanyaan pertamamu untuk mulai menumbuhkan vault ini.",
    },
    nodes: [],
    edges: [],
    validation: {
      schemaValid: true,
      dagAcyclic: true,
      orphanEdgesRemoved: 0,
      duplicateNodesRemoved: 0,
      prerequisiteSeparated: true,
      crossDisciplinaryCount: 0,
      regionsCovered: [],
      checkedAt: now,
    },
  };
}

/**
 * Append an immutable revision record when the user edits, accepts AI revision, or restores a version.
 */
export function appendRevisionToNode(
  node: KnowledgeNode,
  patch: {
    kind: NodeRevision["kind"];
    label: string;
    summary: string;
    levels: ExplanationLevels;
    formula?: string;
    application?: string;
    userAnnotation?: string;
    origin?: NodeOrigin;
    reviewStatus?: NodeReviewStatus;
    reviewReason?: string;
  }
): KnowledgeNode {
  const now = new Date().toISOString();
  const baseNode = normalizeNode(node);
  const existingRevs = baseNode.revisions || [];
  const nextVersion =
    existingRevs.reduce((max, r) => Math.max(max, r.version), 0) + 1;

  const newRev: NodeRevision = {
    id: `rev-${baseNode.id}-${nextVersion}-${Date.now()}`,
    version: nextVersion,
    createdAt: now,
    kind: patch.kind,
    label: patch.label,
    summary: patch.summary,
    levels: patch.levels,
    formula: patch.formula ?? baseNode.formula,
    application: patch.application ?? baseNode.application,
    userAnnotation: patch.userAnnotation,
  };

  return {
    ...baseNode,
    summary: patch.summary,
    levels: patch.levels,
    formula: patch.formula ?? baseNode.formula,
    application: patch.application ?? baseNode.application,
    userAnnotation: patch.userAnnotation,
    origin: patch.origin ?? "user_edited",
    reviewStatus: patch.reviewStatus ?? "reviewed",
    reviewReason: patch.reviewReason,
    revisions: [...existingRevs, newRev],
    updatedAt: now,
  };
}

/**
 * Merge a new exploration context + generated nodes/edges non-destructively into an active Vault.
 * Existing user_edited nodes are NEVER overwritten; instead closely overlapping ones are flagged "needs_review".
 */
export function mergeExplorationIntoVault(params: {
  vault: KnowledgeVault;
  exploration: ExplorationContext;
  newSource?: LearningSource;
  incomingNodes: KnowledgeNode[];
  incomingEdges: KnowledgeEdge[];
  overview?: OverviewModule;
  lang: "en" | "id";
}): {
  vault: KnowledgeVault;
  addedNodeIds: string[];
  flaggedReviewIds: string[];
} {
  const { vault, exploration, newSource, incomingNodes, incomingEdges, overview, lang } =
    params;
  const now = new Date().toISOString();
  const isEn = lang === "en";
  const normalizedVault = normalizeVault(vault);
  const sourceId = newSource?.id || exploration.sourceId;

  const existingById = new Map(normalizedVault.nodes.map((n) => [n.id, n]));
  const existingByTitle = new Map(
    normalizedVault.nodes.map((n) => [n.title.trim().toLowerCase(), n])
  );

  // Map incoming node ids to final existing or uniquely suffixed ids
  const idRemap = new Map<string, string>();
  const addedNodes: KnowledgeNode[] = [];
  const touchedExistingIds = new Set<string>();
  const suffix = Date.now().toString().slice(-4);

  for (let i = 0; i < incomingNodes.length; i++) {
    const raw = incomingNodes[i];
    const titleKey = raw.title.trim().toLowerCase();
    const matchByTitle = existingByTitle.get(titleKey);

    if (matchByTitle) {
      // Reuse existing node cleanly without duplicating or overwriting user content
      idRemap.set(raw.id, matchByTitle.id);
      touchedExistingIds.add(matchByTitle.id);
      continue;
    }

    let nextId = raw.id || `n_${suffix}_${i}`;
    if (existingById.has(nextId)) {
      nextId = `${nextId}_${suffix}_${i}`;
    }
    // Keep non-conflicting root as normal node if vault already has nodes
    const hasExistingNodes = normalizedVault.nodes.length > 0;
    const adjustedRelation =
      hasExistingNodes && raw.relationToOrigin === "root"
        ? "extension"
        : raw.relationToOrigin;

    idRemap.set(raw.id, nextId);
    const prepared = normalizeNode(
      {
        ...raw,
        id: nextId,
        relationToOrigin: adjustedRelation,
        origin: "ai_generated",
        isFavorite: false,
        sourceIds: sourceId ? [sourceId] : [],
        explored: !hasExistingNodes ? raw.explored : i === 0,
      },
      sourceId,
      now
    );
    addedNodes.push(prepared);
    existingById.set(nextId, prepared);
    existingByTitle.set(titleKey, prepared);
  }

  // Remap incoming edges and connect to existing vault if adding a second exploration to a populated vault
  const remappedEdges: KnowledgeEdge[] = incomingEdges.map((e, i) => ({
    ...sanitizeEdge(e),
    id: `${e.id || "e"}_${suffix}_${i}`,
    source: idRemap.get(e.source) || e.source,
    target: idRemap.get(e.target) || e.target,
  }));

  // Bridge first new node to existing vault root (or matched topic) when extending an already populated vault
  if (normalizedVault.nodes.length > 0 && addedNodes.length > 0) {
    const primaryNew = addedNodes[0];
    const hasIncomingFromExisting = remappedEdges.some(
      (e) =>
        e.target === primaryNew.id &&
        normalizedVault.nodes.some((en) => en.id === e.source)
    );
    if (!hasIncomingFromExisting) {
      const anchorExisting =
        normalizedVault.nodes.find((n) => touchedExistingIds.has(n.id)) ||
        normalizedVault.nodes.find((n) => n.relationToOrigin === "root") ||
        normalizedVault.nodes[0];

      if (anchorExisting && anchorExisting.id !== primaryNew.id) {
        const isCross = anchorExisting.region !== primaryNew.region;
        remappedEdges.unshift({
          id: `e_bridge_${suffix}`,
          source: anchorExisting.id,
          target: primaryNew.id,
          relation: isCross ? "cross_disciplinary" : "related_concept",
          isCrossRegion: isCross,
          reason: isEn
            ? `Connects your new exploration "${exploration.title}" back into "${anchorExisting.title}".`
            : `Menghubungkan eksplorasi baru "${exploration.title}" dengan "${anchorExisting.title}".`,
        });
      }
    }
  }

  // Non-destructive safeguard: preserve user_edited nodes & flag connected/overlapping ones as needs_review
  const directConnectedExistingIds = new Set<string>();
  for (const edge of remappedEdges) {
    if (normalizedVault.nodes.some((n) => n.id === edge.source)) {
      directConnectedExistingIds.add(edge.source);
    }
    if (normalizedVault.nodes.some((n) => n.id === edge.target)) {
      directConnectedExistingIds.add(edge.target);
    }
  }

  const flaggedReviewIds: string[] = [];
  const updatedExistingNodes = normalizedVault.nodes.map((node) => {
    const nextSourceIds =
      touchedExistingIds.has(node.id) && sourceId && !node.sourceIds?.includes(sourceId)
        ? [...(node.sourceIds || []), sourceId]
        : node.sourceIds;

    const isAffected =
      touchedExistingIds.has(node.id) || directConnectedExistingIds.has(node.id);

    if (node.origin === "user_edited" && isAffected) {
      flaggedReviewIds.push(node.id);
      return {
        ...node,
        sourceIds: nextSourceIds,
        reviewStatus: "needs_review" as const,
        reviewReason: isEn
          ? `New exploration "${exploration.title}" added connected concepts. Your edits were kept untouched.`
          : `Eksplorasi baru "${exploration.title}" menambah konsep terkait. Catatanmu tetap aman dan siap ditinjau.`,
      };
    }

    return {
      ...node,
      sourceIds: nextSourceIds,
    };
  });

  // Validate combined DAG while preserving all enriched metadata
  const combinedRawNodes = [...updatedExistingNodes, ...addedNodes];
  const combinedRawEdges = [...normalizedVault.edges, ...remappedEdges];
  const { nodes: builtNodes, edges: builtEdges, validation } = validateAndBuildGraph(
    combinedRawNodes,
    combinedRawEdges
  );

  // Re-attach user metadata safely by id
  const metaMap = new Map(combinedRawNodes.map((n) => [n.id, n]));
  const finalNodes = builtNodes.map((bn) => {
    const orig = metaMap.get(bn.id);
    if (!orig) return bn;
    return {
      ...bn,
      origin: orig.origin,
      isFavorite: orig.isFavorite,
      userAnnotation: orig.userAnnotation,
      reviewStatus: orig.reviewStatus,
      reviewReason: orig.reviewReason,
      revisions: orig.revisions,
      sourceIds: orig.sourceIds,
      updatedAt: orig.updatedAt,
    };
  });

  const finalExploration: ExplorationContext = {
    ...exploration,
    mappedNodeIds: addedNodes.map((n) => n.id),
  };

  const finalSources: LearningSource[] = newSource
    ? [
        {
          ...newSource,
          linkedNodeIds: Array.from(
            new Set([
              ...newSource.linkedNodeIds,
              ...addedNodes.map((n) => n.id),
              ...Array.from(touchedExistingIds),
            ])
          ),
        },
        ...(normalizedVault.learningSources || []),
      ]
    : (normalizedVault.learningSources || []).map((s) =>
        s.id === sourceId
          ? {
              ...s,
              updatedAt: now,
              linkedNodeIds: Array.from(
                new Set([
                  ...s.linkedNodeIds,
                  ...addedNodes.map((n) => n.id),
                ])
              ),
            }
          : s
      );

  const isVaultPreviouslyEmpty = normalizedVault.nodes.length === 0;
  const nextOverview: OverviewModule =
    isVaultPreviouslyEmpty && overview
      ? {
          ...overview,
          title: cleanLegacyText(overview.title || normalizedVault.name),
          summary: cleanLegacyText(
            overview.summary || normalizedVault.identity?.shortDescription || ""
          ),
        }
      : {
          ...normalizedVault.overview,
          keyConcepts: Array.from(
            new Set([
              ...normalizedVault.overview.keyConcepts,
              ...(overview?.keyConcepts || []),
            ])
          ).slice(0, 8),
        };

  return {
    addedNodeIds: addedNodes.map((n) => n.id),
    flaggedReviewIds,
    vault: {
      ...normalizedVault,
      updatedAt: now,
      learningSources: finalSources,
      explorations: [finalExploration, ...(normalizedVault.explorations || [])],
      overview: nextOverview,
      nodes: finalNodes,
      edges: builtEdges,
      validation,
    },
  };
}

export function countVaultFavorites(vault: KnowledgeVault): number {
  const nodeFavs = vault.nodes.filter((n) => n.isFavorite).length;
  const sourceFavs = (vault.learningSources || []).filter(
    (s) => s.isFavorite
  ).length;
  return nodeFavs + sourceFavs;
}

export function countVaultNeedsReview(vault: KnowledgeVault): number {
  return vault.nodes.filter((n) => n.reviewStatus === "needs_review").length;
}
