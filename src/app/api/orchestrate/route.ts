import { executeOrchestratorPipeline } from "@/lib/ai-orchestrator";
import {
  KnowledgeVault,
  OrchestratorIntent,
  OrchestratorNodePayload,
} from "@/types/knowledge";
import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const vault = body?.vault as KnowledgeVault | undefined;
    const intent = (body?.intent || "OPEN_NODE") as OrchestratorIntent;
    const nodeAction = body?.nodeAction as OrchestratorNodePayload | undefined;
    const lang = body?.lang === "id" ? "id" : "en";

    if (!vault || !nodeAction) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid Orchestrator Input Envelope: missing vault or nodeAction.",
        },
        { status: 400 }
      );
    }

    const outputEnvelope = await executeOrchestratorPipeline({
      intent,
      vault,
      nodeAction,
      lang,
    });

    return NextResponse.json(outputEnvelope);
  } catch (err) {
    console.error("Error in /api/orchestrate:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to execute AI Knowledge Orchestrator." },
      { status: 500 }
    );
  }
}
