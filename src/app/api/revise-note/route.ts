import { generateNoteRevisionPreview } from "@/lib/ai-engine";
import { ExplanationDepth, KnowledgeNode } from "@/types/knowledge";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lang = body?.lang === "en" ? "en" : "id";
    const node: KnowledgeNode | undefined = body?.node;

    if (!node || !node.title || !node.levels) {
      return NextResponse.json(
        {
          ok: false,
          error:
            lang === "en"
              ? "Invalid topic note payload."
              : "Data catatan topik tidak valid.",
        },
        { status: 400 }
      );
    }

    const depth: ExplanationDepth =
      body?.depth === "simple" || body?.depth === "deep"
        ? body.depth
        : "standard";

    const preview = await generateNoteRevisionPreview({
      vaultName: body?.vaultName || "Curiora Vault",
      mainInterest: body?.mainInterest || "Interdisciplinary Learning",
      learningGoal: body?.learningGoal || "Deep Understanding",
      node,
      depth,
      instruction: body?.instruction || "",
      lang,
    });

    return NextResponse.json({
      ok: true,
      engineUsed: preview.engineUsed,
      preview: {
        summary: preview.summary,
        levels: preview.levels,
        rationale: preview.rationale,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to prepare note revision preview.",
      },
      { status: 400 }
    );
  }
}
