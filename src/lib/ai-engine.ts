import { validateAndBuildGraph } from "@/lib/validator";
import {
  KnowledgeEdge,
  KnowledgeNode,
  KnowledgeVault,
  OverviewModule,
  RegionCode,
  VaultInputContext,
} from "@/types/knowledge";

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
  ctx: VaultInputContext
): string {
  const modeDesc =
    ctx.mode === "mode_a"
      ? `MODE A (Explore from Learning Material):
- Mata Pelajaran: ${ctx.subject || "Sains"}
- Judul Bab: ${ctx.chapter || ctx.targetGoal}
- Subbab: ${ctx.subchapters || "-"}
- Minat / Tujuan Personal: ${ctx.interestDomain} (${ctx.targetGoal})`
      : `MODE B (Explore from Interest & Goals):
- Bidang Minat: ${ctx.interestDomain}
- Topik / Hal yang Ingin Dipahami: ${ctx.targetGoal}
- Motivasi Eksplorasi: ${ctx.motivation || "Memahami konsep dari dasar hingga terapan"}`;

  return `Anda adalah Knowledge Intelligence Engine untuk aplikasi Trellis (Subtema Smart & Fun Education).
Tugas Anda: Memetakan input pengguna di dalam Vault "${vaultName}" menjadi struktur Directed Acyclic Graph (DAG) JSON yang mematuhi aturan berikut:
1. Gunakan Bahasa Indonesia yang akurat secara ilmiah namun mudah dipahami pelajar.
2. Petakan 6 node inti yang mencakup kombinasi:
   - 1 node "root" (materi asal pada Mode A, atau topik tujuan utama pada Mode B)
   - minimal 1 node "prerequisite" (konsep fondasi yang wajib dipahami lebih dulu - BR-02)
   - node "extension" (pendalaman konsep)
   - node "application" (penerapan nyata sesuai minat pengguna)
   - minimal 1 node "cross_disciplinary" yang menyeberang ke Knowledge Region berbeda (mencegah Filter Bubble - BR-04 & BR-05).
3. Kode region WAJIB salah satu dari: "REG-01" (Sains Alam/Hayati), "REG-02" (Kesehatan/Medis/Fisiologi), "REG-03" (Teknologi/Komputasi/AI), "REG-04" (Rekayasa/Teknik), "REG-05" (Matematika/Logika), "REG-06" (Sosial/Ekonomi/Humaniora).
4. Jenis relation pada edges WAJIB salah satu dari: "prerequisite", "extension", "application", "related_concept", "cross_disciplinary".
5. Setiap edge WAJIB memiliki "reason" spesifik yang menjelaskan alasan keterkaitan kedua konsep (BR-03).

Konteks Input Pengguna:
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
  ctx: VaultInputContext
): KnowledgeVault {
  const coreTopic =
    ctx.mode === "mode_a"
      ? `${ctx.chapter || "Materi Inti"} (${ctx.subject || "Kurikulum"})`
      : ctx.targetGoal || "Topik Eksplorasi";

  const interest = ctx.interestDomain || "Penerapan Sains & Teknologi";
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

  const firstSub = subitems[0] || `Prinsip Dasar ${coreTopic}`;
  const secondSub = subitems[1] || `Mekanisme Sistemik ${coreTopic}`;

  const overview: OverviewModule = {
    title: `Modul Fondasi Vault: ${coreTopic}`,
    startingRegion: startReg,
    summary:
      ctx.mode === "mode_a"
        ? `Memetakan materi "${coreTopic}" dari subbab [${
            ctx.subchapters || "konsep dasar"
          }] dan menghubungkannya secara personal dengan minat "${interest}". Peta pengetahuan ini memisahkan konsep prasyarat dari pendalaman materi serta membuka jembatan lintas disiplin.`
        : `Menyusun peta jalur belajar terarah untuk mencapai tujuan pemahaman "${coreTopic}" di bidang "${interest}", dimulai dari fondasi prasyarat wajib hingga aplikasi dan komputasi lintas bidang.`,
    keyConcepts: [
      firstSub,
      secondSub,
      `Integrasi ${coreTopic} × ${interest}`,
      "Eksplorasi Lintas Rumpun Ilmu",
    ],
    coreFormulaOrPrinciple: `Prinsip Fondasi (${startReg}) → Mekanisme Inti (${coreTopic}) → Aplikasi Terarah (${interest})`,
    primaryReference:
      "OpenStax Open Textbooks (CC BY 4.0) & Rujukan Kurikulum Nasional",
  };

  const rawNodes: KnowledgeNode[] = [
    {
      id: "n_prereq",
      title: `Fondasi Prasyarat: ${firstSub}`,
      region: startReg,
      relationToOrigin: "prerequisite",
      difficulty: "Basic",
      x: 45,
      y: 65,
      explored: true,
      mastered: false,
      summary: `Konsep dasar yang wajib dikuasai terlebih dahulu sebelum mendalami ${coreTopic}.`,
      levels: {
        simple: `Bayangkan "${firstSub}" sebagai pondasi bangunan: sebelum memahami keseluruhan ${coreTopic}, kita perlu mengenal komponen dasar dan aturan main paling sederhananya.`,
        standard: `Konsep prasyarat utama yang menjelaskan definisi operasional, variabel dasar, dan hukum pengatur pada ${firstSub} sebagai landasan ${coreTopic}.`,
        deep: `Analisis struktural dan aksiomatik terhadap parameter dasar ${firstSub} yang menjadi syarat batas (boundary condition) bagi berlakunya mekanisme ${coreTopic}.`,
      },
      formula: `Prasyarat Dasar: Pemahaman Variabel & Mekanisme ${firstSub}`,
      application: `Membantu pelajar menghindari kebingungan istilah saat membaca literatur lanjutan tentang ${coreTopic}.`,
      reference: `OpenStax Foundation Series — Pengantar ${
        ctx.subject || ctx.interestDomain
      }`,
      quickCheck: {
        question: `Mengapa konsep "${firstSub}" ditempatkan sebagai node Prerequisite (Prasyarat) sebelum masuk ke topik utama?`,
        options: [
          {
            text: `Karena konsep dasar pada ${firstSub} mutlak diperlukan untuk memahami mekanisme kerja ${coreTopic}`,
            correct: true,
          },
          {
            text: "Karena konsep ini sama sekali tidak berhubungan dengan topik utama",
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
      summary: `Titik pusat pemetaan pengetahuan di dalam Vault "${vaultName}".`,
      levels: {
        simple: `Inti persoalan dari "${coreTopic}" adalah bagaimana komponen-komponen di dalamnya saling bekerja sama menghasilkan perubahan yang bisa kita amati di kehidupan nyata.`,
        standard: `Sintesis konsep utama "${coreTopic}" yang mencakup struktur, mekanisme proses (${secondSub}), serta keterkaitannya dengan fenomena di bidang ${interest}.`,
        deep: `Kajian sistemik "${coreTopic}" melalui pendekatan interaksi antar-variabel, keseimbangan dinamis, dan implikasi teoritis lintas skala.`,
      },
      formula: `Input Sistem → Proses Inti (${secondSub}) → Keluaran & Adaptasi`,
      application: `Menjadi jangkar pengetahuan untuk menghubungkan materi belajar dengan minat pada ${interest}.`,
      reference: `Modul Kurikulum & OpenStax Reference — ${coreTopic}`,
      quickCheck: {
        question: `Apa peran utama node pusat "${coreTopic}" di dalam peta Knowledge Vault ini?`,
        options: [
          {
            text: "Menjadi titik jangkar yang menghubungkan konsep prasyarat dasar dengan cabang pendalaman dan aplikasi minat",
            correct: true,
          },
          {
            text: "Menjadi batas akhir belajar yang tidak bisa dikembangkan lagi",
            correct: false,
          },
        ],
      },
    },
    {
      id: "n_ext",
      title: `Pendalaman Mekanisme: ${secondSub}`,
      region: startReg,
      relationToOrigin: "extension",
      difficulty: "Intermediate",
      x: 55,
      y: 185,
      explored: true,
      mastered: false,
      summary: `Pendalaman langsung terhadap proses kerja dan dinamika internal dari ${coreTopic}.`,
      levels: {
        simple: `Setelah tahu gambaran besarnya, di node ini kita membedah 'mesin bagian dalam' dari ${secondSub} langkah demi langkah.`,
        standard: `Pendalaman materi dari ${coreTopic} yang memfokuskan bahasan pada tahapan proses, faktor yang memengaruhi laju/efisiensi, dan interaksi komponen pada ${secondSub}.`,
        deep: `Eksplorasi mekanisme kausal dan regulasi umpan balik (feedback loop) yang mengendalikan stabilitas ${secondSub}.`,
      },
      formula: `Efisiensi Proses ∝ Faktor Penggerak / Hambatan Sistemik`,
      application: `Digunakan untuk menganalisis mengapa perubahan kondisi lingkungan dapat mengubah hasil dari ${coreTopic}.`,
      reference: `Literatur Lanjutan ${ctx.subject || ctx.interestDomain}`,
      quickCheck: {
        question: `Apa perbedaan antara node Extension (${secondSub}) ini dengan node Prerequisite?`,
        options: [
          {
            text: "Node Extension memperdalam rincian mekanisme setelah konsep dasar topik utama dipahami",
            correct: true,
          },
          {
            text: "Node Extension tidak memerlukan pemahaman konsep dasar sama sekali",
            correct: false,
          },
        ],
      },
    },
    {
      id: "n_app",
      title: `Terapan ${interest}: Studi Kasus ${coreTopic}`,
      region: appReg,
      relationToOrigin: "application",
      difficulty: "Intermediate",
      x: 350,
      y: 95,
      explored: true,
      mastered: false,
      summary: `Penerapan langsung konsep ${coreTopic} yang disesuaikan dengan minat personal pengguna di bidang ${interest}.`,
      levels: {
        simple: `Bagaimana ilmu tentang "${coreTopic}" benar-benar dipakai oleh para praktisi di bidang "${interest}" untuk memecahkan masalah sehari-hari.`,
        standard: `Implementasi praktis prinsip ${coreTopic} pada konteks ${interest} (${ctx.targetGoal}), menunjukkan bagaimana teori buku diterjemahkan menjadi solusi nyata.`,
        deep: `Optimalisasi parameter teknis dan evaluasi kinerja sistem berbasis ${coreTopic} pada skenario dunia nyata di sektor ${interest}.`,
      },
      formula: `Teori ${coreTopic} + Konteks ${interest} → Solusi Terapan`,
      application: `Menjawab tujuan personal pengguna: "${ctx.targetGoal}".`,
      reference: `Journal of Applied ${interest} & Studi Kasus Terapan`,
      quickCheck: {
        question: `Mengapa cabang terapan ke bidang "${interest}" ini dimunculkan di dalam peta eksplorasimu?`,
        options: [
          {
            text: "Karena sistem mempersonalisasi cabang eksplorasi agar relevan dengan minat dan tujuan yang kamu masukkan",
            correct: true,
          },
          {
            text: "Karena seluruh pengguna diwajibkan mempelajari satu minat yang sama",
            correct: false,
          },
        ],
      },
    },
    {
      id: "n_related",
      title: `Konsep Terkait: Keseimbangan & Regulasi Sistem`,
      region: appReg,
      relationToOrigin: "related_concept",
      difficulty: "Intermediate",
      x: 470,
      y: 175,
      explored: false,
      mastered: false,
      summary: `Konsep sejajar yang memperkaya pemahaman ${coreTopic} tanpa menjadi syarat mutlak.`,
      levels: {
        simple: `Ibarat mempelajari cara kerja rem sekaligus mempelajari ban mobil: keduanya saling melengkapi agar sistem berjalan aman dan seimbang.`,
        standard: `Konsep pendamping yang menjelaskan bagaimana sistem mempertahankan stabilitas dan beradaptasi terhadap gangguan eksternal di sekitar ${coreTopic}.`,
        deep: `Analisis interaksi multi-variabel dan kopling sistemik antara ${coreTopic} dengan mekanisme regulasi pendamping.`,
      },
      formula: `Homeostasis / Keseimbangan Dinamis: ΔInput ≈ ΔRespon Regulasi`,
      application: `Mencegah kegagalan sistem pada penerapan ${interest}.`,
      reference: `Kompendium Sistem Terpadu & OpenStax Reference`,
      quickCheck: {
        question: `Mengapa hubungan antara node ini dan materi utama dilabeli sebagai Related Concept (bukan Prerequisite)?`,
        options: [
          {
            text: "Karena kedua konsep ini saling melengkapi secara sejajar, bukan urutan prasyarat wajib (sesuai BR-02)",
            correct: true,
          },
          {
            text: "Karena konsep ini dilarang dipelajari oleh siswa",
            correct: false,
          },
        ],
      },
    },
    {
      id: "n_cross",
      title: `Lintas Disiplin: Pemodelan Komputasi & AI pada ${coreTopic}`,
      region: crossReg,
      relationToOrigin: "cross_disciplinary",
      difficulty: "Advanced",
      x: 650,
      y: 115,
      explored: false,
      mastered: false,
      summary: `Jembatan Lintas-Region menuju ${crossReg} untuk mencegah Filter Bubble dan membuka wawasan bidang baru.`,
      levels: {
        simple: `Bagaimana komputer dan kecerdasan buatan (AI) dapat digunakan untuk mensimulasikan dan memprediksi perilaku "${coreTopic}" tanpa harus selalu mencoba manual di laboratorium.`,
        standard: `Integrasi lintas disiplin antara ${coreTopic} dengan pemodelan data, simulasi komputasi, dan analisis kuantitatif untuk menemukan pola yang sulit dilihat secara manual.`,
        deep: `Penerapan pemodelan numerik, machine learning, dan analisis prediktif terhadap parameter kompleks pada ${coreTopic} × ${interest}.`,
      },
      formula: `Data Observasi → Model Komputasi f(x) → Prediksi & Optimasi`,
      application: `Membuka wawasan karier interdisipliner yang menggabungkan ${
        ctx.subject || ctx.interestDomain
      } dengan Teknologi Komputasi & Sains Data.`,
      reference: `Interdisciplinary Computational Science & OpenCourseWare`,
      quickCheck: {
        question: `Apa tujuan utama hadirnya node Cross-Disciplinary (Lintas Rumpun Ilmu) di dalam Vault ini?`,
        options: [
          {
            text: "Mencegah Filter Bubble dengan menunjukkan bagaimana topik ini terhubung ke rumpun ilmu lain seperti Komputasi/Matematika",
            correct: true,
          },
          {
            text: "Mengganti seluruh materi sekolah dengan bahasa pemrograman",
            correct: false,
          },
        ],
      },
    },
  ];

  const rawEdges: KnowledgeEdge[] = [
    {
      id: "e-syn-1",
      source: "n_prereq",
      target: "root",
      relation: "prerequisite",
      reason: `Konsep dasar pada "${firstSub}" merupakan prasyarat wajib yang harus dipahami terlebih dahulu sebelum mempelajari mekanisme "${coreTopic}".`,
    },
    {
      id: "e-syn-2",
      source: "root",
      target: "n_ext",
      relation: "extension",
      reason: `Memperdalam bahasan "${coreTopic}" ke rincian mekanisme kerja dan faktor pengatur pada "${secondSub}".`,
    },
    {
      id: "e-syn-3",
      source: "root",
      target: "n_app",
      relation: "application",
      reason: `Menghubungkan prinsip teoritis "${coreTopic}" secara langsung dengan minat dan tujuan pengguna di bidang "${interest}".`,
    },
    {
      id: "e-syn-4",
      source: "n_ext",
      target: "n_related",
      relation: "related_concept",
      reason: `Mekanisme internal "${secondSub}" berkaitan erat dengan prinsip regulasi keseimbangan sistem secara keseluruhan.`,
    },
    {
      id: "e-syn-5",
      source: "n_app",
      target: "n_cross",
      relation: "cross_disciplinary",
      reason: `Jembatan Lintas-Region: Tantangan terapan "${coreTopic}" di bidang "${interest}" dapat dianalisis dan dioptimalkan menggunakan pendekatan Komputasi & Pemodelan Kuantitatif.`,
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
  ctx: VaultInputContext
): Promise<{ vault: KnowledgeVault; engineUsed: "gemini-api" | "deterministic-fallback" }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  if (apiKey) {
    try {
      const prompt = buildSystemPromptForExplore(vaultName, ctx);
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
                  `Modul Fondasi: ${ctx.chapter || ctx.targetGoal}`,
                startingRegion: parsed.overview?.startingRegion || "REG-01",
                summary:
                  parsed.overview?.summary ||
                  "Sintesis konsep awal hasil pemetaan AI.",
                keyConcepts: Array.isArray(parsed.overview?.keyConcepts)
                  ? parsed.overview.keyConcepts
                  : ["Konsep Inti", "Hubungan Prasyarat", "Aplikasi Lintas Bidang"],
                coreFormulaOrPrinciple:
                  parsed.overview?.coreFormulaOrPrinciple ||
                  "Fondasi → Mekanisme → Aplikasi",
                primaryReference:
                  parsed.overview?.primaryReference ||
                  "OpenStax & Rujukan Akademik Terverifikasi",
              },
              nodes,
              edges,
              validation,
            },
          };
        }
      }
    } catch {
      // Fallback ke deterministic engine di bawah bila API error/timeout (NFR-03)
    }
  }

  return {
    engineUsed: "deterministic-fallback",
    vault: synthesizeDeterministicVault(vaultName, ctx),
  };
}

export async function expandNodeInVault(
  vault: KnowledgeVault,
  targetNodeId: string
): Promise<{
  vault: KnowledgeVault;
  addedNodeIds: string[];
  engineUsed: "gemini-api" | "deterministic-fallback";
}> {
  const parentNode =
    vault.nodes.find((n) => n.id === targetNodeId) || vault.nodes[0];
  const suffix = Date.now().toString().slice(-4);
  const crossRegion = getAdjacentCrossRegion(parentNode.region);

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  if (apiKey) {
    try {
      const existingTitles = vault.nodes.map((n) => n.title).join(", ");
      const expandPrompt = `Anda adalah Knowledge Intelligence Engine untuk aplikasi Trellis.
Vault: "${vault.name}" (Minat pengguna: "${vault.inputContext.interestDomain}", Tujuan: "${vault.inputContext.targetGoal}").
Node yang sedang diekspansi: "${parentNode.title}" (${parentNode.region}) — ${parentNode.summary}
Daftar konsep yang SUDAH ada (DILARANG duplikasi): ${existingTitles}.

Tugas: Buat TEPAT 2 node konsep cabang baru yang memperdalam eksplorasi secara progresif tanpa batas (NFR-11):
1) Node pertama bertipe relasi "extension" atau "application" di dalam Region yang sesuai (${parentNode.region} atau sekitarnya),
2) Node kedua bertipe relasi "cross_disciplinary" yang menyeberang ke Knowledge Region berbeda (selain ${parentNode.region}, rekomendasi ${crossRegion}) untuk mencegah Filter Bubble.
Setiap edge WAJIB memiliki alasan ilmiah "reason" spesifik (BR-03).

