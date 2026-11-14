import {
  AiProviderKind,
  DifficultyLevel,
  EdgeRelationType,
  OrchestratorBilingualPivotMeta,
  RegionCode,
} from "@/types/knowledge";

export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_OPENROUTER_NEMOTRON_MODEL =
  "nvidia/nemotron-3-ultra-550b-a55b:free";
export const DEFAULT_OPENROUTER_TRANSLATOR_MODEL =
  "nvidia/nemotron-3.5-lightning:free";
export const DEFAULT_OPENROUTER_FALLBACK_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3.5-lightning:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
];

export const DEFAULT_SUMOPOD_BASE_URL = "https://ai.sumopod.com/v1";
export const DEFAULT_SUMOPOD_MODEL = "gpt-4o-mini";
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export interface GatewayResolvedConfig {
  provider: AiProviderKind;
  apiKey: string;
  baseUrl: string;
  reasoningModel: string;
  translatorModel: string;
  fallbackModels: string[];
  requiresEnglishPivot: boolean;
}

/**
 * Resolves the active AI Provider & Model Configuration from environment variables.
 * Priority when AI_PROVIDER="auto" (or unset):
 * 1. OpenRouter (`OPENROUTER_API_KEY`) -> `nvidia/nemotron-3-ultra-550b-a55b:free` (NVIDIA: Nemotron 3 Ultra (free))
 * 2. SumoPod (`SUMOPOD_API_KEY`) -> `https://ai.sumopod.com/v1` (`gpt-4o-mini` / `deepseek-chat`)
 * 3. Google Gemini (`GEMINI_API_KEY`) -> `gemini-2.5-flash`
 * 4. Deterministic Bilingual Fallback Engine (when no API key is configured or offline)
 */
export function resolveGatewayConfig(): GatewayResolvedConfig {
  const explicitProvider = (process.env.AI_PROVIDER || "auto")
    .trim()
    .toLowerCase();

  const openRouterKey = (process.env.OPENROUTER_API_KEY || "").trim();
  const sumoPodKey = (process.env.SUMOPOD_API_KEY || "").trim();
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();

  const openRouterModel =
    (process.env.OPENROUTER_MODEL || "").trim() ||
    DEFAULT_OPENROUTER_NEMOTRON_MODEL;
  const openRouterTranslator =
    (process.env.OPENROUTER_TRANSLATOR_MODEL || "").trim() ||
    DEFAULT_OPENROUTER_TRANSLATOR_MODEL;
  const openRouterBaseUrl =
    (process.env.OPENROUTER_BASE_URL || "").trim() ||
    DEFAULT_OPENROUTER_BASE_URL;

  const sumoPodModel =
    (process.env.SUMOPOD_MODEL || "").trim() || DEFAULT_SUMOPOD_MODEL;
  const sumoPodBaseUrl =
    (process.env.SUMOPOD_BASE_URL || "").trim() || DEFAULT_SUMOPOD_BASE_URL;

  const geminiModel =
    (process.env.GEMINI_MODEL || "").trim() || DEFAULT_GEMINI_MODEL;

  const isNemotronOrEnglishOnly = (modelId: string) =>
    /nemotron|llama-3\.1-nemotron/i.test(modelId);

  if (
    (explicitProvider === "openrouter" || explicitProvider === "auto") &&
    openRouterKey.length > 10
  ) {
    const fallbacks = Array.from(
      new Set([openRouterModel, ...DEFAULT_OPENROUTER_FALLBACK_MODELS])
    );
    return {
      provider: "openrouter",
      apiKey: openRouterKey,
      baseUrl: openRouterBaseUrl.replace(/\/+$/, ""),
      reasoningModel: openRouterModel,
      translatorModel: openRouterTranslator,
      fallbackModels: fallbacks,
      requiresEnglishPivot: true, // Always run ID->EN->ID pivot on OpenRouter Nemotron 3 Ultra for peak reasoning quality
    };
  }

  if (
    (explicitProvider === "sumopod" || explicitProvider === "auto") &&
    sumoPodKey.length > 10
  ) {
    return {
      provider: "sumopod",
      apiKey: sumoPodKey,
      baseUrl: sumoPodBaseUrl.replace(/\/+$/, ""),
      reasoningModel: sumoPodModel,
      translatorModel: sumoPodModel,
      fallbackModels: [sumoPodModel],
      requiresEnglishPivot: isNemotronOrEnglishOnly(sumoPodModel),
    };
  }

  if (
    (explicitProvider === "gemini" || explicitProvider === "auto") &&
    geminiKey.length > 10
  ) {
    return {
      provider: "gemini",
      apiKey: geminiKey,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      reasoningModel: geminiModel,
      translatorModel: geminiModel,
      fallbackModels: [geminiModel],
      requiresEnglishPivot: false,
    };
  }

  return {
    provider: "deterministic",
    apiKey: "",
    baseUrl: openRouterBaseUrl,
    reasoningModel: openRouterModel,
    translatorModel: openRouterTranslator,
    fallbackModels: DEFAULT_OPENROUTER_FALLBACK_MODELS,
    requiresEnglishPivot: true,
  };
}

