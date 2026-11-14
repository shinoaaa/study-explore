import { exploreIntoVault, generateVaultFromInput } from "@/lib/ai-engine";
import { KnowledgeVault, VaultInputContext } from "@/types/knowledge";
import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lang = body?.lang === "en" ? "en" : "id";

    // New Vault-inside-exploration flow: add an exploration context into an active Vault safely
    if (body?.vault && body?.explorationInput) {
      const vault: KnowledgeVault = body.vault;
      const exp = body.explorationInput;
      const result = await exploreIntoVault({
        vault,
        path: exp?.path === "curiosity" ? "curiosity" : "material",
        existingSourceId: exp?.existingSourceId || undefined,
        sourceFormat: exp?.sourceFormat || "book_chapter",
        title: (exp?.title || "").trim() || vault.name,
        chapterOrSection: (exp?.chapterOrSection || "").trim(),
        excerptOrNotes: (exp?.excerptOrNotes || "").trim(),
        focusQuestion:
          (exp?.focusQuestion || "").trim() ||
          vault.identity?.focusQuestion ||
          vault.name,
        explorationGoal:
          (exp?.explorationGoal || "").trim() ||
          vault.identity?.learningGoal ||
          vault.name,
        depth:
          exp?.depth === "simple" || exp?.depth === "deep"
            ? exp.depth
            : "standard",
        lang,
      });

      return NextResponse.json({
        ok: true,
        engineUsed: result.engineUsed,
        addedNodeIds: result.addedNodeIds,
        flaggedReviewIds: result.flaggedReviewIds,
        vault: result.vault,
      });
    }

    // Direct standalone vault generation flow
    const vaultName = (
      body?.vaultName ||
      (lang === "en" ? "New Exploration Vault" : "Vault Eksplorasi Baru")
    ).trim();
    const inputContext: VaultInputContext = {
      mode: body?.inputContext?.mode === "mode_b" ? "mode_b" : "mode_a",
      subject:
        body?.inputContext?.subject || (lang === "en" ? "Biology" : "Biologi"),
      chapter: body?.inputContext?.chapter || "",
      subchapters: body?.inputContext?.subchapters || "",
      interestDomain:
        body?.inputContext?.interestDomain ||
        (lang === "en"
          ? "Applied Science & Tech"
          : "Sains & Teknologi Terapan"),
      targetGoal:
        body?.inputContext?.targetGoal ||
        body?.inputContext?.chapter ||
        (lang === "en"
          ? "Core Topic Exploration"
          : "Eksplorasi Konsep Lanjutan"),
      motivation: body?.inputContext?.motivation || "",
    };

    const result = await generateVaultFromInput(vaultName, inputContext, lang);

    return NextResponse.json({
      ok: true,
      engineUsed: result.engineUsed,
      vault: result.vault,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal memproses pemetaan Knowledge Vault.",
      },
      { status: 400 }
    );
  }
}
