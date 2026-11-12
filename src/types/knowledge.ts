export type ExplorationMode = "mode_a" | "mode_b";

export type RegionCode =
  | "REG-01" // Natural & Life Sciences
  | "REG-02" // Health, Medicine & Performance
  | "REG-03" // Technology, Computing & AI
  | "REG-04" // Engineering & Applied Systems
  | "REG-05" // Formal Logic & Mathematics
  | "REG-06"; // Social, Economy & Humanities

export type EdgeRelationType =
  | "prerequisite"
  | "extension"
  | "application"
  | "related_concept"
  | "cross_disciplinary";

export type DifficultyLevel = "Foundation" | "Basic" | "Intermediate" | "Advanced";

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
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  relation: EdgeRelationType;
  reason: string;
  isCrossRegion?: boolean;
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
  // Mode A fields
  subject?: string;
  chapter?: string;
  subchapters?: string;
  // Mode B & shared personalization fields
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
  inputContext: VaultInputContext;
  overview: OverviewModule;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  validation: ValidationReport;
}