/**
 * STAGE 2C (Inbound ID -> EN Scientific Lexicon & Phrase Pivot):
 * Converts Indonesian topic titles, vault domains, and study notes into canonical academic English
 * so English-centric reasoning models (`nvidia/nemotron-3-ultra-550b-a55b:free`) receive pure English context.
 */
const ID_TO_EN_PHRASE_PAIRS: [RegExp, string][] = [
  [/\bsistem pernapasan manusia\b/gi, "Human Respiratory System"],
  [/\bpernapasan\s*[×x]\s*medis\b/gi, "Respiration & Clinical Medicine"],
  [/\bpernapasan\s*[×x]\s*olahraga\b/gi, "Respiration & Sports Physiology"],
  [/\bdunia medis\s*&\s*fisiologi sel\b/gi, "Clinical Medicine & Cell Physiology"],
  [/\brespirasi seluler\b/gi, "Cellular Respiration"],
  [/\bsintesis atp\b/gi, "ATP Synthesis"],
  [/\brantai transpor elektron\b/gi, "Electron Transport Chain"],
  [/\brantai mitokondria\b/gi, "Mitochondrial Chain"],
  [/\bmitokondria\b/gi, "Mitochondria"],
  [/\bdifusi membran\b/gi, "Membrane Diffusion"],
  [/\bhukum gas fick\b/gi, "Fick's Law of Gas Diffusion"],
  [/\bhukum fick\b/gi, "Fick's Law"],
  [/\bkurva disosiasi\b/gi, "Dissociation Curve"],
  [/\befek bohr\b/gi, "Bohr Effect"],
  [/\bpatofisiologi hipoksia\b/gi, "Hypoxia Pathophysiology"],
  [/\basidosis respiratorik\b/gi, "Respiratory Acidosis"],
  [/\bmedan magnet\b/gi, "Magnetic Field"],
  [/\binduksi elektromagnetik\b/gi, "Electromagnetic Induction"],
  [/\bfluks magnetik\b/gi, "Magnetic Flux"],
  [/\bhukum faraday\b/gi, "Faraday's Law"],
  [/\bkendaraan listrik\b/gi, "Electric Vehicles (EV)"],
  [/\bteknik otomotif\b/gi, "Automotive Engineering"],
  [/\bpemodelan komputasi\b/gi, "Computational Modeling"],
  [/\briset kanker\b/gi, "Cancer Research"],
  [/\bonkologi molekuler\b/gi, "Molecular Oncology"],
  [/\bsiklus sel\b/gi, "Cell Cycle"],
  [/\bmutasi genetik\b/gi, "Genetic Mutation"],
  [/\bimunoterapi\b/gi, "Immunotherapy"],
  [/\bfotosintesis\b/gi, "Photosynthesis"],
  [/\btermodinamika\b/gi, "Thermodynamics"],
  [/\bkeseimbangan\s*&\s*regulasi sistem\b/gi, "System Equilibrium & Regulation"],
  [/\bfondasi prasyarat\b/gi, "Prerequisite Foundations"],
  [/\bpendalaman mekanisme\b/gi, "Mechanism Deep-Dive"],
  [/\bkonsep terkait\b/gi, "Related Concept"],
  [/\blintas disiplin\b/gi, "Cross-Disciplinary Synthesis"],
  [/\bterapan\b/gi, "Applied"],
  [/\bmekanisme\b/gi, "Mechanism"],
  [/\bfondasi\b/gi, "Foundations"],
  [/\bprasyarat\b/gi, "Prerequisite"],
  [/\bbagaimana\b/gi, "How"],
  [/\bmengapa\b/gi, "Why"],
  [/\bdan\b/gi, "and"],
  [/\bpada\b/gi, "in"],
  [/\buntuk\b/gi, "for"],
  [/\bdari\b/gi, "from"],
  [/\bmenuju\b/gi, "toward"],
];

