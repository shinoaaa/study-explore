import { generateVaultFromInput } from "@/lib/ai-engine";
import { VaultInputContext } from "@/types/knowledge";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const vaultName = (body?.vaultName || "Vault Eksplorasi Baru").trim();
    const inputContext: VaultInputContext = {
      mode: body?.inputContext?.mode === "mode_b" ? "mode_b" : "mode_a",
      subject: body?.inputContext?.subject || "Biologi",
      chapter: body?.inputContext?.chapter || "",
      subchapters: body?.inputContext?.subchapters || "",
      interestDomain:
        body?.inputContext?.interestDomain || "Sains & Teknologi Terapan",
      targetGoal:
        body?.inputContext?.targetGoal ||
        body?.inputContext?.chapter ||
        "Eksplorasi Konsep Lanjutan",
      motivation: body?.inputContext?.motivation || "",
    };

    const result = await generateVaultFromInput(vaultName, inputContext);

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
