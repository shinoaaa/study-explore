export type ExplorationMode = "mode_a" | "mode_b";

export type ExplorationPath = "material" | "curiosity";

export type SourceFormat =
  | "book_chapter"
  | "article"
  | "lecture_notes"
  | "topic"
  | "curiosity";

export type NodeOrigin = "ai_generated" | "user_edited" | "user_source";

export type NodeReviewStatus = "needs_review" | "reviewed";

export type NodeOpenInputMode =
  | "instant_ai"
  | "user_note"
  | "custom_prompt"
  | "book_chapter";

export type OrchestratorIntent =
  | "SEED_FIRST_NODE"
  | "OPEN_NODE"
  | "BRANCH_NEW_NODE"
  | "EXPAND_FOG_BRANCHES"
  | "ANALYZE_RELATIONS"
  | "REVISE_NOTE";

export type RegionCode =
  | "REG-01"
  | "REG-02"
  | "REG-03"
  | "REG-04"
  | "REG-05"
  | "REG-06";

export type EdgeRelationType =
  | "prerequisite"
  | "extension"
  | "application"
  | "related_concept"
  | "cross_disciplinary";

export type DifficultyLevel =
  | "Foundation"
  | "Basic"
  | "Intermediate"
  | "Advanced";

export type ExplanationDepth = "simple" | "standard" | "deep";

export interface QuickCheckOption {
  text: string;
  correct: boolean;
}

export interface QuickCheckQuiz {
  question: string;
  options: QuickCheckOption[];
}

export interface ExplanationLevels {
  simple: string;
  standard: string;
  deep: string;
}

export interface NodeRevision {
  id: string;
  version: number;
  createdAt: string;
  kind: "initial_ai" | "manual_edit" | "ai_revise_accepted" | "restored";
  label: string;
  summary: string;
  levels: ExplanationLevels;
  formula?: string;
  application?: string;
  userAnnotation?: string;
}

export interface KnowledgeNode {
  id: string;
  title: string;
  region: RegionCode;
  relationToOrigin: EdgeRelationType | "root";
  difficulty: DifficultyLevel;
  x: number;
  y: number;
  explored: boolean;
  mastered: boolean;
  summary: string;
  levels: ExplanationLevels;
  formula: string;
  application: string;
  reference: string;
  quickCheck: QuickCheckQuiz;
  origin?: NodeOrigin;
  nodeInputMode?: NodeOpenInputMode;
  nodeSourceTitle?: string;
  nodeSourceContent?: string;
  userAnnotation?: string;
  reviewStatus?: NodeReviewStatus;
  reviewReason?: string;
  isFavorite?: boolean;
  revisions?: NodeRevision[];
  sourceIds?: string[];
  updatedAt?: string;
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  relation: EdgeRelationType;
  reason: string;
  isCrossRegion?: boolean;
}

export interface LearningSource {
  id: string;
  title: string;
  format: SourceFormat;
  chapterOrSection?: string;
  excerptOrNotes: string;
  focusQuestion: string;
  origin: "user_source";
  isFavorite?: boolean;
  reviewStatus?: NodeReviewStatus;
  createdAt: string;
  updatedAt: string;
  linkedNodeIds: string[];
}

export interface ExplorationContext {
  id: string;
  path: ExplorationPath;
  sourceId?: string;
  title: string;
  subjectOrTopic?: string;
  chapterOrSection?: string;
  focusQuestion: string;
  explorationGoal: string;
  depth: ExplanationDepth;
  createdAt: string;
  mappedNodeIds: string[];
}

export interface VaultIdentity {
  mainInterest: string;
  shortDescription: string;
  focusQuestion: string;
  learningGoal: string;
  relatedInterests: string[];
  difficultyComfort?: DifficultyLevel;
}

export interface OverviewModule {
  title: string;
  startingRegion: RegionCode;
  summary: string;
  keyConcepts: string[];
  coreFormulaOrPrinciple: string;
  primaryReference: string;
}

export interface ValidationReport {
  schemaValid: boolean;
  dagAcyclic: boolean;
  orphanEdgesRemoved: number;
  duplicateNodesRemoved: number;
  prerequisiteSeparated: boolean;
  crossDisciplinaryCount: number;
  regionsCovered: RegionCode[];
  checkedAt: string;
}

export interface VaultInputContext {
  mode: ExplorationMode;
  subject?: string;
  chapter?: string;
  subchapters?: string;
  interestDomain: string;
  targetGoal: string;
  motivation?: string;
}

export interface KnowledgeVault {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isPreset?: boolean;
  identity?: VaultIdentity;
  learningSources?: LearningSource[];
  explorations?: ExplorationContext[];
  inputContext: VaultInputContext;
  overview: OverviewModule;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  validation: ValidationReport;
}

export interface OrchestratorGraphDigestNode {
  id: string;
  title: string;
  region: RegionCode;
  summary: string;
  explored: boolean;
  mastered: boolean;
}

export interface OrchestratorGraphDigestEdge {
  source: string;
  target: string;
  relation: EdgeRelationType;
  reason: string;
}

export interface OrchestratorNodePayload {
  targetNodeId?: string;
  parentNodeId?: string;
  nodeTitle?: string;
  openMode: NodeOpenInputMode;
  inputTitle?: string;
  inputContent?: string;
  preferredDepth?: ExplanationDepth;
}

export interface OrchestratorValidationGate {
  status: "valid" | "typo_corrected" | "rejected_too_far";
  originalTitle: string;
  normalizedTitle: string;
  dangerMessage?: string;
}

export interface OrchestratorSpatialTopologyPlan {
  primaryRegion: RegionCode;
  adjacentRegionCandidates: RegionCode[];
  activeRegions: RegionCode[];
  regionNodeCounts: Record<RegionCode, number>;
  maxCrossRegionLinksPerNode: number;
  boundaryNodeIdsByRegion: Partial<Record<RegionCode, string[]>>;
  layoutDirective: string;
}

export interface OrchestratorInputEnvelope {
  requestId: string;
  intent: OrchestratorIntent;
  lang: "en" | "id";
  vaultContext: {
    vaultId: string;
    vaultName: string;
    identity: VaultIdentity;
  };
  nodeAction: OrchestratorNodePayload;
  preValidationGate: OrchestratorValidationGate;
  spatialTopologyPlan: OrchestratorSpatialTopologyPlan;
  existingGraphSnapshot: {
    nodes: OrchestratorGraphDigestNode[];
    edges: OrchestratorGraphDigestEdge[];
  };
}

export interface OrchestratorCrossLink {
  sourceId: string;
  targetId: string;
  relation: EdgeRelationType;
  reason: string;
  isCrossRegion: boolean;
}

export interface OrchestratorStageTrace {
  requestId: string;
  intent: OrchestratorIntent;
  engineUsed: string;
  validationStatus: "valid" | "typo_corrected" | "rejected_too_far";
  openedNodeId: string;
  spawnedFrontierNodeIds: string[];
  crossLinksDiscovered: OrchestratorCrossLink[];
  flaggedReviewNodeIds: string[];
  dagValid: boolean;
  processedAt: string;
}

export interface OrchestratorOutputEnvelope {
  ok: boolean;
  validationGate?: OrchestratorValidationGate;
  trace: OrchestratorStageTrace;
  vault: KnowledgeVault;
}
