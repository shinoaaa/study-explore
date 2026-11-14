import { KNOWLEDGE_REGIONS } from "@/lib/regions";
import { validateAndBuildGraph } from "@/lib/validator";
import {
  KnowledgeEdge,
  KnowledgeNode,
  KnowledgeVault,
  OverviewModule,
  RegionCode,
  VaultInputContext,
} from "@/types/knowledge";

type EngineLanguage = "en" | "id";

function regLabel(code: RegionCode, lang: EngineLanguage): string {
  const reg = KNOWLEDGE_REGIONS[code] || KNOWLEDGE_REGIONS["REG-01"];
  return lang === "id" ? reg.shortNameId : reg.shortName;
}

/**
 * Formats a concept title cleanly for formula expressions without cutting words or dangling connectors.
 */
function formatFormulaSubject(title: string): string {
  const cleaned = title.split(":")[0].split("(")[0].trim();
  if (cleaned.length <= 26) {
    return cleaned.replace(/[\s&/+-]+$/, "") || title.trim();
  }
  const cut = cleaned.slice(0, 26);
  const lastSpace = cut.lastIndexOf(" ");
  const boundary = lastSpace > 10 ? cut.slice(0, lastSpace) : cut;
  return boundary.replace(/[\s&/+-]+$/, "") || cut.trim();
}

function inferStartingRegion(text: string): RegionCode {
  const lower = text.toLowerCase();
  if (
    /medis|kedokteran|kanker|penyakit|klinis|kesehatan|olahraga|atlet|fisiologi|obat|farmasi|gizi/.test(
      lower
    )
  ) {
    return "REG-02";
  }
  if (
    /komputer|informatika|pemrograman|coding|ai|data|algoritma|software|jaringan|siber|web/.test(
      lower
    )
  ) {
    return "REG-03";
  }
  if (
    /teknik|rekayasa|mesin|elektro|robot|industri|sipil|iot|sensor|otomotif|energi terbarukan/.test(
      lower
    )
  ) {
    return "REG-04";
  }
  if (
    /matematika|kalkulus|aljabar|statistika|probabilitas|geometri|logika|trigonometri|diskrit/.test(
      lower
    )
  ) {
    return "REG-05";
  }
  if (
    /ekonomi|sosial|sejarah|psikologi|hukum|politik|akuntansi|bisnis|manajemen|geografi|sosiologi/.test(
      lower
    )
  ) {
    return "REG-06";
  }
  return "REG-01";
}

function getAdjacentCrossRegion(reg: RegionCode): RegionCode {
  const map: Record<RegionCode, RegionCode> = {
    "REG-01": "REG-04",
    "REG-02": "REG-03",
    "REG-03": "REG-05",
    "REG-04": "REG-01",
    "REG-05": "REG-03",
    "REG-06": "REG-03",
  };
  return map[reg];
}

function buildSystemPromptForExplore(
  vaultName: string,
  ctx: VaultInputContext,
  lang: EngineLanguage = "id"
): string {
  const modeDesc =
    ctx.mode === "mode_a"
      ? `Starting from Study Material:
- Subject: ${ctx.subject || "Science"}
- Chapter: ${ctx.chapter || ctx.targetGoal}
- Key Topics: ${ctx.subchapters || "-"}
- Personal Interest / Focus: ${ctx.interestDomain} (${ctx.targetGoal})`
      : `Starting from Personal Curiosity:
- Interest Area: ${ctx.interestDomain}
- Target Topic: ${ctx.targetGoal}
- Curiosity / Goal: ${ctx.motivation || "Understand from core foundations to real-world applications"}`;

  const langRule =
    lang === "en"
      ? "Write all titles, summaries, explanations, quiz items, and edge reasons in clear, natural English (keep precise scientific terminology where helpful)."
      : "Gunakan Bahasa Indonesia yang mengalir dan enak dibaca (tetap pakai istilah ilmiah yang tepat kalau memang dibutuhkan, jangan terlalu kaku atau terlalu bertele-tele).";

  return `You are the Knowledge Mapping Engine for Curiora.
Map the user's input inside Vault "${vaultName}" into a Directed Acyclic Graph (DAG) JSON:
1. ${langRule} Never include internal codes like "REG-01", "Mode A", "Mode B", or "Filter Bubble" inside user-visible text.
2. Map 6 core nodes combining:
   - 1 "root" node (main material or core target topic)
   - at least 1 "prerequisite" node
   - "extension" node
   - "application" node tailored to the user's interest
   - at least 1 "cross_disciplinary" node in another Knowledge Region.
3. Each node's "region" field MUST be one of: "REG-01" (Natural & Life Sciences), "REG-02" (Health & Medicine), "REG-03" (Tech & AI), "REG-04" (Engineering), "REG-05" (Math & Logic), "REG-06" (Social & Humanities).
4. Edge "relation" MUST be one of: "prerequisite", "extension", "application", "related_concept", "cross_disciplinary".
5. Every edge MUST include a concise, specific "reason" explaining why those two concepts connect.

User Input:
${modeDesc}

Kembalikan HANYA objek JSON murni (tanpa markdown fence) dengan struktur persis berikut:
{
  "overview": {
    "title": "string",
    "startingRegion": "REG-01",
    "summary": "string",
    "keyConcepts": ["string", "string", "string"],
    "coreFormulaOrPrinciple": "string",
    "primaryReference": "string"
  },
  "nodes": [
    {
      "id": "string",
      "title": "string",
      "region": "REG-01",
      "relationToOrigin": "root",
      "difficulty": "Foundation",
      "explored": true,
      "mastered": false,
      "summary": "string",
      "levels": {
        "simple": "Analogi sehari-hari yang ramah pemula",
        "standard": "Penjelasan standar tingkat SMA/Mahasiswa awal",
        "deep": "Penjelasan mekanisme ilmiah tingkat lanjut"
      },
      "formula": "Rumus atau prinsip mekanisme utama",
      "application": "Contoh penerapan nyata yang relevan dengan minat pengguna",
      "reference": "Sumber literatur terbuka/terpercaya (mis. OpenStax, buku teks)",
      "quickCheck": {
        "question": "Pertanyaan singkat untuk menguji pemahaman konsep",
        "options": [
          { "text": "Jawaban benar", "correct": true },
          { "text": "Jawaban pengecoh", "correct": false }
        ]
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "id_node_asal",
      "target": "id_node_tujuan",
      "relation": "prerequisite",
      "reason": "Alasan spesifik mengapa kedua konsep ini terhubung"
    }
  ]
}`;
}