const EN_TO_ID_PHRASE_PAIRS: [RegExp, string][] = [
  [/\bHuman Respiratory System\b/gi, "Sistem Pernapasan Manusia"],
  [/\bCellular Respiration\b/gi, "Respirasi Seluler"],
  [/\bATP Synthesis\b/gi, "Sintesis ATP"],
  [/\bElectron Transport Chain\b/gi, "Rantai Transpor Elektron"],
  [/\bMitochondria\b/gi, "Mitokondria"],
  [/\bMembrane Diffusion\b/gi, "Difusi Membran"],
  [/\bFick's Law of Gas Diffusion\b/gi, "Hukum Difusi Gas Fick"],
  [/\bFick's Law\b/gi, "Hukum Fick"],
  [/\bDissociation Curve\b/gi, "Kurva Disosiasi"],
  [/\bBohr Effect\b/gi, "Efek Bohr"],
  [/\bHypoxia Pathophysiology\b/gi, "Patofisiologi Hipoksia"],
  [/\bRespiratory Acidosis\b/gi, "Asidosis Respiratorik"],
  [/\bMagnetic Field\b/gi, "Medan Magnet"],
  [/\bElectromagnetic Induction\b/gi, "Induksi Elektromagnetik"],
  [/\bMagnetic Flux\b/gi, "Fluks Magnetik"],
  [/\bFaraday's Law\b/gi, "Hukum Faraday"],
  [/\bElectric Vehicles \(EV\)\b/gi, "Kendaraan Listrik (EV)"],
  [/\bComputational Modeling\b/gi, "Pemodelan Komputasi"],
  [/\bCancer Research\b/gi, "Riset Kanker"],
  [/\bMolecular Oncology\b/gi, "Onkologi Molekuler"],
  [/\bCell Cycle\b/gi, "Siklus Sel"],
  [/\bGenetic Mutation\b/gi, "Mutasi Genetik"],
  [/\bImmunotherapy\b/gi, "Imunoterapi"],
  [/\bPhotosynthesis\b/gi, "Fotosintesis"],
  [/\bThermodynamics\b/gi, "Termodinamika"],
  [/\bPrerequisite Foundations:/gi, "Fondasi Prasyarat:"],
  [/\bFoundations:/gi, "Fondasi:"],
  [/\bMechanism:/gi, "Mekanisme:"],
  [/\bApplied:/gi, "Terapan:"],
  [/\bRelated Concept:/gi, "Konsep Terkait:"],
  [/\bCross-Disciplinary:/gi, "Lintas Disiplin:"],
];

export function pivotTextIdToEn(text: string): string {
  if (!text || !text.trim()) return "";
  let out = text.trim();
  for (const [pattern, replacement] of ID_TO_EN_PHRASE_PAIRS) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s+/g, " ").trim();
}

export function localizeTextEnToId(text: string): string {
  if (!text || !text.trim()) return "";
  let out = text.trim();
  for (const [pattern, replacement] of EN_TO_ID_PHRASE_PAIRS) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s+/g, " ").trim();
}

/**
 * Builds the Stage 2C Bilingual Pivot metadata for the Orchestrator Input & Output Envelopes.
 */
export function buildBilingualPivotMeta(params: {
  lang: "en" | "id";
  rawTopic: string;
  rawVaultInterest: string;
}): OrchestratorBilingualPivotMeta {
  const cfg = resolveGatewayConfig();
  const isId = params.lang === "id";
  return {
    userLang: params.lang,
    pivotLang: "en",
    inboundTranslatedToEn: isId,
    outboundLocalizedToId: isId,
    canonicalEnglishTopic: isId
      ? pivotTextIdToEn(params.rawTopic)
      : params.rawTopic.trim(),
    canonicalEnglishVaultInterest: isId
      ? pivotTextIdToEn(params.rawVaultInterest)
      : params.rawVaultInterest.trim(),
    reasoningProvider: cfg.provider,
    reasoningModel: cfg.reasoningModel,
    localizationModel: cfg.translatorModel,
  };
}

/**
 * Strips `<think>...</think>` reasoning blocks and markdown code fences (` ```json ... ``` `)
 * emitted by reasoning models such as `nvidia/nemotron-3-ultra-550b-a55b:free`,
 * then extracts the balanced outer JSON object `{ ... }`.
 */
export function extractJsonFromReasoningOutput<T = unknown>(
  rawText: string
): T | null {
  if (!rawText || typeof rawText !== "string") return null;

  // 1. Strip <think>...</think> or <reasoning>...</reasoning> blocks
  let cleaned = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
    .trim();

  // If an unclosed <think> tag exists before a JSON block, strip up to the first '{' after the last '}'
  if (cleaned.includes("<think>")) {
    const afterThink = cleaned.split("</think>").pop();
    if (afterThink) cleaned = afterThink.trim();
  }

  // 2. Strip ```json ... ``` fences if present
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }

  // 3. Fast direct JSON.parse attempt
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Continue to balanced brace extraction
  }

  // 4. Balanced outer '{ ... }' extraction
  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");
  if (startIdx >= 0 && endIdx > startIdx) {
    const candidate = cleaned.slice(startIdx, endIdx + 1);
    try {
      return JSON.parse(candidate) as T;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Calls an OpenAI-compatible Chat Completions endpoint (OpenRouter or SumoPod)
 * with automatic timeout and `<think>`-safe JSON extraction.
 */
async function callOpenAiCompatibleChat(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  timeoutMs?: number;
  isOpenRouter?: boolean;
}): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    params.timeoutMs || 38000
  );

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    };

    if (params.isOpenRouter) {
      headers["HTTP-Referer"] =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      headers["X-Title"] = "Curiora Knowledge Cosmos";
    }

    const requestBody: Record<string, unknown> = {
      model: params.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      temperature: params.temperature ?? 0.3,
    };

    if (params.isOpenRouter && /nemotron/i.test(params.model)) {
      requestBody.reasoning = { effort: "low" };
    }

    const res = await fetch(`${params.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const msg = data?.choices?.[0]?.message;
    const content =
      typeof msg?.content === "string" && msg.content.trim().length > 0
        ? msg.content
        : typeof msg?.reasoning === "string" && msg.reasoning.includes("{")
          ? msg.reasoning
          : "";
    return content.trim().length > 0 ? content : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * STAGE 2C (Optional Live LLM Inbound ID -> EN Translation Pre-Pass):
 * When the user provides long Indonesian notes/excerpts and OpenRouter/SumoPod is active,
 * translates the user input fields to clean academic English before invoking `NVIDIA: Nemotron 3 Ultra (free)`.
 */
export async function translateInboundFieldsIdToEn(params: {
  topicTitle: string;
  vaultName: string;
  mainInterest: string;
  focusQuestion: string;
  learningGoal: string;
  inputContent?: string;
}): Promise<{
  topicTitleEn: string;
  vaultNameEn: string;
  mainInterestEn: string;
  focusQuestionEn: string;
  learningGoalEn: string;
  inputContentEn?: string;
}> {
  return {
    topicTitleEn: pivotTextIdToEn(params.topicTitle),
    vaultNameEn: pivotTextIdToEn(params.vaultName),
    mainInterestEn: pivotTextIdToEn(params.mainInterest),
    focusQuestionEn: pivotTextIdToEn(params.focusQuestion),
    learningGoalEn: pivotTextIdToEn(params.learningGoal),
    inputContentEn: params.inputContent
      ? pivotTextIdToEn(params.inputContent)
      : undefined,
  };
}

export interface OrchestratorLlmSchema {
  relevanceGate?: {
    status?: "valid" | "typo_corrected" | "rejected_too_far";
    normalizedTitle?: string;
    dangerMessage?: string;
  };
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
  }[];
  crossLinks?: {
    existingNodeId?: string;
    relation?: EdgeRelationType;
    reason?: string;
  }[];
}

/**
 * STAGE 3B (Outbound EN -> ID Localization Adapter):
 * Takes the English JSON output synthesized by `NVIDIA: Nemotron 3 Ultra (free)` (`nvidia/nemotron-3-ultra-550b-a55b:free`)
 * and translates all user-facing text fields back into natural Bahasa Indonesia (`ID`),
 * preserving exact JSON keys, IDs, `REG-0X` codes, and international scientific terminology.
 */
export async function localizeOrchestratorOutputEnToId(
  enData: OrchestratorLlmSchema
): Promise<OrchestratorLlmSchema> {
  const cfg = resolveGatewayConfig();

  if (
    (cfg.provider === "openrouter" || cfg.provider === "sumopod") &&
    cfg.apiKey
  ) {
    const raw = await callOpenAiCompatibleChat({
      baseUrl: cfg.baseUrl,
      apiKey: cfg.apiKey,
      model: cfg.translatorModel,
      systemPrompt: `You are the Outbound EN -> ID Scientific Localization Adapter for Curiora.
Translate all human-readable English text fields ("normalizedTitle", "dangerMessage", "title", "summary", "simple", "standard", "deep", "formula", "application", "question", "text", "edgeReason", "reason") from English into natural, clear Bahasa Indonesia.
CRITICAL RULES:
1. Keep all JSON keys, boolean flags ("correct"), "status" enum values ("valid", "typo_corrected", "rejected_too_far"), "region" codes ("REG-01".."REG-06"), "difficulty" values ("Foundation", "Basic", "Intermediate", "Advanced"), "relation" values ("prerequisite", "extension", "application", "related_concept", "cross_disciplinary"), and "existingNodeId" UNCHANGED.
2. Keep international scientific terms accurate (e.g. ATP, Mitokondria, Efek Bohr, Hukum Faraday, DNA/RNA).
3. Return ONLY valid raw JSON without markdown fences.`,
      userPrompt: JSON.stringify(enData),
      temperature: 0.2,
      timeoutMs: 11000,
      isOpenRouter: cfg.provider === "openrouter",
    });

    const localized = extractJsonFromReasoningOutput<OrchestratorLlmSchema>(
      raw || ""
    );
    if (localized && (localized.primaryNode || localized.frontierNodes)) {
      return localized;
    }
  }

  // Deterministic phrase-level fallback localizer if secondary pass times out
  return {
    relevanceGate: enData.relevanceGate
      ? {
          ...enData.relevanceGate,
          normalizedTitle: enData.relevanceGate.normalizedTitle
            ? localizeTextEnToId(enData.relevanceGate.normalizedTitle)
            : undefined,
          dangerMessage: enData.relevanceGate.dangerMessage
            ? localizeTextEnToId(enData.relevanceGate.dangerMessage)
            : undefined,
        }
      : undefined,
    primaryNode: enData.primaryNode
      ? {
          ...enData.primaryNode,
          title: enData.primaryNode.title
            ? localizeTextEnToId(enData.primaryNode.title)
            : undefined,
          summary: enData.primaryNode.summary
            ? localizeTextEnToId(enData.primaryNode.summary)
            : undefined,
          levels: enData.primaryNode.levels
            ? {
                simple: localizeTextEnToId(
                  enData.primaryNode.levels.simple || ""
                ),
                standard: localizeTextEnToId(
                  enData.primaryNode.levels.standard || ""
                ),
                deep: localizeTextEnToId(enData.primaryNode.levels.deep || ""),
              }
            : undefined,
          formula: enData.primaryNode.formula
            ? localizeTextEnToId(enData.primaryNode.formula)
            : undefined,
          application: enData.primaryNode.application
            ? localizeTextEnToId(enData.primaryNode.application)
            : undefined,
        }
      : undefined,
    frontierNodes: enData.frontierNodes?.map((f) => ({
      ...f,
      title: f.title ? localizeTextEnToId(f.title) : undefined,
      edgeReason: f.edgeReason ? localizeTextEnToId(f.edgeReason) : undefined,
    })),
    crossLinks: enData.crossLinks?.map((c) => ({
      ...c,
      reason: c.reason ? localizeTextEnToId(c.reason) : undefined,
    })),
  };
}

function needsIndonesianLocalization(payload: unknown): boolean {
  const sample = JSON.stringify(payload || {});
  const enMatches =
    sample.match(
      /\b(the|with|within|through|between|which|couples|explains|directly|across|requires|understanding|foundational)\b/gi
    ) || [];
  const idMatches =
    sample.match(
      /\b(yang|dan|dengan|untuk|pada|dalam|dari|adalah|secara|melalui|sebagai|terhadap)\b/gi
    ) || [];
  return enMatches.length >= 3 && enMatches.length > idMatches.length;
}

/**
 * STAGE 3A + 3B: Unified Multi-Provider Structured LLM Execution
 * - Supports OpenRouter (`nvidia/nemotron-3-ultra-550b-a55b:free` with fallback chain), SumoPod (`https://ai.sumopod.com/v1`), and Gemini.
 * - Uses In-Model English Reasoning Scratchpad (`reasoning.effort = "low"`) + target-language JSON synthesis, with automatic Stage 3B EN->ID guard if any output remains in English.
 */
export async function executeGatewayStructuredReasoning<T = OrchestratorLlmSchema>(params: {
  englishSystemPrompt: string;
  englishUserPrompt: string;
  directBilingualPrompt?: string;
  userLang: "en" | "id";
  localizeOutputFn?: (enParsed: T) => Promise<T>;
}): Promise<{
  data: T | null;
  engineUsed: string;
  provider: AiProviderKind;
  modelUsed: string;
  bilingualPivotApplied: boolean;
}> {
  const cfg = resolveGatewayConfig();

  if (cfg.provider === "deterministic" || !cfg.apiKey) {
    return {
      data: null,
      engineUsed:
        "Curiora Orchestrator (Bilingual ID↔EN Pivot + Deterministic Spatial Topology Engine)",
      provider: "deterministic",
      modelUsed: cfg.reasoningModel,
      bilingualPivotApplied: params.userLang === "id",
    };
  }

  // CASE A: OpenRouter (`nvidia/nemotron-3-ultra-550b-a55b:free` + free fallback chain) or SumoPod
  if (cfg.provider === "openrouter" || cfg.provider === "sumopod") {
    const modelsToTry =
      cfg.provider === "openrouter" ? cfg.fallbackModels : [cfg.reasoningModel];

    const targetLangDirective =
      params.userLang === "id"
        ? "\nCRITICAL LANGUAGE RULE: Perform your internal scientific reasoning briefly in English (<50 words), then write ALL user-facing JSON string values (title, summary, simple, standard, deep, formula, application, question, options.text, edgeReason, reason) in natural, fluent Bahasa Indonesia. Never use awkward English prefixes like 'Applied:' or 'Mechanism:'."
        : "\nCRITICAL LANGUAGE RULE: Keep internal reasoning brief (<50 words) and write all user-facing JSON string values in clear, natural English.";

    for (const candidateModel of modelsToTry) {
      const useEnglishPivot =
        cfg.requiresEnglishPivot || /nemotron/i.test(candidateModel);

      const rawText = await callOpenAiCompatibleChat({
        baseUrl: cfg.baseUrl,
        apiKey: cfg.apiKey,
        model: candidateModel,
        systemPrompt: params.englishSystemPrompt + targetLangDirective,
        userPrompt: params.directBilingualPrompt || params.englishUserPrompt,
        temperature: 0.3,
        timeoutMs: 36000,
        isOpenRouter: cfg.provider === "openrouter",
      });

      const parsed = extractJsonFromReasoningOutput<T>(rawText || "");
      if (parsed) {
        let finalData: T = parsed;
        const pivotApplied = useEnglishPivot && params.userLang === "id";
        if (
          pivotApplied &&
          params.localizeOutputFn &&
          needsIndonesianLocalization(parsed)
        ) {
          finalData = await params.localizeOutputFn(parsed);
        }

        const providerLabel =
          cfg.provider === "openrouter" ? "OpenRouter" : "SumoPod";
        const pivotBadge = pivotApplied
          ? ` + ID↔EN Bilingual Reasoning Pivot`
          : "";

        return {
          data: finalData,
          engineUsed: `Curiora Orchestrator (${providerLabel}: ${candidateModel}${pivotBadge})`,
          provider: cfg.provider,
          modelUsed: candidateModel,
          bilingualPivotApplied: pivotApplied,
        };
      }
    }
  }

  // CASE B: Google Gemini fallback if GEMINI_API_KEY is configured
  if (cfg.provider === "gemini") {
    try {
      const response = await fetch(
        `${cfg.baseUrl}/models/${cfg.reasoningModel}:generateContent?key=${cfg.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text:
                      params.directBilingualPrompt || params.englishUserPrompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: "application/json",
            },
          }),
        }
      );
      if (response.ok) {
        const json = await response.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = extractJsonFromReasoningOutput<T>(rawText);
        if (parsed) {
          return {
            data: parsed,
            engineUsed: `Curiora Orchestrator (Gemini: ${cfg.reasoningModel})`,
            provider: "gemini",
            modelUsed: cfg.reasoningModel,
            bilingualPivotApplied: false,
          };
        }
      }
    } catch {
      // Fallback cleanly to deterministic engine
    }
  }

  return {
    data: null,
    engineUsed:
      "Curiora Orchestrator (Bilingual ID↔EN Pivot + Deterministic Spatial Topology Engine)",
    provider: "deterministic",
    modelUsed: cfg.reasoningModel,
    bilingualPivotApplied: params.userLang === "id",
  };
}
