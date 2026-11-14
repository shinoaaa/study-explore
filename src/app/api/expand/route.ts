import { expandNodeInVault } from "@/lib/ai-engine";
import { KnowledgeVault } from "@/types/knowledge";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lang = body?.lang === "en" ? "en" : "id";
    const vault: KnowledgeVault | undefined = body?.vault;
    const targetNodeId: string | undefined = body?.targetNodeId;

    if (!vault || !Array.isArray(vault.nodes) || !targetNodeId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            lang === "en"
              ? "Invalid Vault data or target node ID."
              : "Data Vault atau ID node yang ingin diperluas tidak valid.",
        },
        { status: 400 }
      );
    }

    const result = await expandNodeInVault(vault, targetNodeId, lang);

    return NextResponse.json({
      ok: true,
      engineUsed: result.engineUsed,
      addedNodeIds: result.addedNodeIds,
      vault: result.vault,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengekspansi cabang node.",
      },
      { status: 400 }
    );
  }
}