function synthesizeDeterministicVault(
  vaultName: string,
  ctx: VaultInputContext,
  lang: EngineLanguage = "id"
): KnowledgeVault {
  const isEn = lang === "en";
  const coreTopic =
    ctx.mode === "mode_a"
      ? `${ctx.chapter || (isEn ? "Core Topic" : "Materi Inti")}${ctx.subject ? ` (${ctx.subject})` : ""}`
      : ctx.targetGoal || (isEn ? "Exploration Topic" : "Topik Eksplorasi");

  const interest =
    ctx.interestDomain || (isEn ? "Applied Science & Tech" : "Sains & Teknologi Terapan");
  const subitems = ctx.subchapters
    ? ctx.subchapters
        .split(/[,•;]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const startReg = inferStartingRegion(
    `${ctx.subject || ""} ${ctx.chapter || ""} ${ctx.targetGoal || ""}`
  );
  const interestReg = inferStartingRegion(
    `${ctx.interestDomain || ""} ${ctx.motivation || ""}`
  );
  const appReg: RegionCode =
    interestReg !== startReg ? interestReg : getAdjacentCrossRegion(startReg);
  const crossReg: RegionCode =
    startReg !== "REG-03" && appReg !== "REG-03" ? "REG-03" : "REG-05";

  const startLabel = regLabel(startReg, lang);
  const crossLabel = regLabel(crossReg, lang);

  const firstSub =
    subitems[0] || (isEn ? `Foundations of ${coreTopic}` : `Prinsip Dasar ${coreTopic}`);
  const secondSub =
    subitems[1] || (isEn ? `Core Mechanism of ${coreTopic}` : `Mekanisme Inti ${coreTopic}`);

  const overview: OverviewModule = isEn
    ? {
        title: coreTopic,
        startingRegion: startReg,
        summary:
          ctx.mode === "mode_a"
            ? `Connects "${coreTopic}" (${ctx.subchapters || "core concepts"}) to your interest in ${interest}, from prerequisites to cross-field applications.`
            : `Maps a clear path toward "${coreTopic}" in ${interest}, linking core foundations to applied and computational perspectives.`,
        keyConcepts: [firstSub, secondSub, `${coreTopic} × ${interest}`, crossLabel],
        coreFormulaOrPrinciple: `${startLabel} Foundations → ${coreTopic} → ${interest}`,
        primaryReference: "OpenStax Open Textbooks (CC BY 4.0) & Academic References",
      }
    : {
        title: coreTopic,
        startingRegion: startReg,
        summary:
          ctx.mode === "mode_a"
            ? `Menghubungkan materi "${coreTopic}" dengan minatmu di ${interest}, mulai dari konsep dasar sampai penerapannya di bidang lain.`
            : `Memetakan jalur belajar ke arah "${coreTopic}" di bidang ${interest}, dari dasar prasyarat hingga penerapannya.`,
        keyConcepts: [firstSub, secondSub, `${coreTopic} × ${interest}`, crossLabel],
        coreFormulaOrPrinciple: `Dasar ${startLabel} → ${coreTopic} → ${interest}`,
        primaryReference: "OpenStax Open Textbooks (CC BY 4.0) & Referensi Akademik",
      };

  const rawNodes: KnowledgeNode[] = isEn
    ? [
        {
          id: "n_prereq",
          title: `Foundations: ${firstSub}`,
          region: startReg,
          relationToOrigin: "prerequisite",
          difficulty: "Basic",
          x: 45,
          y: 65,
          explored: true,
          mastered: false,
          summary: `Core idea worth grasping before diving into ${coreTopic}.`,
          levels: {
            simple: `Think of "${firstSub}" as the base layer: once its basic moving parts click, ${coreTopic} makes way more sense.`,
            standard: `Foundational concept covering core definitions, variables, and rules of ${firstSub} that support ${coreTopic}.`,
            deep: `Structural analysis of the boundary parameters governing ${firstSub} as a prerequisite for ${coreTopic}.`,
          },
          formula: `Core variables & rules of ${firstSub}`,
          application: `Clears up key terminology before tackling deeper material on ${coreTopic}.`,
          reference: `OpenStax Foundation Series — ${ctx.subject || ctx.interestDomain}`,
          quickCheck: {
            question: `Why does "${firstSub}" come before the main topic?`,
            options: [
              {
                text: `Because understanding ${firstSub} makes the mechanism of ${coreTopic} clear`,
                correct: true,
              },
              {
                text: "Because it has nothing to do with the main topic",
                correct: false,
              },
            ],
          },
        },
        {
          id: "root",
          title: coreTopic,
          region: startReg,
          relationToOrigin: "root",
          difficulty: "Foundation",
          x: 175,
          y: 155,
          explored: true,
          mastered: true,
          summary: `Starting concept inside "${vaultName}".`,
          levels: {
            simple: `At its heart, "${coreTopic}" is about how its parts interact to create real effects we can observe.`,
            standard: `Overview of "${coreTopic}", covering its structure, how ${secondSub} works, and how it ties into ${interest}.`,
            deep: `Systemic analysis of "${coreTopic}" across dynamic equilibrium, feedback regulation, and multi-scale interactions.`,
          },
          formula: `Input → ${secondSub} → Output & Adaptation`,
          application: `Anchors this topic directly to your interest in ${interest}.`,
          reference: `OpenStax Reference — ${coreTopic}`,
          quickCheck: {
            question: `What role does "${coreTopic}" play here?`,
            options: [
              {
                text: "It links foundational prerequisites to deeper mechanisms and applications",
                correct: true,
              },
              {
                text: "It is a dead-end topic that cannot branch further",
                correct: false,
              },
            ],
          },
        },
        {
          id: "n_ext",
          title: `Mechanism: ${secondSub}`,
          region: startReg,
          relationToOrigin: "extension",
          difficulty: "Intermediate",
          x: 55,
          y: 185,
          explored: true,
          mastered: false,
          summary: `Closer look at how ${coreTopic} works under the hood.`,
          levels: {
            simple: `Once you get the big picture, this zooms into the step-by-step engine inside ${secondSub}.`,
            standard: `Deepens ${coreTopic} by focusing on reaction steps, rate/efficiency factors, and component interactions in ${secondSub}.`,
            deep: `Causal mechanism and feedback control regulating the stability of ${secondSub}.`,
          },
          formula: `Process Efficiency ∝ Driving Factors / Resistance`,
          application: `Helps explain why changing conditions alter the outcome of ${coreTopic}.`,
          reference: `Advanced Study Notes — ${ctx.subject || ctx.interestDomain}`,
          quickCheck: {
            question: `How does this mechanism branch differ from a prerequisite?`,
            options: [
              {
                text: "It goes deeper into how the main concept works once you know the basics",
                correct: true,
              },
              {
                text: "It requires zero prior understanding",
                correct: false,
              },
            ],
          },
        },
        {
          id: "n_app",
          title: `In Practice: ${interest}`,
          region: appReg,
          relationToOrigin: "application",
          difficulty: "Intermediate",
          x: 350,
          y: 95,
          explored: true,
          mastered: false,
          summary: `How ${coreTopic} shows up in ${interest}.`,
          levels: {
            simple: `See how people working in ${interest} actually apply "${coreTopic}" to solve real problems.`,
            standard: `Practical implementation of ${coreTopic} within ${interest} (${ctx.targetGoal}), turning theory into working solutions.`,
            deep: `Performance optimization and system trade-offs when applying ${coreTopic} in ${interest}.`,
          },
          formula: `${coreTopic} + ${interest} → Applied Solution`,
          application: `Directly explores your goal: "${ctx.targetGoal}".`,
          reference: `Applied ${interest} Case Studies`,
          quickCheck: {
            question: `Why is "${interest}" connected right here?`,
            options: [
              {
                text: "Because it applies the core science directly to your personal focus",
                correct: true,
              },
              {
                text: "Because everyone is forced into the exact same career track",
                correct: false,
              },
            ],
          },
        },
        {
          id: "n_related",
          title: "System Balance & Regulation",
          region: appReg,
          relationToOrigin: "related_concept",
          difficulty: "Intermediate",
          x: 470,
          y: 175,
          explored: false,
          mastered: false,
          summary: `Parallel concept that rounds out how ${coreTopic} stays stable.`,
          levels: {
            simple: `Like learning both how a car engine accelerates and how brakes keep it steady—they work side by side.`,
            standard: `Companion concept showing how systems maintain balance and respond to external changes around ${coreTopic}.`,
            deep: `Multi-variable coupling and homeostatic control paired with ${coreTopic}.`,
          },
          formula: `Dynamic Balance: ΔInput ≈ ΔRegulation`,
          application: `Prevents system instability in real ${interest} use cases.`,
          reference: "Integrated Systems Compendium",
          quickCheck: {
            question: `Why is this marked as Related instead of Prerequisite?`,
            options: [
              {
                text: "Because it complements the main idea flexibly without a strict sequence",
                correct: true,
              },
              {
                text: "Because it is unrelated to the topic",
                correct: false,
              },
            ],
          },
        },
        {
          id: "n_cross",
          title: `${crossLabel}: Modeling ${coreTopic}`,
          region: crossReg,
          relationToOrigin: "cross_disciplinary",
          difficulty: "Advanced",
          x: 650,
          y: 115,
          explored: false,
          mastered: false,
          summary: `Cross-field bridge into ${crossLabel} for modeling and prediction.`,
          levels: {
            simple: `How tools from ${crossLabel} let researchers simulate "${coreTopic}" cleanly before running costly physical tests.`,
            standard: `Combines ${coreTopic} with computational modeling and quantitative analysis from ${crossLabel} to uncover hidden patterns.`,
            deep: `Numerical modeling, predictive inference, and data-driven analysis bridging ${startLabel} with ${crossLabel}.`,
          },
          formula: `Observations → Model f(x) → Prediction`,
          application: `Connects ${ctx.subject || ctx.interestDomain} with modern workflows in ${crossLabel}.`,
          reference: `Interdisciplinary Science · ${crossLabel}`,
          quickCheck: {
            question: `What does a cross-disciplinary node add here?`,
            options: [
              {
                text: `It shows how ideas in ${startLabel} connect with ${crossLabel}`,
                correct: true,
              },
              {
                text: "It replaces all natural science topics",
                correct: false,
              },
            ],
          },
        },
      ]
    : [
        {
          id: "n_prereq",
          title: `Dasar: ${firstSub}`,
          region: startReg,
          relationToOrigin: "prerequisite",
          difficulty: "Basic",
          x: 45,
          y: 65,
          explored: true,
          mastered: false,
          summary: `Konsep dasar yang enak dipahami dulu sebelum masuk ke ${coreTopic}.`,
          levels: {
            simple: `Bayangkan "${firstSub}" sebagai pondasinya: kalau bagian dasarnya sudah kebayang, memahami ${coreTopic} bakal jauh lebih gampang.`,
            standard: `Konsep prasyarat yang membahas definisi penting, variabel utama, dan aturan dasar pada ${firstSub} sebagai pijakan ${coreTopic}.`,
            deep: `Analisis parameter dan kondisi batas pada ${firstSub} yang menjadi landasan berjalannya mekanisme ${coreTopic}.`,
          },
          formula: `Variabel & Aturan Dasar ${firstSub}`,
          application: `Biar kamu nggak bingung istilah saat baca bahasan lanjut tentang ${coreTopic}.`,
          reference: `OpenStax Foundation Series — Pengantar ${ctx.subject || ctx.interestDomain}`,
          quickCheck: {
            question: `Kenapa "${firstSub}" dipelajari sebelum masuk ke topik utama?`,
            options: [
              {
                text: `Karena pemahaman ${firstSub} membantu kita mengerti cara kerja ${coreTopic}`,
                correct: true,
              },
              {
                text: "Karena konsep ini sama sekali nggak nyambung ke topik utama",
                correct: false,
              },
            ],
          },
        },
        {
          id: "root",
          title: coreTopic,
          region: startReg,
          relationToOrigin: "root",
          difficulty: "Foundation",
          x: 175,
          y: 155,
          explored: true,
          mastered: true,
          summary: `Titik awal eksplorasi di dalam Vault "${vaultName}".`,
          levels: {
            simple: `Intinya, "${coreTopic}" membahas bagaimana komponen-komponen di dalamnya saling bekerja hingga menghasilkan dampak nyata.`,
            standard: `Gambaran utama "${coreTopic}" yang mencakup struktur, mekanisme ${secondSub}, dan hubungannya dengan bidang ${interest}.`,
            deep: `Kajian sistemik "${coreTopic}" lewat interaksi antarvariabel, keseimbangan dinamis, dan implikasi lanjutannya.`,
          },
          formula: `Input → Proses Inti (${secondSub}) → Output`,
          application: `Jadi jangkar buat menghubungkan materi belajar ke minatmu di ${interest}.`,
          reference: `OpenStax Reference — ${coreTopic}`,
          quickCheck: {
            question: `Apa peran titik utama "${coreTopic}" di peta ini?`,
            options: [
              {
                text: "Menghubungkan konsep dasar dengan pendalaman mekanisme dan penerapannya",
                correct: true,
              },
              {
                text: "Jadi jalan buntu yang nggak bisa dikembangkan lagi",
                correct: false,
              },
            ],
          },
        },
        {
          id: "n_ext",
          title: `Mekanisme: ${secondSub}`,
          region: startReg,
          relationToOrigin: "extension",
          difficulty: "Intermediate",
          x: 55,
          y: 185,
          explored: true,
          mastered: false,
          summary: `Bedah lebih dekat bagaimana ${coreTopic} bekerja langkah demi langkah.`,
          levels: {
            simple: `Setelah dapat gambaran besarnya, di sini kita intip "mesin bagian dalam" dari ${secondSub} pelan-pelan.`,
            standard: `Pendalaman ${coreTopic} yang fokus ke tahapan proses, faktor efisiensi, dan interaksi komponen pada ${secondSub}.`,
            deep: `Mekanisme kausal serta regulasi umpan balik (feedback loop) yang menjaga kestabilan ${secondSub}.`,
          },
          formula: `Efisiensi Proses ∝ Faktor Penggerak / Hambatan`,
          application: `Dipakai untuk menganalisis kenapa perubahan kondisi bisa mengubah hasil ${coreTopic}.`,
          reference: `Literatur Lanjutan ${ctx.subject || ctx.interestDomain}`,
          quickCheck: {
            question: `Apa bedanya cabang Pendalaman (${secondSub}) dengan Prasyarat?`,
            options: [
              {
                text: "Cabang ini membedah mekanisme lebih rinci setelah konsep dasarnya dipahami",
                correct: true,
              },
              {
                text: "Cabang ini tidak butuh pemahaman awal sama sekali",
                correct: false,
              },
            ],
          },
        },
        {
          id: "n_app",
          title: `Penerapan di ${interest}`,
          region: appReg,
          relationToOrigin: "application",
          difficulty: "Intermediate",
          x: 350,
          y: 95,
          explored: true,
          mastered: false,
          summary: `Bagaimana konsep ${coreTopic} dipakai langsung di bidang ${interest}.`,
          levels: {
            simple: `Gimana ilmu "${coreTopic}" benar-benar dipakai praktisi di bidang "${interest}" untuk menyelesaikan masalah nyata.`,
            standard: `Penerapan prinsip ${coreTopic} pada konteks ${interest} (${ctx.targetGoal}), mengubah teori jadi solusi praktis.`,
            deep: `Optimasi parameter dan evaluasi kinerja sistem berbasis ${coreTopic} di sektor ${interest}.`,
          },
          formula: `${coreTopic} + ${interest} → Solusi Terapan`,
          application: `Menjawab langsung fokusmu: "${ctx.targetGoal}".`,
          reference: `Applied ${interest} Studies`,
          quickCheck: {
            question: `Kenapa cabang "${interest}" muncul di peta ini?`,
            options: [
              {
                text: "Karena topiknya nyambung langsung ke minat dan tujuan yang kamu pilih",
                correct: true,
              },
              {
                text: "Karena semua orang wajib masuk jurusan yang sama",
                correct: false,
              },
            ],
          },
        },
        {
          id: "n_related",
          title: "Keseimbangan & Regulasi Sistem",
          region: appReg,
          relationToOrigin: "related_concept",
          difficulty: "Intermediate",
          x: 470,
          y: 175,
          explored: false,
          mastered: false,
          summary: `Konsep sejajar yang melengkapi cara kerja ${coreTopic}.`,
          levels: {
            simple: `Ibarat belajar cara kerja mesin mobil sekalian belajar fungsi remnya: sama-sama penting biar sistem tetap stabil.`,
            standard: `Konsep pendamping yang menjelaskan bagaimana sistem menjaga keseimbangan dan merespons gangguan di sekitar ${coreTopic}.`,
            deep: `Analisis interaksi multivariabel dan kopling regulasi homeostasis di sekitar ${coreTopic}.`,
          },
          formula: `Keseimbangan Dinamis: ΔInput ≈ ΔRegulasi`,
          application: `Mencegah ketidakseimbangan sistem pada penerapan ${interest}.`,
          reference: "Kompendium Sistem Terpadu",
          quickCheck: {
            question: `Kenapa relasi ini bertipe Konsep Terkait, bukan Prasyarat?`,
            options: [
              {
                text: "Karena saling melengkapi tanpa urutan wajib sebelum atau sesudah",
                correct: true,
              },
              {
                text: "Karena tidak boleh dipelajari bersama",
                correct: false,
              },
            ],
          },
        },
        {
          id: "n_cross",
          title: `${crossLabel}: Pemodelan ${coreTopic}`,
          region: crossReg,
          relationToOrigin: "cross_disciplinary",
          difficulty: "Advanced",
          x: 650,
          y: 115,
          explored: false,
          mastered: false,
          summary: `Jembatan lintas bidang ke ${crossLabel} untuk pemodelan dan analisis.`,
          levels: {
            simple: `Bagaimana pendekatan dari ${crossLabel} membantu kita mensimulasikan "${coreTopic}" tanpa harus menebak-nebak.`,
            standard: `Gabungan ${coreTopic} dengan pemodelan kuantitatif dan simulasi di bidang ${crossLabel} untuk membaca pola tersembunyi.`,
            deep: `Penerapan pemodelan numerik dan analisis prediktif yang menyatukan ${startLabel} dengan ${crossLabel}.`,
          },
          formula: `Data Observasi → Model f(x) → Prediksi`,
          application: `Membuka wawasan lintas bidang antara ${ctx.subject || ctx.interestDomain} dan ${crossLabel}.`,
          reference: `Interdisciplinary Review · ${crossLabel}`,
          quickCheck: {
            question: `Apa manfaat cabang lintas bidang ini?`,
            options: [
              {
                text: `Menunjukkan bagaimana ${startLabel} bisa terhubung dengan ${crossLabel}`,
                correct: true,
              },
              {
                text: "Menghapus semua topik sains alam",
                correct: false,
              },
            ],
          },
        },
      ];

  const rawEdges: KnowledgeEdge[] = isEn
    ? [
        {
          id: "e-syn-1",
          source: "n_prereq",
          target: "root",
          relation: "prerequisite",
          reason: `Understanding "${firstSub}" gives you the foundation needed for "${coreTopic}".`,
        },
        {
          id: "e-syn-2",
          source: "root",
          target: "n_ext",
          relation: "extension",
          reason: `Zooms in from "${coreTopic}" to the inner mechanism of "${secondSub}".`,
        },
        {
          id: "e-syn-3",
          source: "root",
          target: "n_app",
          relation: "application",
          reason: `Shows how "${coreTopic}" translates into real work in "${interest}".`,
        },
        {
          id: "e-syn-4",
          source: "n_ext",
          target: "n_related",
          relation: "related_concept",
          reason: `The mechanism of "${secondSub}" pairs naturally with system stability and regulation.`,
        },
        {
          id: "e-syn-5",
          source: "n_app",
          target: "n_cross",
          relation: "cross_disciplinary",
          reason: `Practical problems in "${interest}" can be modeled and optimized using methods from ${crossLabel}.`,
        },
      ]
    : [
        {
          id: "e-syn-1",
          source: "n_prereq",
          target: "root",
          relation: "prerequisite",
          reason: `Pemahaman "${firstSub}" jadi dasar sebelum mendalami cara kerja "${coreTopic}".`,
        },
        {
          id: "e-syn-2",
          source: "root",
          target: "n_ext",
          relation: "extension",
          reason: `Membahas rincian mekanisme dan faktor pengatur "${secondSub}" dari "${coreTopic}".`,
        },
        {
          id: "e-syn-3",
          source: "root",
          target: "n_app",
          relation: "application",
          reason: `Menghubungkan teori "${coreTopic}" langsung ke penerapan di bidang "${interest}".`,
        },
        {
          id: "e-syn-4",
          source: "n_ext",
          target: "n_related",
          relation: "related_concept",
          reason: `Mekanisme "${secondSub}" berjalan berdampingan dengan prinsip regulasi keseimbangan sistem.`,
        },
        {
          id: "e-syn-5",
          source: "n_app",
          target: "n_cross",
          relation: "cross_disciplinary",
          reason: `Masalah terapan "${coreTopic}" di bidang "${interest}" bisa dianalisis dengan pendekatan dari ${crossLabel}.`,
        },
      ];

  const { nodes, edges, validation } = validateAndBuildGraph(rawNodes, rawEdges);
  const now = new Date().toISOString();

  return {
    id: `vault-${Date.now()}`,
    name: vaultName,
    createdAt: now,
    updatedAt: now,
    inputContext: ctx,
    overview,
    nodes,
    edges,
    validation,
  };
}

export async function generateVaultFromInput(
  vaultName: string,
  ctx: VaultInputContext,
  lang: EngineLanguage = "id"
): Promise<{ vault: KnowledgeVault; engineUsed: "gemini-api" | "deterministic-fallback" }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const isEn = lang === "en";

  if (apiKey) {
    try {
      const prompt = buildSystemPromptForExplore(vaultName, ctx, lang);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = JSON.parse(rawText);

        if (
          parsed &&
          Array.isArray(parsed.nodes) &&
          parsed.nodes.length >= 3 &&
          Array.isArray(parsed.edges)
        ) {
          const { nodes, edges, validation } = validateAndBuildGraph(
            parsed.nodes,
            parsed.edges
          );
          const now = new Date().toISOString();
          return {
            engineUsed: "gemini-api",
            vault: {
              id: `vault-${Date.now()}`,
              name: vaultName,
              createdAt: now,
              updatedAt: now,
              inputContext: ctx,
              overview: {
                title:
                  parsed.overview?.title ||
                  (isEn
                    ? `Starting Guide: ${ctx.chapter || ctx.targetGoal}`
                    : `Pengantar: ${ctx.chapter || ctx.targetGoal}`),
                startingRegion: parsed.overview?.startingRegion || "REG-01",
                summary:
                  parsed.overview?.summary ||
                  (isEn
                    ? "Initial concept map generated from your topic."
                    : "Ringkasan awal dari topik yang kamu eksplorasi."),
                keyConcepts: Array.isArray(parsed.overview?.keyConcepts)
                  ? parsed.overview.keyConcepts
                  : isEn
                    ? ["Core Idea", "Key Foundation", "Real-World Link"]
                    : ["Konsep Inti", "Dasar Penting", "Kaitan Lintas Bidang"],
                coreFormulaOrPrinciple:
                  parsed.overview?.coreFormulaOrPrinciple ||
                  (isEn
                    ? "Foundation → Mechanism → Application"
                    : "Fondasi → Mekanisme → Penerapan"),
                primaryReference:
                  parsed.overview?.primaryReference ||
                  "OpenStax & Academic References",
              },
              nodes,
              edges,
              validation,
            },
          };
        }
      }
    } catch {
      // Fall back cleanly to deterministic synthesis when API fails or quota runs out
    }
  }

  return {
    engineUsed: "deterministic-fallback",
    vault: synthesizeDeterministicVault(vaultName, ctx, lang),
  };
}