Kembalikan HANYA JSON murni:
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
      // Fallback ke deterministic expansion di bawah bila API key invalid/kuota habis
    }
  }

  const newNodes: KnowledgeNode[] = [
    {
      id: `n_exp_ext_${suffix}`,
      title: `Pendalaman Lanjut: Dinamika Mikro pada ${parentNode.title}`,
      region: parentNode.region,
      relationToOrigin: "extension",
      difficulty: "Advanced",
      x: Math.min(parentNode.x + 115, 840),
      y: Math.min(parentNode.y + 85, 460),
      explored: true,
      mastered: false,
      summary: `Cabang baru hasil ekspansi dari "${parentNode.title}" di dalam rumpun ${parentNode.region}.`,
      levels: {
        simple: `Mengupas lebih dekat bagaimana faktor-faktor kecil di dalam "${parentNode.title}" bekerja saat kondisi berubah ekstrem.`,
        standard: `Ekspansi konsep lanjutan dari "${parentNode.title}" yang membahas mekanisme regulasi tingkat mikro, batas adaptasi sistem, serta studi kasus mendalam.`,
        deep: `Analisis kinetika, regulasi molekuler/sistemik, dan interaksi parameter orde tinggi yang mengontrol "${parentNode.title}".`,
      },
      formula: `Regulasi Lanjut: d(${parentNode.title.slice(0, 14)})/dt = f(Parameter Internal, Lingkungan)`,
      application: `Memperdalam penguasaan materi "${parentNode.title}" untuk analisis kasus kompleks sesuai minat ${vault.inputContext.interestDomain}.`,
      reference: `${parentNode.reference} (Advanced Module Expansion)`,
      quickCheck: {
        question: `Apa kontribusi cabang ekspansi ini terhadap pemahaman "${parentNode.title}"?`,
        options: [
          {
            text: "Menggali mekanisme regulasi dan batas adaptasi konsep secara lebih spesifik",
            correct: true,
          },
          {
            text: "Membatalkan seluruh hukum dasar pada konsep sebelumnya",
            correct: false,
          },
        ],
      },
    },
    {
      id: `n_exp_cross_${suffix}`,
      title: `Inovasi Lintas-Region (${crossRegion}): ${parentNode.title}`,
      region: crossRegion,
      relationToOrigin: "cross_disciplinary",
      difficulty: "Advanced",
      x: undefined as unknown as number, // akan ditempatkan otomatis di kuadran crossRegion oleh validator
      y: undefined as unknown as number,
      explored: false,
      mastered: false,
      summary: `Jembatan lintas-region dari "${parentNode.title}" (${parentNode.region}) menyeberang ke rumpun ${crossRegion}.`,
      levels: {
        simple: `Bagaimana para ahli di rumpun ${crossRegion} memanfaatkan prinsip "${parentNode.title}" untuk menciptakan teknologi atau metode baru.`,
        standard: `Eksplorasi lintas disiplin yang menghubungkan konsep "${parentNode.title}" dengan inovasi teknologi, instrumentasi, atau pemodelan di kuadran ${crossRegion}.`,
        deep: `Konvergensi keilmuan antara ${parentNode.region} dan ${crossRegion} dalam mentransformasi konsep "${parentNode.title}" menjadi sistem terapan modern.`,
      },
      formula: `Sinergi Lintas-Region: Konsep (${parentNode.region}) × Metodologi (${crossRegion})`,
      application: `Membuka peluang riset dan karier lintas bidang dari titik tolak "${parentNode.title}".`,
      reference: `Interdisciplinary Review (${parentNode.region} × ${crossRegion})`,
      quickCheck: {
        question: `Mengapa garis penghubung menuju node ini berjenis Cross-Disciplinary?`,
        options: [
          {
            text: `Karena node ini menyeberangkan eksplorasi dari rumpun ${parentNode.region} menuju rumpun ${crossRegion}`,
            correct: true,
          },
          {
            text: "Karena node ini merupakan bab pertama di buku sekolah dasar",
            correct: false,
          },
        ],
      },
    },
  ];

  const newEdges: KnowledgeEdge[] = [
    {
      id: `e_exp_1_${suffix}`,
      source: parentNode.id,
      target: newNodes[0].id,
      relation: "extension",
      reason: `Ekspansi bertahap dari node "${parentNode.title}": Membedah mekanisme regulasi dan dinamika lanjutan di dalam rumpun ${parentNode.region}.`,
    },
    {
      id: `e_exp_2_${suffix}`,
      source: parentNode.id,
      target: newNodes[1].id,
      relation: "cross_disciplinary",
      reason: `Penyebaran Lintas-Region (${parentNode.region} → ${crossRegion}): Menerapkan prinsip "${parentNode.title}" ke dalam inovasi lintas disiplin ilmu.`,
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