export async function expandNodeInVault(
  vault: KnowledgeVault,
  targetNodeId: string,
  lang: EngineLanguage = "id"
): Promise<{
  vault: KnowledgeVault;
  addedNodeIds: string[];
  engineUsed: "gemini-api" | "deterministic-fallback";
}> {
  const parentNode =
    vault.nodes.find((n) => n.id === targetNodeId) || vault.nodes[0];
  const suffix = Date.now().toString().slice(-4);
  const crossRegion = getAdjacentCrossRegion(parentNode.region);
  const isEn = lang === "en";
  const parentRegionName = regLabel(parentNode.region, lang);
  const crossRegionName = regLabel(crossRegion, lang);

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  if (apiKey) {
    try {
      const existingTitles = vault.nodes.map((n) => n.title).join(", ");
      const langInstruction = isEn
        ? "Write every title, summary, explanation level, quiz question, and edge reason in natural, readable English (using accurate scientific terms where needed)."
        : "Tulis seluruh judul, ringkasan, penjelasan, kuis, dan alasan hubungan dalam Bahasa Indonesia yang santai-rapi dan mudah dipahami (pakai istilah ilmiah hanya bila memang perlu).";

      const expandPrompt = `You are the Knowledge Mapping Engine for Curiora.
Vault: "${vault.name}" (Interest: "${vault.inputContext.interestDomain}", Goal: "${vault.inputContext.targetGoal}").
Node being expanded: "${parentNode.title}" (${parentRegionName}) — ${parentNode.summary}
Existing concepts (DO NOT duplicate): ${existingTitles}.

Task: Create EXACTLY 2 new branch concept nodes that deepen exploration naturally:
1) First node uses relation "extension" or "application" inside "${parentNode.region}" (${parentRegionName}) or an adjacent region.
2) Second node uses relation "cross_disciplinary" bridging into a different region (recommended: "${crossRegion}" = ${crossRegionName}) so learning opens fresh perspectives.
Rules:
- ${langInstruction}
- Never include internal codes like "REG-01", "Mode A", "Mode B", "BR-", or "NFR-" inside user-facing text.
- Every edge MUST include a concise, specific "reason" explaining why the two concepts connect.

Return ONLY raw JSON (no markdown fence):
{
  "nodes": [
    {
      "id": "n_exp_1_${suffix}",
      "title": "string",
      "region": "${parentNode.region}",
      "relationToOrigin": "extension",
      "difficulty": "Intermediate",
      "explored": true,
      "mastered": false,
      "summary": "string",
      "levels": { "simple": "string", "standard": "string", "deep": "string" },
      "formula": "string",
      "application": "string",
      "reference": "string",
      "quickCheck": { "question": "string", "options": [{"text": "string", "correct": true}, {"text": "string", "correct": false}] }
    },
    {
      "id": "n_exp_2_${suffix}",
      "title": "string",
      "region": "${crossRegion}",
      "relationToOrigin": "cross_disciplinary",
      "difficulty": "Advanced",
      "explored": false,
      "mastered": false,
      "summary": "string",
      "levels": { "simple": "string", "standard": "string", "deep": "string" },
      "formula": "string",
      "application": "string",
      "reference": "string",
      "quickCheck": { "question": "string", "options": [{"text": "string", "correct": true}, {"text": "string", "correct": false}] }
    }
  ],
  "edges": [
    { "id": "e_exp_1_${suffix}", "source": "${parentNode.id}", "target": "n_exp_1_${suffix}", "relation": "extension", "reason": "string" },
    { "id": "e_exp_2_${suffix}", "source": "${parentNode.id}", "target": "n_exp_2_${suffix}", "relation": "cross_disciplinary", "reason": "string" }
  ]
}`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: expandPrompt }] }],
          generationConfig: {
            temperature: 0.45,
            responseMimeType: "application/json",
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = JSON.parse(rawText);
        if (
          parsed &&
          Array.isArray(parsed.nodes) &&
          parsed.nodes.length >= 1 &&
          Array.isArray(parsed.edges)
        ) {
          const combinedNodes = [...vault.nodes, ...parsed.nodes];
          const combinedEdges = [...vault.edges, ...parsed.edges];
          const { nodes, edges, validation } = validateAndBuildGraph(
            combinedNodes,
            combinedEdges
          );
          const addedNodeIds = parsed.nodes
            .map((n: { id: string }) => n.id)
            .filter((id: string) => nodes.some((vn) => vn.id === id));

          if (addedNodeIds.length > 0) {
            return {
              engineUsed: "gemini-api",
              addedNodeIds,
              vault: {
                ...vault,
                updatedAt: new Date().toISOString(),
                nodes,
                edges,
                validation,
              },
            };
          }
        }
      }
    } catch {
      // Fallback cleanly to deterministic expansion if Gemini API fails or times out
    }
  }

  const baseParentTitle = parentNode.title.replace(
    /^(?:Deeper Dynamics:\s*|Pendalaman:\s*Dinamika\s*)+/i,
    ""
  );
  const newNodes: KnowledgeNode[] = isEn
    ? [
        {
          id: `n_exp_ext_${suffix}`,
          title: `Deeper Dynamics: ${baseParentTitle}`,
          region: parentNode.region,
          relationToOrigin: "extension",
          difficulty: "Advanced",
          x: Math.min(parentNode.x + 115, 840),
          y: Math.min(parentNode.y + 85, 460),
          explored: true,
          mastered: false,
          summary: `Next-level branch from "${parentNode.title}" in ${parentRegionName}.`,
          levels: {
            simple: `Zooms into how the finer parts of "${parentNode.title}" respond when conditions get pushed to the limit.`,
            standard: `Further exploration of "${parentNode.title}", unpacking regulatory loops, edge limits, and practical case scenarios.`,
            deep: `Kinetic behavior, molecular/systemic control, and higher-order parameter interactions governing "${parentNode.title}".`,
          },
          formula: `Dynamic Response: d(${formatFormulaSubject(parentNode.title)})/dt = f(Internal State, Environment)`,
          application: `Sharpens how you analyze complex cases around "${parentNode.title}" in ${vault.inputContext.interestDomain}.`,
          reference: `${parentNode.reference} (Extended Exploration)`,
          quickCheck: {
            question: `What does this deeper branch add to "${parentNode.title}"?`,
            options: [
              {
                text: "Reveals finer control mechanisms and edge behavior under changing conditions",
                correct: true,
              },
              {
                text: "Invalidates everything established in the parent concept",
                correct: false,
              },
            ],
          },
        },
        {
          id: `n_exp_cross_${suffix}`,
          title: `${crossRegionName} Angle: ${parentNode.title}`,
          region: crossRegion,
          relationToOrigin: "cross_disciplinary",
          difficulty: "Advanced",
          x: undefined as unknown as number,
          y: undefined as unknown as number,
          explored: false,
          mastered: false,
          summary: `Cross-field bridge connecting "${parentNode.title}" with ${crossRegionName}.`,
          levels: {
            simple: `How people in ${crossRegionName} borrow principles from "${parentNode.title}" to build fresh tools or insights.`,
            standard: `Interdisciplinary link uniting "${parentNode.title}" with modeling, instruments, or frameworks from ${crossRegionName}.`,
            deep: `Domain convergence between ${parentRegionName} and ${crossRegionName}, turning "${parentNode.title}" into an applied modern system.`,
          },
          formula: `Synergy: Concept (${parentRegionName}) × Approach (${crossRegionName})`,
          application: `Opens new research angles and cross-disciplinary workflows starting from "${parentNode.title}".`,
          reference: `Interdisciplinary Review — ${parentRegionName} × ${crossRegionName}`,
          quickCheck: {
            question: "Why is this node linked with a Cross-Disciplinary edge?",
            options: [
              {
                text: `Because it bridges "${parentNode.title}" from ${parentRegionName} into ${crossRegionName}`,
                correct: true,
              },
              {
                text: "Because it repeats the exact same basic definition word-for-word",
                correct: false,
              },
            ],
          },
        },
      ]
    : [
        {
          id: `n_exp_ext_${suffix}`,
          title: `Pendalaman: Dinamika ${baseParentTitle}`,
          region: parentNode.region,
          relationToOrigin: "extension",
          difficulty: "Advanced",
          x: Math.min(parentNode.x + 115, 840),
          y: Math.min(parentNode.y + 85, 460),
          explored: true,
          mastered: false,
          summary: `Cabang lanjutan dari "${parentNode.title}" di ${parentRegionName}.`,
          levels: {
            simple: `Melihat lebih dekat cara bagian-bagian kecil di "${parentNode.title}" bekerja saat kondisinya berubah drastis.`,
            standard: `Pembahasan lanjutan dari "${parentNode.title}" seputar mekanisme kontrol, batas adaptasi sistem, dan contoh kasus nyatanya.`,
            deep: `Analisis kinetika, regulasi molekuler atau sistemik, serta interaksi parameter yang mengatur "${parentNode.title}".`,
          },
          formula: `Respon Lanjut: d(${formatFormulaSubject(parentNode.title)})/dt = f(Parameter Internal, Lingkungan)`,
          application: `Membantu kamu membedah kasus yang lebih rumit dari "${parentNode.title}" sesuai minat ${vault.inputContext.interestDomain}.`,
          reference: `${parentNode.reference} (Lanjutan)`,
          quickCheck: {
            question: `Apa yang ditambah cabang ini terhadap pemahaman "${parentNode.title}"?`,
            options: [
              {
                text: "Mengupas mekanisme kontrol dan batas kerja konsep saat kondisinya lebih kompleks",
                correct: true,
              },
              {
                text: "Membatalkan semua dasar dari konsep sebelumnya",
                correct: false,
              },
            ],
          },
        },
        {
          id: `n_exp_cross_${suffix}`,
          title: `Kaitan ${crossRegionName}: ${parentNode.title}`,
          region: crossRegion,
          relationToOrigin: "cross_disciplinary",
          difficulty: "Advanced",
          x: undefined as unknown as number,
          y: undefined as unknown as number,
          explored: false,
          mastered: false,
          summary: `Jembatan lintas bidang dari "${parentNode.title}" menuju ${crossRegionName}.`,
          levels: {
            simple: `Bagaimana prinsip "${parentNode.title}" dipakai di bidang ${crossRegionName} untuk bikin solusi atau alat baru.`,
            standard: `Koneksi lintas bidang yang menggabungkan "${parentNode.title}" dengan metode analisis atau teknologi dari ${crossRegionName}.`,
            deep: `Konvergensi keilmuan antara ${parentRegionName} dan ${crossRegionName} untuk mengubah konsep "${parentNode.title}" menjadi sistem terapan modern.`,
          },
          formula: `Sinergi: Konsep (${parentRegionName}) × Pendekatan (${crossRegionName})`,
          application: `Membuka ide riset dan terapan baru lintas bidang dari titik awal "${parentNode.title}".`,
          reference: `Tinjauan Lintas Bidang — ${parentRegionName} × ${crossRegionName}`,
          quickCheck: {
            question: "Kenapa node ini terhubung sebagai garis Lintas Bidang?",
            options: [
              {
                text: `Karena idenya menyeberang dari ${parentRegionName} ke ${crossRegionName}`,
                correct: true,
              },
              {
                text: "Karena materinya cuma mengulang definisi awal tanpa konteks baru",
                correct: false,
              },
            ],
          },
        },
      ];

  const newEdges: KnowledgeEdge[] = isEn
    ? [
        {
          id: `e_exp_1_${suffix}`,
          source: parentNode.id,
          target: newNodes[0].id,
          relation: "extension",
          reason: `Builds directly on "${parentNode.title}" by unpacking how its internal controls respond under tougher conditions.`,
        },
        {
          id: `e_exp_2_${suffix}`,
          source: parentNode.id,
          target: newNodes[1].id,
          relation: "cross_disciplinary",
          reason: `Bridges "${parentNode.title}" from ${parentRegionName} into ${crossRegionName} for fresh applications.`,
        },
      ]
    : [
        {
          id: `e_exp_1_${suffix}`,
          source: parentNode.id,
          target: newNodes[0].id,
          relation: "extension",
          reason: `Mendalami "${parentNode.title}" dengan mengupas mekanisme kontrol dan batas kerjanya di ${parentRegionName}.`,
        },
        {
          id: `e_exp_2_${suffix}`,
          source: parentNode.id,
          target: newNodes[1].id,
          relation: "cross_disciplinary",
          reason: `Membawa prinsip "${parentNode.title}" dari ${parentRegionName} ke ${crossRegionName} untuk sudut pandang terapan baru.`,
        },
      ];

  const combinedNodes = [...vault.nodes, ...newNodes];
  const combinedEdges = [...vault.edges, ...newEdges];
  const { nodes, edges, validation } = validateAndBuildGraph(
    combinedNodes,
    combinedEdges
  );

  return {
    engineUsed: "deterministic-fallback",
    addedNodeIds: newNodes.map((n) => n.id),
    vault: {
      ...vault,
      updatedAt: new Date().toISOString(),
      nodes,
      edges,
      validation,
    },
  };
}
